import { readFileSync } from "node:fs";
import assert from "node:assert/strict";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import {
  applySqlMigrationFile,
  hashPassword,
  loadAuthRuntimeConfig,
  loadOwnerProvisioningConfig,
  normalizeEmail,
  NodeSqliteExecutor,
  provisionOwnerAccount,
  SqlAuditEventRepository,
  SqlUserRepository,
  SqlUserSessionRepository,
} from "../src/index.js";
import { DatabaseSync } from "node:sqlite";

function createExecutor(): NodeSqliteExecutor {
  const database = new DatabaseSync(":memory:");
  const migrationPath = resolve(
    dirname(fileURLToPath(import.meta.url)),
    "../migrations/0001_auth_persistence.sql",
  );

  const executor = new NodeSqliteExecutor(database);
  applySqlMigrationFile(executor, migrationPath);
  return executor;
}

async function testNormalizeEmail(): Promise<void> {
  assert.equal(normalizeEmail("  OWNER@Example.COM "), "owner@example.com");
}

async function testUserRepository(): Promise<void> {
  const executor = createExecutor();
  const users = new SqlUserRepository(executor);
  const createdAt = new Date("2026-04-05T08:00:00.000Z");

  const created = await users.create({
    id: "user-1",
    email: " Owner@Example.COM ",
    passwordHash: "hashed-password",
    createdAt,
    updatedAt: createdAt,
  });

  assert.equal(created.email, "owner@example.com");
  assert.equal(created.role, "owner");
  assert.equal(created.status, "active");

  const found = await users.findByEmail("OWNER@example.com");
  assert.ok(found);
  assert.equal(found.id, "user-1");

  const lastLoginAt = new Date("2026-04-05T09:15:00.000Z");
  await users.updateLastLogin("user-1", lastLoginAt);

  const updated = await users.findById("user-1");
  assert.ok(updated);
  assert.equal(updated.lastLoginAt?.toISOString(), lastLoginAt.toISOString());

  await assert.rejects(
    users.create({
      id: "user-2",
      email: "owner@example.com",
      passwordHash: "other-hash",
      createdAt,
      updatedAt: createdAt,
    }),
  );
}

async function testSessionRepository(): Promise<void> {
  const executor = createExecutor();
  const users = new SqlUserRepository(executor);
  const sessions = new SqlUserSessionRepository(executor);
  const now = new Date("2026-04-05T08:00:00.000Z");

  await users.create({
    id: "user-1",
    email: "owner@example.com",
    passwordHash: "hashed-password",
    createdAt: now,
    updatedAt: now,
  });

  const sessionHash = new Uint8Array([1, 2, 3, 4]);
  const created = await sessions.create({
    id: "session-1",
    userId: "user-1",
    sessionTokenHash: sessionHash,
    createdAt: now,
    lastSeenAt: now,
    expiresAt: new Date("2026-04-12T08:00:00.000Z"),
    idleExpiresAt: new Date("2026-04-05T10:00:00.000Z"),
  });

  assert.equal(created.userId, "user-1");
  assert.equal(Array.from(created.sessionTokenHash).join(","), "1,2,3,4");

  const found = await sessions.findByTokenHash(sessionHash);
  assert.ok(found);
  assert.equal(found.revokedAt, null);
  assert.equal(await sessions.countActive(new Date("2026-04-05T08:15:00.000Z")), 1);

  const revokedAt = new Date("2026-04-05T08:30:00.000Z");
  await sessions.revoke("session-1", revokedAt, "manual-logout");

  const revoked = await sessions.findByTokenHash(sessionHash);
  assert.ok(revoked);
  assert.equal(revoked.revokedAt?.toISOString(), revokedAt.toISOString());
  assert.equal(revoked.revokedReason, "manual-logout");
  assert.equal(await sessions.countActive(new Date("2026-04-05T08:31:00.000Z")), 0);
}

async function testAuditEventRepository(): Promise<void> {
  const executor = createExecutor();
  const users = new SqlUserRepository(executor);
  const auditEvents = new SqlAuditEventRepository(executor);
  const now = new Date("2026-04-05T08:00:00.000Z");

  await users.create({
    id: "user-1",
    email: "owner@example.com",
    passwordHash: "hashed-password",
    createdAt: now,
    updatedAt: now,
  });

  await auditEvents.create({
    id: "audit-1",
    userId: "user-1",
    actorIdentifier: "owner@example.com",
    eventType: "auth.login.succeeded",
    occurredAt: new Date("2026-04-05T08:10:00.000Z"),
    requestId: "request-1",
    metadata: { outcome: "success", requestId: "request-1" },
  });

  await auditEvents.create({
    id: "audit-2",
    userId: "user-1",
    actorIdentifier: "owner@example.com",
    eventType: "auth.logout",
    occurredAt: new Date("2026-04-05T08:20:00.000Z"),
    requestId: "request-2",
    metadata: { outcome: "success", requestId: "request-2" },
  });

  const stored = await auditEvents.listByUserId("user-1");
  assert.equal(stored.length, 2);
  assert.deepEqual(stored.map((event) => event.eventType), [
    "auth.login.succeeded",
    "auth.logout",
  ]);
  assert.deepEqual(stored[0]?.metadata, { outcome: "success", requestId: "request-1" });
}

