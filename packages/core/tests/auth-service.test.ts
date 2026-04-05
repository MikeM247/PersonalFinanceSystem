import assert from "node:assert/strict";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import {
  createNodeSqliteExecutor,
  applySqlMigrationFile,
  hashPassword,
  SqlAuditEventRepository,
  SqlUserRepository,
  SqlUserSessionRepository,
} from "#db/src/index.js";
import { AuthService, hashSessionToken, sanitizeObservabilityMetadata, verifyPassword } from "../src/index.js";
import type { SqlExecutor } from "#db/src/index.js";
import type { AuthTelemetry } from "../src/index.js";

function createRepositories() {
  const executor = createNodeSqliteExecutor(":memory:");
  const migrationPath = resolve(
    dirname(fileURLToPath(import.meta.url)),
    "../../../db/dist/migrations/0001_auth_persistence.sql",
  );

  applySqlMigrationFile(executor, migrationPath);

  return {
    executor,
    auditEvents: new SqlAuditEventRepository(executor),
    users: new SqlUserRepository(executor),
    sessions: new SqlUserSessionRepository(executor),
  };
}

async function createOwnerUser() {
  const repositories = createRepositories();
  const createdAt = new Date("2026-04-05T10:00:00.000Z");
  const passwordHash = await hashPassword("StrongPassword!123");

  const user = await repositories.users.create({
    id: "owner-1",
    email: "owner@example.com",
    passwordHash,
    createdAt,
    updatedAt: createdAt,
  });

  return {
    ...repositories,
    user,
    passwordHash,
  };
}

function createService(
  repositories: {
    auditEvents: SqlAuditEventRepository;
    users: SqlUserRepository;
    sessions: SqlUserSessionRepository;
  },
  overrides?: {
    now?: () => Date;
    generateId?: () => string;
    generateAuditEventId?: () => string;
    telemetry?: AuthTelemetry;
  },
) {
  return new AuthService({
    userRepository: repositories.users,
    sessionRepository: repositories.sessions,
    auditRepository: repositories.auditEvents,
    telemetry: overrides?.telemetry,
    config: {
      sessionSecret: "session-secret",
      cookieName: "pfs_session",
      cookieSecure: true,
      cookieSameSite: "strict",
      sessionIdleTimeoutMinutes: 120,
      sessionAbsoluteTimeoutHours: 168,
      loginWindowMinutes: 15,
      loginMaxAttempts: 5,
    },
    now: overrides?.now,
    generateId: overrides?.generateId,
    generateAuditEventId: overrides?.generateAuditEventId,
  });
}

function createTelemetryRecorder(): AuthTelemetry & {
  counters: Array<{ name: string; tags?: Record<string, string> }>;
  gauges: Array<{ name: string; value: number }>;
  histograms: Array<{ name: string; value: number }>;
  logs: Array<{ eventType: string; metadata: Record<string, unknown> }>;
} {
  const counters: Array<{ name: string; tags?: Record<string, string> }> = [];
  const gauges: Array<{ name: string; value: number }> = [];
  const histograms: Array<{ name: string; value: number }> = [];
  const logs: Array<{ eventType: string; metadata: Record<string, unknown> }> = [];

  return {
    counters,
    gauges,
    histograms,
    logs,
    incrementCounter(name, tags) {
      counters.push({ name, tags });
    },
    observeHistogram(name, value) {
      histograms.push({ name, value });
    },
    setGauge(name, value) {
      gauges.push({ name, value });
    },
    log(eventType, metadata) {
      logs.push({ eventType, metadata });
    },
  };
}

function listAuditEvents(executor: SqlExecutor): Array<{
  event_type: string;
  actor_identifier: string | null;
  request_id: string | null;
  metadata: string;
}> {
  return executor.query<{
    event_type: string;
    actor_identifier: string | null;
    request_id: string | null;
    metadata: string;
  }>(
    `SELECT event_type, actor_identifier, request_id, metadata
     FROM audit_events
     ORDER BY occurred_at ASC, id ASC`,
  ).rows;
}

async function testPasswordVerification(): Promise<void> {
  const passwordHash = await hashPassword("StrongPassword!123");
  assert.equal(await verifyPassword("StrongPassword!123", passwordHash), true);
  assert.equal(await verifyPassword("WrongPassword", passwordHash), false);
}

