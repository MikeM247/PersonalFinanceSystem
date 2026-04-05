import type {
  AuditEventRecord,
  CreateAuditEventInput,
  CreateUserInput,
  CreateUserSessionInput,
  UserRecord,
  UserSessionRecord,
} from "./types.js";

export interface UserRepository {
  create(input: CreateUserInput): Promise<UserRecord>;
  findByEmail(email: string): Promise<UserRecord | null>;
  findById(id: string): Promise<UserRecord | null>;
  updateLastLogin(userId: string, lastLoginAt: Date): Promise<void>;
}

export interface UserSessionRepository {
  create(input: CreateUserSessionInput): Promise<UserSessionRecord>;
  findByTokenHash(sessionTokenHash: Uint8Array): Promise<UserSessionRecord | null>;
  revoke(sessionId: string, revokedAt: Date, revokedReason: string | null): Promise<void>;
  countActive(at: Date): Promise<number>;
}

export interface AuditEventRepository {
  create(input: CreateAuditEventInput): Promise<AuditEventRecord>;
  listByUserId(userId: string): Promise<AuditEventRecord[]>;
}
