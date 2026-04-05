import assert from "node:assert/strict";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import {
  applySqlMigrationFile,
  createNodeSqliteExecutor,
  hashPassword,
  SqlAuditEventRepository,
  SqlUserRepository,
  SqlUserSessionRepository,
} from "#db/src/index.js";
import { AuthService, hashSessionToken } from "#core/src/index.js";
import type { AuthTelemetry } from "#core/src/index.js";

import {
  createAuthApiHandlers,
  createAuthApiHandlersWithRateLimiter,
  InMemoryLoginAttemptRateLimiter,
} from "../src/index.js";

function createRepositories() {
  const executor = createNodeSqliteExecutor(":memory:");
  const migrationPath = resolve(
    dirname(fileURLToPath(import.meta.url)),
    "../../../../packages/db/dist/migrations/0001_auth_persistence.sql",
  );

  applySqlMigrationFile(executor, migrationPath);

  return {
    executor,
    auditEvents: new SqlAuditEventRepository(executor),
    users: new SqlUserRepository(executor),
    sessions: new SqlUserSessionRepository(executor),
  };
}

async function createApiHarness(now = new Date("2026-04-05T14:00:00.000Z")) {
  const repositories = createRepositories();
  const passwordHash = await hashPassword("StrongPassword!123");

  await repositories.users.create({
    id: "owner-1",
    email: "owner@example.com",
    passwordHash,
    createdAt: now,
    updatedAt: now,
  });

  const configuration = {
    sessionSecret: "session-secret",
    cookieName: "pfs_session",
    cookieSecure: true,
    cookieSameSite: "strict" as const,
    sessionIdleTimeoutMinutes: 120,
    sessionAbsoluteTimeoutHours: 168,
    loginWindowMinutes: 15,
    loginMaxAttempts: 2,
  };

  const telemetry = createTelemetryRecorder();
  const authService = new AuthService({
    userRepository: repositories.users,
    sessionRepository: repositories.sessions,
    auditRepository: repositories.auditEvents,
    telemetry,
    config: configuration,
    now: () => now,
    generateId: () => "session-1",
    generateAuditEventId: (() => {
      let index = 0;
      return () => `audit-${++index}`;
    })(),
  });

  return {
    repositories,
    configuration,
    authService,
    telemetry,
    handlers: createAuthApiHandlersWithRateLimiter(
      authService,
      configuration,
      new InMemoryLoginAttemptRateLimiter(configuration.loginWindowMinutes, configuration.loginMaxAttempts),
      {
        auditRepository: repositories.auditEvents,
        telemetry,
        now: () => now,
        generateAuditEventId: (() => {
          let index = 100;
          return () => `api-audit-${++index}`;
        })(),
      },
    ),
  };
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

function listAuditEvents(executor: ReturnType<typeof createNodeSqliteExecutor>): Array<{
  event_type: string;
  request_id: string | null;
  metadata: string;
}> {
  return executor.query<{
    event_type: string;
    request_id: string | null;
    metadata: string;
  }>(
    `SELECT event_type, request_id, metadata
     FROM audit_events
     ORDER BY occurred_at ASC, id ASC`,
  ).rows;
}

function getCookieValue(cookieValue: string | undefined): string {
  assert.ok(cookieValue);
  return cookieValue;
}

async function testLoginEndpointSuccess(): Promise<void> {
  const harness = await createApiHarness();
  const response = await harness.handlers.login({
    body: {
      email: "owner@example.com",
      password: "StrongPassword!123",
    },
    requestId: "request-login-success",
    ipAddressHash: "ip-hash",
    userAgent: "api-test",
  });

  assert.equal(response.status, 200);
  if (!("authenticated" in response.body)) {
    throw new Error("Expected authenticated login response.");
  }
  assert.equal(response.body.authenticated, true);
  assert.equal(response.cookies?.[0]?.name, "pfs_session");
  assert.equal(response.cookies?.[0]?.httpOnly, true);
  assert.equal(response.cookies?.[0]?.secure, true);
  assert.equal(response.cookies?.[0]?.sameSite, "strict");

  const persisted = await harness.repositories.sessions.findByTokenHash(
    hashSessionToken(getCookieValue(response.cookies?.[0]?.value), harness.configuration.sessionSecret),
  );
  assert.ok(persisted);
  assert.ok(
    harness.telemetry.counters.some((entry) => entry.name === "auth_login_success_total"),
  );

  const auditEvents = listAuditEvents(harness.repositories.executor);
  assert.ok(auditEvents.some((entry) => entry.event_type === "auth.login.succeeded"));
}

async function testLoginEndpointValidationAndUnauthorizedResponses(): Promise<void> {
  const harness = await createApiHarness();

  const invalidPayload = await harness.handlers.login({
    body: {
      email: "owner@example.com",
    },
  });
  assert.equal(invalidPayload.status, 400);

  const invalidCredentials = await harness.handlers.login({
    body: {
      email: "owner@example.com",
      password: "wrong-password",
    },
    requestId: "request-login-failure",
  });
  assert.equal(invalidCredentials.status, 401);
  assert.deepEqual(invalidCredentials.body, { error: "Invalid credentials." });
  assert.ok(
    harness.telemetry.counters.some((entry) => entry.name === "auth_login_failure_total"),
  );
}

async function testSessionEndpointAndLogout(): Promise<void> {
  const harness = await createApiHarness();
  const login = await harness.handlers.login({
    body: {
      email: "owner@example.com",
      password: "StrongPassword!123",
    },
    requestId: "request-login",
  });

  const token = getCookieValue(login.cookies?.[0]?.value);
  const session = await harness.handlers.getSession({
    cookies: {
      pfs_session: token,
    },
  });
  assert.equal(session.status, 200);
  assert.deepEqual(session.body.authenticated, true);

  const missingSession = await harness.handlers.getSession({ cookies: {} });
  assert.deepEqual(missingSession.body, { authenticated: false });

  const logout = await harness.handlers.logout({
    cookies: {
      pfs_session: token,
    },
    requestId: "request-logout",
  });
  assert.equal(logout.status, 200);
  assert.deepEqual(logout.body, { loggedOut: true });
  assert.equal(logout.cookies?.[0]?.maxAgeSeconds, 0);

  const revokedSession = await harness.handlers.getSession({
    cookies: {
      pfs_session: token,
    },
  });
  assert.deepEqual(revokedSession.body, { authenticated: false });

  const auditEvents = listAuditEvents(harness.repositories.executor);
  assert.ok(auditEvents.some((entry) => entry.event_type === "auth.logout"));
}

async function testAuthenticatedGuard(): Promise<void> {
  const harness = await createApiHarness();
  const login = await harness.handlers.login({
    body: {
      email: "owner@example.com",
      password: "StrongPassword!123",
    },
  });
  const token = getCookieValue(login.cookies?.[0]?.value);

  const protectedHandler = harness.handlers.withAuthenticatedRoute(async (request) => {
    return {
      status: 200,
      body: {
        userId: request.auth.userId,
      },
    };
  });

  const unauthorized = await protectedHandler({ cookies: {} });
  assert.equal(unauthorized.status, 401);
  assert.ok(
    harness.telemetry.counters.some((entry) => entry.name === "auth_unauthorized_request_total"),
  );

  const authorized = await protectedHandler({
    cookies: {
      pfs_session: token,
    },
  });
  assert.equal(authorized.status, 200);
  assert.deepEqual(authorized.body, { userId: "owner-1" });
}

async function testLoginThrottling(): Promise<void> {
  const harness = await createApiHarness();
  const telemetry = createTelemetryRecorder();
  const handlers = createAuthApiHandlersWithRateLimiter(
    harness.authService,
    harness.configuration,
    new InMemoryLoginAttemptRateLimiter(15, 2),
    {
      auditRepository: harness.repositories.auditEvents,
      telemetry,
      now: () => new Date("2026-04-05T14:00:00.000Z"),
      generateAuditEventId: (() => {
        let index = 200;
        return () => `api-audit-${++index}`;
      })(),
    },
  );

  const firstFailure = await handlers.login({
    body: {
      email: "owner@example.com",
      password: "wrong-password",
    },
  });
  const secondFailure = await handlers.login({
    body: {
      email: "owner@example.com",
      password: "wrong-password",
    },
  });
  const throttled = await handlers.login({
    body: {
      email: "owner@example.com",
      password: "wrong-password",
    },
  });

  assert.equal(firstFailure.status, 401);
  assert.equal(secondFailure.status, 401);
  assert.equal(throttled.status, 429);
  assert.deepEqual(throttled.body, { error: "Too many login attempts. Try again later." });
  assert.ok(
    telemetry.counters.some((entry) => entry.name === "auth_login_rate_limited_total"),
  );
}

async function testExpiredSessionGuardRejection(): Promise<void> {
  const baseTime = new Date("2026-04-05T14:00:00.000Z");
  let currentTime = baseTime;
  const harness = await createApiHarness(baseTime);
  const authService = new AuthService({
    userRepository: harness.repositories.users,
    sessionRepository: harness.repositories.sessions,
    auditRepository: harness.repositories.auditEvents,
    telemetry: harness.telemetry,
    config: harness.configuration,
    now: () => currentTime,
    generateId: () => "session-expiring",
    generateAuditEventId: (() => {
      let index = 300;
      return () => `audit-${++index}`;
    })(),
  });
  const handlers = createAuthApiHandlersWithRateLimiter(
    authService,
    harness.configuration,
    new InMemoryLoginAttemptRateLimiter(
      harness.configuration.loginWindowMinutes,
      harness.configuration.loginMaxAttempts,
    ),
    {
      auditRepository: harness.repositories.auditEvents,
      telemetry: harness.telemetry,
      now: () => currentTime,
      generateAuditEventId: (() => {
        let index = 400;
        return () => `api-audit-${++index}`;
      })(),
    },
  );

  const login = await handlers.login({
    body: {
      email: "owner@example.com",
      password: "StrongPassword!123",
    },
  });
  const token = getCookieValue(login.cookies?.[0]?.value);

  currentTime = new Date("2026-04-05T16:30:00.000Z");
  const protectedHandler = handlers.withAuthenticatedRoute(async (request) => {
    return {
      status: 200,
      body: { userId: request.auth.userId },
    };
  });

  const response = await protectedHandler({
    cookies: {
      pfs_session: token,
    },
    requestId: "request-expired-guard",
  });
  assert.equal(response.status, 401);
  assert.deepEqual(response.body, { error: "Authentication required." });

  const auditEvents = listAuditEvents(harness.repositories.executor);
  assert.ok(auditEvents.some((entry) => entry.event_type === "auth.session.expired"));
  assert.ok(auditEvents.some((entry) => entry.event_type === "auth.access.denied"));
  assert.ok(
    harness.telemetry.logs.some((entry) => entry.eventType === "auth.access.denied"),
  );
}

async function main(): Promise<void> {
  await testLoginEndpointSuccess();
  await testLoginEndpointValidationAndUnauthorizedResponses();
  await testSessionEndpointAndLogout();
  await testAuthenticatedGuard();
  await testLoginThrottling();
  await testExpiredSessionGuardRejection();
  console.log("Authentication API tests passed.");
}

void main().catch((error: unknown) => {
  console.error("Authentication API tests failed.");
  console.error(error);
  process.exitCode = 1;
});