async function testAuthenticateSuccessCreatesSession(): Promise<void> {
  const { auditEvents, executor, users, sessions, user } = await createOwnerUser();
  const now = new Date("2026-04-05T11:00:00.000Z");
  const telemetry = createTelemetryRecorder();
  const service = createService(
    { auditEvents, users, sessions },
    {
      now: () => now,
      generateId: () => "session-1",
      generateAuditEventId: () => "audit-1",
      telemetry,
    },
  );

  const result = await service.authenticate({
    email: "OWNER@example.com",
    password: "StrongPassword!123",
    ipAddressHash: "ip-hash",
    userAgent: "test-agent",
    requestId: "request-1",
  });

  assert.equal(result.authenticated, true);
  if (!result.authenticated) {
    throw new Error("Expected authentication success.");
  }

  assert.equal(result.user.id, user.id);
  assert.equal(result.authorizationContext.userId, user.id);
  assert.equal(result.session.sessionId, "session-1");
  assert.equal(result.session.expiresAt.toISOString(), "2026-04-12T11:00:00.000Z");
  assert.equal(result.session.idleExpiresAt.toISOString(), "2026-04-05T13:00:00.000Z");

  const persistedSession = await sessions.findByTokenHash(hashSessionToken(result.session.token, "session-secret"));
  assert.ok(persistedSession);

  const updatedUser = await users.findById(user.id);
  assert.equal(updatedUser?.lastLoginAt?.toISOString(), now.toISOString());
  assert.deepEqual(telemetry.counters, [{ name: "auth_login_success_total", tags: undefined }]);
  assert.deepEqual(telemetry.gauges, [{ name: "auth_active_session_count", value: 1 }]);
  assert.equal(telemetry.logs[0]?.eventType, "auth.login.succeeded");

  const auditEventsStored = listAuditEvents(executor as SqlExecutor);
  assert.equal(auditEventsStored.length, 1);
  assert.equal(auditEventsStored[0]?.event_type, "auth.login.succeeded");
  assert.equal(auditEventsStored[0]?.request_id, "request-1");
  assert.deepEqual(JSON.parse(auditEventsStored[0]?.metadata ?? "{}"), {
    sessionId: "session-1",
    ipAddressHash: "ip-hash",
    userAgent: "test-agent",
  });
}

async function testAuthenticateFailureIsGeneric(): Promise<void> {
  const { auditEvents, executor, users, sessions } = await createOwnerUser();
  const telemetry = createTelemetryRecorder();
  const service = createService(
    { auditEvents, users, sessions },
    {
      generateAuditEventId: (() => {
        let index = 0;
        return () => `audit-failure-${++index}`;
      })(),
      telemetry,
    },
  );

  const wrongPassword = await service.authenticate({
    email: "owner@example.com",
    password: "not-the-password",
    requestId: "request-failure",
  });
  const missingUser = await service.authenticate({
    email: "missing@example.com",
    password: "StrongPassword!123",
  });

  assert.deepEqual(wrongPassword, { authenticated: false, reason: "invalid_credentials" });
  assert.deepEqual(missingUser, { authenticated: false, reason: "invalid_credentials" });
  assert.equal(
    telemetry.counters.filter((entry) => entry.name === "auth_login_failure_total").length,
    2,
  );

  const stored = listAuditEvents(executor as SqlExecutor);
  assert.equal(stored.length, 2);
  assert.equal(stored[0]?.event_type, "auth.login.failed");
  assert.equal(stored[0]?.request_id, "request-failure");
  assert.deepEqual(JSON.parse(stored[0]?.metadata ?? "{}"), {
    outcome: "invalid_credentials",
    ipAddressHash: null,
    userAgent: null,
  });
}

