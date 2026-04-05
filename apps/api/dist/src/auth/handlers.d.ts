import type { AuthAuditRepository, AuthRuntimeConfig, AuthService, AuthTelemetry } from "#core/src/index.js";
import type { ApiRequest, ApiResponse, ProtectedRequest } from "./http-types.js";
import { type LoginAttemptRateLimiter } from "./login-rate-limiter.js";
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
type SessionLookupBody = AuthenticatedSessionBody | {
    authenticated: false;
};
export interface AuthApiHandlers {
    login(request: ApiRequest<LoginRequestBody>): Promise<ApiResponse<AuthenticatedSessionBody | {
        error: string;
    }>>;
    logout(request: ApiRequest): Promise<ApiResponse<{
        loggedOut: boolean;
    }>>;
    getSession(request: ApiRequest): Promise<ApiResponse<SessionLookupBody>>;
    withAuthenticatedRoute<TBody, TResponse>(handler: (request: ProtectedRequest<TBody>) => Promise<ApiResponse<TResponse>>): (request: ApiRequest<TBody>) => Promise<ApiResponse<TResponse | {
        error: string;
    }>>;
}
export declare function createAuthApiHandlers(authService: AuthService, configuration: AuthRuntimeConfig): AuthApiHandlers;
export declare function createAuthApiHandlersWithRateLimiter(authService: AuthService, configuration: AuthRuntimeConfig, rateLimiter: LoginAttemptRateLimiter, observability?: AuthApiObservabilityDependencies): AuthApiHandlers;
export {};
