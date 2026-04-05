export type UserRole = "owner";
export type UserStatus = "active" | "disabled";
export interface UserRecord {
    id: string;
    email: string;
    passwordHash: string;
    role: UserRole;
    status: UserStatus;
    lastLoginAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
}
export interface CreateUserInput {
    id: string;
    email: string;
    passwordHash: string;
    role?: UserRole;
    status?: UserStatus;
    lastLoginAt?: Date | null;
    createdAt: Date;
    updatedAt: Date;
}
export interface UserSessionRecord {
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
export interface CreateUserSessionInput {
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
}
export interface AuditEventRecord {
    id: string;
    userId: string | null;
    actorIdentifier: string | null;
    eventType: string;
    occurredAt: Date;
    requestId: string | null;
    metadata: Record<string, unknown>;
}
export interface CreateAuditEventInput {
    id: string;
    userId?: string | null;
    actorIdentifier?: string | null;
    eventType: string;
    occurredAt: Date;
    requestId?: string | null;
    metadata: Record<string, unknown>;
}
