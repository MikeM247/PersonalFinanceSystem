import { randomUUID } from "node:crypto";
import { sanitizeObservabilityMetadata } from "#core/src/index.js";
import { createClearedSessionCookie, createSessionCookie } from "./cookies.js";
import { InMemoryLoginAttemptRateLimiter } from "./login-rate-limiter.js";
function invalidRequestResponse() {
    return {
        status: 400,
        body: { error: "Invalid request payload." },
    };
}
function unauthorizedResponse() {
    return {
        status: 401,
        body: { error: "Authentication required." },
    };
}
function throttledResponse() {
    return {
        status: 429,
        body: { error: "Too many login attempts. Try again later." },
    };
}
function getSessionToken(request, configuration) {
    return request.cookies?.[configuration.cookieName]?.trim() || null;
}
export function createAuthApiHandlers(authService, configuration) {
    const rateLimiter = new InMemoryLoginAttemptRateLimiter(configuration.loginWindowMinutes, configuration.loginMaxAttempts);
    return createAuthApiHandlersWithRateLimiter(authService, configuration, rateLimiter);
}
export function createAuthApiHandlersWithRateLimiter(authService, configuration, rateLimiter, observability) {
    const now = observability?.now ?? (() => new Date());
    const generateAuditEventId = observability?.generateAuditEventId ??
        (() => {
            return randomUUID();
        });
    async function recordAuditEvent(request, eventType, metadata) {
        if (!observability?.auditRepository) {
            return;
        }
        await observability.auditRepository.create({
            id: generateAuditEventId(),
            eventType,
            occurredAt: now(),
            requestId: request.requestId ?? null,
            metadata: sanitizeObservabilityMetadata({
                ...metadata,
                ipAddressHash: request.ipAddressHash ?? null,
                userAgent: request.userAgent ?? null,
            }),
        });
    }
    async function logEvent(eventType, metadata) {
        await observability?.telemetry?.log(eventType, sanitizeObservabilityMetadata(metadata));
    }
    async function incrementCounter(name, tags) {
        await observability?.telemetry?.incrementCounter(name, tags);
    }
    async function recordAccessDenied(request, reason) {
        await recordAuditEvent(request, "auth.access.denied", {
            reason,
        });
        await incrementCounter("auth_unauthorized_request_total", { reason });
        await logEvent("auth.access.denied", {
            requestId: request.requestId ?? null,
            reason,
        });
    }
    return {
        async login(request) {
            const body = request.body;
            if (!body || typeof body.email !== "string" || typeof body.password !== "string") {
                return invalidRequestResponse();
            }
            const attemptIdentifier = body.email.trim().toLowerCase();
            const now = new Date();
            if (rateLimiter.isLimited(attemptIdentifier, now)) {
                await incrementCounter("auth_login_rate_limited_total");
                await logEvent("auth.login.failed", {
                    requestId: request.requestId ?? null,
                    actorIdentifier: attemptIdentifier,
                    outcome: "rate_limited",
                });
                return throttledResponse();
            }
            const result = await authService.authenticate({
                email: body.email,
                password: body.password,
                ipAddressHash: request.ipAddressHash ?? null,
                userAgent: request.userAgent ?? null,
                requestId: request.requestId ?? null,
            });
            if (!result.authenticated) {
                rateLimiter.recordFailure(attemptIdentifier, now);
                return {
                    status: 401,
                    body: { error: "Invalid credentials." },
                };
            }
            rateLimiter.recordSuccess(attemptIdentifier);
            return {
                status: 200,
                body: {
                    authenticated: true,
                    user: result.user,
                    session: {
                        expiresAt: result.session.expiresAt.toISOString(),
                        idleExpiresAt: result.session.idleExpiresAt.toISOString(),
                    },
                },
                cookies: [createSessionCookie(result.session.token, configuration, result.session.expiresAt)],
            };
        },
        async logout(request) {
            const token = getSessionToken(request, configuration);
            if (token) {
                await authService.revokeSession(token, "manual-logout", {
                    requestId: request.requestId ?? null,
                });
            }
            return {
                status: 200,
                body: { loggedOut: true },
                cookies: [createClearedSessionCookie(configuration)],
            };
        },
        async getSession(request) {
            const token = getSessionToken(request, configuration);
            if (!token) {
                return {
                    status: 200,
                    body: { authenticated: false },
                };
            }
            const result = await authService.validateSession(token, {
                requestId: request.requestId ?? null,
            });
            if (!result.valid) {
                return {
                    status: 200,
                    body: { authenticated: false },
                    cookies: [createClearedSessionCookie(configuration)],
                };
            }
            return {
                status: 200,
                body: {
                    authenticated: true,
                    user: result.user,
                    session: {
                        expiresAt: result.session.expiresAt.toISOString(),
                        idleExpiresAt: result.session.idleExpiresAt.toISOString(),
                    },
                },
            };
        },
        withAuthenticatedRoute(handler) {
            return async (request) => {
                const token = getSessionToken(request, configuration);
                if (!token) {
                    await recordAccessDenied(request, "missing_session");
                    return unauthorizedResponse();
                }
                const result = await authService.validateSession(token, {
                    requestId: request.requestId ?? null,
                });
                if (!result.valid) {
                    await recordAccessDenied(request, "invalid_session");
                    return unauthorizedResponse();
                }
                return handler({
                    ...request,
                    auth: result.authorizationContext,
                });
            };
        },
    };
}
//# sourceMappingURL=handlers.js.map