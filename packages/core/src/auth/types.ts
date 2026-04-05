export type UserRole = "owner";
export type UserStatus = "active" | "disabled";

export interface AuthUser {
  id: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  status: UserStatus;
  lastLoginAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthSessionRecord {
  id: string;
  userId: string;
  sessionTokenHash: Uint8Array;
  createdAt: Date;
  lastSeenAt: Date;
  expiresAt: Date;
  idleExpiresAt: Date;
  revokedAt: Date | null;
  revokedReason: string | null;
  ipAddressHash: string | null;
  userAgent: string | null;
}

export interface AuthorizationContext {
  userId: string;
  role: UserRole;
  email: string;
}

export interface AuthenticationSuccessResult {
  authenticated: true;
  user: Pick<AuthUser, "id" | "email" | "role">;
  authorizationContext: AuthorizationContext;
  session: {
    sessionId: string;
    token: string;
    expiresAt: Date;
    idleExpiresAt: Date;
  };
}

export interface AuthenticationFailureResult {
  authenticated: false;
  reason: "invalid_credentials";
}

export type AuthenticationResult = AuthenticationSuccessResult | AuthenticationFailureResult;

export interface SessionValidationSuccessResult {
  valid: true;
  user: Pick<AuthUser, "id" | "email" | "role">;
  authorizationContext: AuthorizationContext;
  session: AuthSessionRecord;
}

export interface SessionValidationFailureResult {
  valid: false;
  reason: "invalid_session";
}

export type SessionValidationResult = SessionValidationSuccessResult | SessionValidationFailureResult;

export interface RevokeSessionResult {
  revoked: boolean;
}
