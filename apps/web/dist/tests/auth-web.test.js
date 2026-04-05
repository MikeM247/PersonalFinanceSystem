import assert from "node:assert/strict";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { applySqlMigrationFile, createNodeSqliteExecutor, hashPassword, SqlUserRepository, SqlUserSessionRepository, } from "#db/src/index.js";
import { AuthService } from "#core/src/index.js";
import { createAuthApiHandlers } from "#api/src/index.js";
import { LoginPageController, ProtectedRouteController, SessionExperienceController } from "../src/index.js";
function createRepositories() {
    const executor = createNodeSqliteExecutor(":memory:");
    const migrationPath = resolve(dirname(fileURLToPath(import.meta.url)), "../../../../packages/db/dist/migrations/0001_auth_persistence.sql");
    applySqlMigrationFile(executor, migrationPath);
    return {
        users: new SqlUserRepository(executor),
        sessions: new SqlUserSessionRepository(executor),
    };
}
async function createWebHarness(now = new Date("2026-04-05T15:00:00.000Z")) {
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
        cookieSameSite: "strict",
        sessionIdleTimeoutMinutes: 120,
        sessionAbsoluteTimeoutHours: 168,
        loginWindowMinutes: 15,
        loginMaxAttempts: 5,
    };
    const authService = new AuthService({
        userRepository: repositories.users,
        sessionRepository: repositories.sessions,
        config: configuration,
        now: () => now,
        generateId: () => "session-1",
    });
    const handlers = createAuthApiHandlers(authService, configuration);
    let cookieJar = {};
    const client = {
        async login(input) {
            const response = await handlers.login({
                body: input,
                cookies: cookieJar,
            });
            for (const cookie of response.cookies ?? []) {
                cookieJar[cookie.name] = cookie.maxAgeSeconds === 0 ? undefined : cookie.value;
            }
            if (response.status !== 200 || !("authenticated" in response.body)) {
                return { ok: false, error: "Invalid credentials." };
            }
            return {
                ok: true,
                user: response.body.user,
                session: response.body.session,
            };
        },
        async getSession() {
            const response = await handlers.getSession({ cookies: cookieJar });
            return response.body;
        },
        async logout() {
            const response = await handlers.logout({ cookies: cookieJar });
            for (const cookie of response.cookies ?? []) {
                cookieJar[cookie.name] = cookie.maxAgeSeconds === 0 ? undefined : cookie.value;
            }
            return response.body;
        },
    };
    return {
        client,
        setNow(value) {
            now = value;
        },
    };
}
async function testLoginPageSuccessfulSubmission() {
    const harness = await createWebHarness();
    const controller = new LoginPageController(harness.client, "/dashboard");
    const result = await controller.submit("owner@example.com", "StrongPassword!123");
    assert.deepEqual(result, { ok: true, redirectTo: "/dashboard" });
    assert.equal(controller.state.submitting, false);
    assert.equal(controller.state.errorMessage, null);
    assert.equal(controller.state.password, "");
}
async function testLoginPageFailedSubmissionUsesGenericError() {
    const harness = await createWebHarness();
    const controller = new LoginPageController(harness.client, "/dashboard");
    const result = await controller.submit("owner@example.com", "wrong-password");
    assert.deepEqual(result, {
        ok: false,
        errorMessage: "Invalid email or password.",
    });
    assert.equal(controller.state.submitting, false);
    assert.equal(controller.state.errorMessage, "Invalid email or password.");
}
async function testProtectedRouteRedirectsWhenUnauthenticated() {
    const harness = await createWebHarness();
    const controller = new ProtectedRouteController(harness.client, "/dashboard", "/login");
    assert.deepEqual(controller.state, { kind: "loading" });
    const result = await controller.bootstrap();
    assert.deepEqual(result, {
        kind: "redirect",
        to: "/login?next=%2Fdashboard",
        reason: "unauthenticated",
        message: "Please sign in to continue.",
    });
}
async function testProtectedRouteBootstrapsAuthenticatedSession() {
    const harness = await createWebHarness();
    const login = new LoginPageController(harness.client, "/dashboard");
    await login.submit("owner@example.com", "StrongPassword!123");
    const controller = new ProtectedRouteController(harness.client, "/dashboard", "/login");
    const result = await controller.bootstrap();
    assert.equal(result.kind, "ready");
    if (result.kind !== "ready") {
        throw new Error("Expected ready state.");
    }
    assert.equal(result.user.id, "owner-1");
    assert.equal(result.user.email, "owner@example.com");
}
async function testProtectedRouteDoesNotExposeProtectedStateAfterSessionExpiry() {
    const harness = await createWebHarness();
    const login = new LoginPageController(harness.client, "/dashboard");
    await login.submit("owner@example.com", "StrongPassword!123");
    harness.setNow(new Date("2026-04-05T17:30:00.000Z"));
    const controller = new ProtectedRouteController(harness.client, "/dashboard", "/login");
    const bootstrap = await controller.bootstrap();
    assert.deepEqual(bootstrap, {
        kind: "redirect",
        to: "/login?next=%2Fdashboard",
        reason: "unauthenticated",
        message: "Please sign in to continue.",
    });
    const result = controller.handleExpiredSession();
    assert.deepEqual(result, {
        kind: "redirect",
        to: "/login?next=%2Fdashboard",
        reason: "expired",
        message: "Your session has expired. Please sign in again.",
    });
}
async function testLogoutRedirectsAndClearsProtectedState() {
    const harness = await createWebHarness();
    const login = new LoginPageController(harness.client, "/dashboard");
    await login.submit("owner@example.com", "StrongPassword!123");
    const controller = new ProtectedRouteController(harness.client, "/dashboard", "/login");
    const readyState = await controller.bootstrap();
    assert.equal(readyState.kind, "ready");
    const result = await controller.logout();
    assert.deepEqual(result, {
        kind: "redirect",
        to: "/login?next=%2Fdashboard",
        reason: "logged_out",
        message: "You have been signed out.",
    });
    const postLogoutBootstrap = await controller.bootstrap();
    assert.deepEqual(postLogoutBootstrap, {
        kind: "redirect",
        to: "/login?next=%2Fdashboard",
        reason: "unauthenticated",
        message: "Please sign in to continue.",
    });
}
async function testSessionExperienceMessagesAreClearAndNonTechnical() {
    const harness = await createWebHarness();
    const experience = new SessionExperienceController(harness.client, "/dashboard", "/login");
    assert.deepEqual(experience.buildUnauthenticatedRedirect(), {
        kind: "redirect",
        to: "/login?next=%2Fdashboard",
        reason: "unauthenticated",
        message: "Please sign in to continue.",
    });
    assert.deepEqual(experience.buildExpiredSessionRedirect(), {
        kind: "redirect",
        to: "/login?next=%2Fdashboard",
        reason: "expired",
        message: "Your session has expired. Please sign in again.",
    });
}
async function main() {
    await testLoginPageSuccessfulSubmission();
    await testLoginPageFailedSubmissionUsesGenericError();
    await testProtectedRouteRedirectsWhenUnauthenticated();
    await testProtectedRouteBootstrapsAuthenticatedSession();
    await testProtectedRouteDoesNotExposeProtectedStateAfterSessionExpiry();
    await testLogoutRedirectsAndClearsProtectedState();
    await testSessionExperienceMessagesAreClearAndNonTechnical();
    console.log("Authentication web flow tests passed.");
}
void main().catch((error) => {
    console.error("Authentication web flow tests failed.");
    console.error(error);
    process.exitCode = 1;
});
//# sourceMappingURL=auth-web.test.js.map