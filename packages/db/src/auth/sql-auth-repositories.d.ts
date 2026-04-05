import type { AuditEventRecord, CreateAuditEventInput, CreateUserInput, CreateUserSessionInput, UserRecord, UserSessionRecord } from "./types.js";
import type { AuditEventRepository, UserRepository, UserSessionRepository } from "./repository-contracts.js";
import type { SqlExecutor } from "./sqlite-executor.js";
export declare class SqlUserRepository implements UserRepository {
    private readonly executor;
    constructor(executor: SqlExecutor);
    create(input: CreateUserInput): Promise<UserRecord>;
    findByEmail(email: string): Promise<UserRecord | null>;
    findById(id: string): Promise<UserRecord | null>;
    updateLastLogin(userId: string, lastLoginAt: Date): Promise<void>;
}
export declare class SqlUserSessionRepository implements UserSessionRepository {
    private readonly executor;
    constructor(executor: SqlExecutor);
    create(input: CreateUserSessionInput): Promise<UserSessionRecord>;
    findByTokenHash(sessionTokenHash: Uint8Array): Promise<UserSessionRecord | null>;
    revoke(sessionId: string, revokedAt: Date, revokedReason: string | null): Promise<void>;
}
export declare class SqlAuditEventRepository implements AuditEventRepository {
    private readonly executor;
    constructor(executor: SqlExecutor);
    create(input: CreateAuditEventInput): Promise<AuditEventRecord>;
    listByUserId(userId: string): Promise<AuditEventRecord[]>;
}
