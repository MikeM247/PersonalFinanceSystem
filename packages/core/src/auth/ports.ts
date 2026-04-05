import type { AuthSessionRecord, AuthUser } from "./types.js";

export interface AuthUserRepository {
  findByEmail(email: string): Promise<AuthUser | null>;
  findById(id: string): Promise<AuthUser | null>;
  updateLastLogin(userId: string, lastLoginAt: Date): Promise<void>;
}

export interface AuthSessionRepository {
  create(input: {
    id: string;
    userId: string;
    sessionTokenHash: Uint8Array;
    createdAt: Date;
    lastSeenAt: Date;
    expiresAt: Date;
    idleExpiresAt: Date;
    revokedAt?: Date | null;
    revokedReason?: string | null;
    ipAddressHash?: string | null;
    userAgent?: string | null;
  }): Promise<AuthSessionRecord>;
  findByTokenHash(sessionTokenHash: Uint8Array): Promise<AuthSessionRecord | null>;
  revoke(sessionId: string, revokedAt: Date, revokedReason: string | null): Promise<void>;
  countActive(at: Date): Promise<number>;
}

export interface CreateAuthAuditEventInput {
  id: string;
  userId?: string | null;
  actorIdentifier?: string | null;
  eventType: string;
  occurredAt: Date;
  requestId?: string | null;
  metadata: Record<string, unknown>;
}

export interface AuthAuditRepository {
  create(input: CreateAuthAuditEventInput): Promise<unknown>;
}

export interface AuthTelemetry {
  incrementCounter(name: string, tags?: Record<string, string>): Promise<void> | void;
  observeHistogram(name: string, value: number, tags?: Record<string, string>): Promise<void> | void;
  setGauge(name: string, value: number, tags?: Record<string, string>): Promise<void> | void;
  log(eventType: string, metadata: Record<string, unknown>): Promise<void> | void;
}