async function testAuthConfigLoading(): Promise<void> {
  const runtimeConfig = loadAuthRuntimeConfig({
    AUTH_SESSION_SECRET: "session-secret",
    AUTH_COOKIE_NAME: "pfs_session",
    AUTH_COOKIE_SECURE: "true",
    AUTH_COOKIE_SAME_SITE: "strict",
    AUTH_SESSION_IDLE_TIMEOUT_MINUTES: "120",
    AUTH_SESSION_ABSOLUTE_TIMEOUT_HOURS: "168",
    AUTH_LOGIN_WINDOW_MINUTES: "15",
    AUTH_LOGIN_MAX_ATTEMPTS: "5",
  });

  assert.equal(runtimeConfig.cookieSecure, true);
  assert.equal(runtimeConfig.cookieSameSite, "strict");
  assert.equal(runtimeConfig.sessionIdleTimeoutMinutes, 120);
  assert.equal(runtimeConfig.loginWindowMinutes, 15);
  assert.equal(runtimeConfig.loginMaxAttempts, 5);

  const ownerConfig = loadOwnerProvisioningConfig({
    ...runtimeConfigToEnvironment(runtimeConfig),
    AUTH_DATABASE_PATH: "./data/test.sqlite",
    AUTH_OWNER_EMAIL: "owner@example.com",
    AUTH_OWNER_PASSWORD: "StrongPassword!123",
  });

  assert.equal(ownerConfig.databasePath, "./data/test.sqlite");
  assert.equal(ownerConfig.ownerId, "owner-1");

  assert.throws(
    () =>
      loadAuthRuntimeConfig({
        AUTH_SESSION_SECRET: "session-secret",
        AUTH_COOKIE_NAME: "pfs_session",
        AUTH_COOKIE_SECURE: "maybe",
        AUTH_COOKIE_SAME_SITE: "strict",
        AUTH_SESSION_IDLE_TIMEOUT_MINUTES: "120",
        AUTH_SESSION_ABSOLUTE_TIMEOUT_HOURS: "168",
        AUTH_LOGIN_WINDOW_MINUTES: "15",
        AUTH_LOGIN_MAX_ATTEMPTS: "5",
      }),
  );
}

function runtimeConfigToEnvironment(configuration: ReturnType<typeof loadAuthRuntimeConfig>): NodeJS.ProcessEnv {
  return {
    AUTH_SESSION_SECRET: configuration.sessionSecret,
    AUTH_COOKIE_NAME: configuration.cookieName,
    AUTH_COOKIE_SECURE: String(configuration.cookieSecure),
    AUTH_COOKIE_SAME_SITE: configuration.cookieSameSite,
    AUTH_SESSION_IDLE_TIMEOUT_MINUTES: String(configuration.sessionIdleTimeoutMinutes),
    AUTH_SESSION_ABSOLUTE_TIMEOUT_HOURS: String(configuration.sessionAbsoluteTimeoutHours),
    AUTH_LOGIN_WINDOW_MINUTES: String(configuration.loginWindowMinutes),
    AUTH_LOGIN_MAX_ATTEMPTS: String(configuration.loginMaxAttempts),
  };
}

async function testPasswordHashing(): Promise<void> {
  const hashedPassword = await hashPassword("StrongPassword!123");
  assert.notEqual(hashedPassword, "StrongPassword!123");
  assert.match(hashedPassword, /^argon2id\$m=65536,t=3,p=1\$/);
  await assert.rejects(() => hashPassword("   "));
}

async function testOwnerProvisioning(): Promise<void> {
  const executor = createExecutor();
  const users = new SqlUserRepository(executor);

  const created = await provisionOwnerAccount(
    {
      ownerId: "owner-1",
      ownerEmail: "Owner@Example.com",
      ownerPassword: "StrongPassword!123",
    },
    {
      userRepository: users,
      hashPassword,
      now: () => new Date("2026-04-05T09:00:00.000Z"),
    },
  );

  assert.equal(created.created, true);
  assert.equal(created.user.email, "owner@example.com");
  assert.match(created.user.passwordHash, /^argon2id\$/);

  const secondRun = await provisionOwnerAccount(
    {
      ownerId: "owner-1",
      ownerEmail: "owner@example.com",
      ownerPassword: "StrongPassword!123",
    },
    {
      userRepository: users,
      hashPassword,
      now: () => new Date("2026-04-05T09:00:00.000Z"),
    },
  );

  assert.equal(secondRun.created, false);
  assert.equal(secondRun.user.id, created.user.id);
}

async function testMigrationApplicationIsRepeatable(): Promise<void> {
  const executor = createExecutor();
  const migrationPath = resolve(
    dirname(fileURLToPath(import.meta.url)),
    "../migrations/0001_auth_persistence.sql",
  );

  applySqlMigrationFile(executor, migrationPath);

  const users = new SqlUserRepository(executor);
  const created = await users.create({
    id: "user-repeatable",
    email: "repeatable@example.com",
    passwordHash: "hash",
    createdAt: new Date("2026-04-05T08:00:00.000Z"),
    updatedAt: new Date("2026-04-05T08:00:00.000Z"),
  });

  assert.equal(created.email, "repeatable@example.com");
}

async function main(): Promise<void> {
  await testNormalizeEmail();
  await testUserRepository();
  await testSessionRepository();
  await testAuditEventRepository();
  await testAuthConfigLoading();
  await testPasswordHashing();
  await testOwnerProvisioning();
  await testMigrationApplicationIsRepeatable();
  console.log("Auth persistence repository tests passed.");
}

void main().catch((error: unknown) => {
  console.error("Auth persistence repository tests failed.");
  console.error(error);
  process.exitCode = 1;
});