async function testValidateSessionRejectsRevokedAndExpiredSessions(): Promise<void> {
  const { auditEvents, executor, users, sessions } = await createOwnerUser();
  const baseTime = new Date("2026-04-05T11:00:00.000Z");
  let currentTime = baseTime;
  const telemetry = createTelemetryRecorder();
  const service = createService(
    { auditEvents, users, sessions },
    {
      now: () => currentTime,
      generateId: () => "session-1",
      generateAuditEventId: (() => {
        let index = 0;
        return () => `audit-sequence-${++index}`;
      })(),
      telemetry,
    },
  );

  const authenticated = await service.authenticate({
    email: "owner@example.com",
    password: "StrongPassword!123",
  });
  if (!authenticated.authenticated) {
    throw new Error("Expected authentication success.");
  }

  const validSession = await service.validateSession(authenticated.session.token);
  assert.equal(validSession.valid, true);

  const revoked = await service.revokeSession(authenticated.session.token);
  assert.deepEqual(revoked, { revoked: true });

  const revokedValidation = await service.validateSession(authenticated.session.token);
  assert.deepEqual(revokedValidation, { valid: false, reason: "invalid_session" });

  const secondService = createService(
    { auditEvents, users, sessions },
    {
      now: () => currentTime,
      generateId: () => "session-2",
      generateAuditEventId: (() => {
        let index = 100;
        return () => `audit-sequence-${++index}`;
      })(),
      telemetry,
    },
  );
  const secondAuthenticated = await secondService.authenticate({
    email: "owner@example.com",
    password: "StrongPassword!123",
  });
  if (!secondAuthenticated.authenticated) {
    throw new Error("Expected authentication success.");
  }

  currentTime = new Date("2026-04-12T11:00:00.000Z");
  const expiredValidation = await secondService.validateSession(secondAuthenticated.session.token, {
    requestId: "request-expired",
  });
  assert.deepEqual(expiredValidation, { valid: false, reason: "invalid_session" });
  assert.ok(
    telemetry.counters.some((entry) => entry.name === "auth_session_expired_total"),
  );
  assert.ok(
    telemetry.histograms.some((entry) => entry.name === "auth_session_validation_latency_ms"),
  );

  const stored = listAuditEvents(executor as SqlExecutor);
  assert.ok(stored.some((entry) => entry.event_type === "auth.session.expired"));
}

async function testValidateSessionRejectsDisabledUsers(): Promise<void> {
  const { auditEvents, executor, users, sessions, user } = await createOwnerUser();
  const now = new Date("2026-04-05T11:00:00.000Z");
  const service = createService(
    { auditEvents, users, sessions },
    {
      now: () => now,
      generateId: () => "session-1",
    },
  );

  const authenticated = await service.authenticate({
    email: "owner@example.com",
    password: "StrongPassword!123",
  });
  if (!authenticated.authenticated) {
    throw new Error("Expected authentication success.");
  }

  const disabledTimestamp = new Date("2026-04-05T11:05:00.000Z");
  (executor as SqlExecutor).run(
    "UPDATE users SET status = ?, updated_at = ? WHERE id = ?",
    ["disabled", disabledTimestamp.toISOString(), user.id],
  );

  const validation = await service.validateSession(authenticated.session.token);
  assert.deepEqual(validation, { valid: false, reason: "invalid_session" });
}

async function testLogoutAuditAndGauge(): Promise<void> {
  const { auditEvents, executor, users, sessions } = await createOwnerUser();
  const now = new Date("2026-04-05T11:00:00.000Z");
  const telemetry = createTelemetryRecorder();
  const service = createService(
    { auditEvents, users, sessions },
    {
      now: () => now,
      generateId: () => "session-logout",
      generateAuditEventId: (() => {
        let index = 0;
        return () => `audit-logout-${++index}`;
      })(),
      telemetry,
    },
  );

  const authenticated = await service.authenticate({
    email: "owner@example.com",
    password: "StrongPassword!123",
  });
  if (!authenticated.authenticated) {
    throw new Error("Expected authentication success.");
  }

  const revoked = await service.revokeSession(authenticated.session.token, "manual-logout", {
    requestId: "request-logout",
  });
  assert.deepEqual(revoked, { revoked: true });
  assert.deepEqual(telemetry.gauges.slice(-1)[0], {
    name: "auth_active_session_count",
    value: 0,
  });
  assert.equal(telemetry.logs.slice(-1)[0]?.eventType, "auth.logout");

  const stored = listAuditEvents(executor as SqlExecutor);
  assert.ok(stored.some((entry) => entry.event_type === "auth.logout"));
}

async function testObservabilityMetadataSanitization(): Promise<void> {
  assert.deepEqual(sanitizeObservabilityMetadata({
    password: "secret-password",
    sessionToken: "raw-token",
    nested: {
      cookieValue: "cookie",
      allowed: "ok",
    },
  }), {
    password: "[redacted]",
    sessionToken: "[redacted]",
    nested: {
      cookieValue: "[redacted]",
      allowed: "ok",
    },
  });
}

async function main(): Promise<void> {
  await testPasswordVerification();
  await testAuthenticateSuccessCreatesSession();
  await testAuthenticateFailureIsGeneric();
  await testValidateSessionRejectsRevokedAndExpiredSessions();
  await testValidateSessionRejectsDisabledUsers();
  await testLogoutAuditAndGauge();
  await testObservabilityMetadataSanitization();
  console.log("Core authentication service tests passed.");
}

void main().catch((error: unknown) => {
  console.error("Core authentication service tests failed.");
  console.error(error);
  process.exitCode = 1;
});
