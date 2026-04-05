import { randomUUID } from "node:crypto";

import { sanitizeObservabilityMetadata } from "#core/src/index.js";
import type { AuthAuditRepository, AuthRuntimeConfig, AuthService, AuthTelemetry } from "#core/src/index.js";

import { createClearedSessionCookie, createSessionCookie } from "./cookies.js";
import type { ApiRequest, ApiResponse, ProtectedRequest } from "./http-types.js";
import { InMemoryLoginAttemptRateLimiter, type LoginAttemptRateLimiter } from "./login-rate-limiter.js";

interface AuthApiObservabilityDependencies {
  auditRepository?: AuthAuditRepository;
  telemetry?: AuthTelemetry;
  now?: () => Date;
  generateAuditEventId?: () => string;
}

interface LoginRequestBody {
  email?: unknown;
  password?: unknown;
}

interface AuthenticatedSessionBody {
  authenticated: true;
  user: {
    id: string;
    email: string;
    role: "owner";
  };
  session: {
    expiresAt: string;
    idleExpiresAt: string;
  };
}

type SessionLookupBody =
  | AuthenticatedSessionBody
  | {
      authenticated: false;
    };

export interface AuthApiHandlers {
  login(request: ApiRequest<LoginRequestBody>): Promise<ApiResponse<AuthenticatedSessionBody | { error: string }>>;
  logout(request: ApiRequest): Promise<ApiResponse<{ loggedOut: boolean }>>;
  getSession(request: ApiRequest): Promise<ApiResponse<SessionLookupBody>>;
  withAuthenticatedRoute<TBody, TResponse>(
    handler: (request: ProtectedRequest<TBody>) => Promise<ApiResponse<TResponse>>,
  ): (request: ApiRequest<TBody>) => Promise<ApiResponse<TResponse | { error: string }>>;
}

function invalidRequestResponse(): ApiResponse<{ error: string }> {
  return {
    status: 400,
    body: { error: "Invalid request payload." },
  };
}

function unauthorizedResponse(): ApiResponse<{ error: string }> {
  return {
    status: 401,
    body: { error: "Authentication required." },
  };
}

function throttledResponse(): ApiResponse<{ error: string }> {
  return {
    status: 429,
    body: { error: "Too many login attempts. Try again later." },
  };
}

function getSessionToken(request: ApiRequest, configuration: AuthRuntimeConfig): string | null {
  return request.cookies?.[configuration.cookieName]?.trim() || null;
}

export function createAuthApiHandlers(authService: AuthService, configuration: AuthRuntimeConfig): AuthApiHandlers {
  const rateLimiter = new InMemoryLoginAttemptRateLimiter(
    configuration.loginWindowMinutes,
    configuration.loginMaxAttempts,
  );
  return createAuthApiHandlersWithRateLimiter(authService, configuration, rateLimiter);
}

export function createAuthApiHandlersWithRateLimiter(
  authService: AuthService,
  configuration: AuthRuntimeConfig,
  rateLimiter: LoginAttemptRateLimiter,
  observability?: AuthApiObservabilityDependencies,
): AuthApiHandlers {
  const now = observability?.now ?? (() => new Date());
  const generateAuditEventId =
    observability?.generateAuditEventId ??
    (() => {
      return randomUUID();
    });

  async function recordAuditEvent(
    request: ApiRequest,
    eventType: string,
    metadata: Record<string, unknown>,
  ): Promise<void> {
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
      }) as Record<string, unknown>,
    });
  }

  async function logEvent(eventType: string, metadata: Record<string, unknown>): Promise<void> {
    await observability?.telemetry?.log(
      eventType,
      sanitizeObservabilityMetadata(metadata) as Record<string, unknown>,
    );
  }

  async function incrementCounter(name: string, tags?: Record<string, string>): Promise<void> {
    await observability?.telemetry?.incrementCounter(name, tags);
  }

  async function recordAccessDenied(request: ApiRequest, reason: "missing_session" | "invalid_session"): Promise<void> {
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
