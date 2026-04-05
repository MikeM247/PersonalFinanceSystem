import { normalizeEmail } from "./normalize-email.js";
function toIsoString(value) {
    if (!value) {
        return null;
    }
    return value.toISOString();
}
function mapUser(row) {
    return {
        id: row.id,
        email: row.email,
        passwordHash: row.password_hash,
        role: row.role,
        status: row.status,
        lastLoginAt: row.last_login_at ? new Date(row.last_login_at) : null,
        createdAt: new Date(row.created_at),
        updatedAt: new Date(row.updated_at),
    };
}
function mapSession(row) {
    return {
        id: row.id,
        userId: row.user_id,
        sessionTokenHash: row.session_token_hash,
        createdAt: new Date(row.created_at),
        lastSeenAt: new Date(row.last_seen_at),
        expiresAt: new Date(row.expires_at),
        idleExpiresAt: new Date(row.idle_expires_at),
        revokedAt: row.revoked_at ? new Date(row.revoked_at) : null,
        revokedReason: row.revoked_reason,
        ipAddressHash: row.ip_address_hash,
        userAgent: row.user_agent,
    };
}
function mapAuditEvent(row) {
    return {
        id: row.id,
        userId: row.user_id,
        actorIdentifier: row.actor_identifier,
        eventType: row.event_type,
        occurredAt: new Date(row.occurred_at),
        requestId: row.request_id,
        metadata: JSON.parse(row.metadata),
    };
}
export class SqlUserRepository {
    executor;
    constructor(executor) {
        this.executor = executor;
    }
    async create(input) {
        const normalizedEmail = normalizeEmail(input.email);
        this.executor.run(`INSERT INTO users (id, email, password_hash, role, status, last_login_at, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`, [
            input.id,
            normalizedEmail,
            input.passwordHash,
            input.role ?? "owner",
            input.status ?? "active",
            toIsoString(input.lastLoginAt),
            input.createdAt.toISOString(),
            input.updatedAt.toISOString(),
        ]);
        const user = await this.findById(input.id);
        if (!user) {
            throw new Error(`User ${input.id} was not persisted.`);
        }
        return user;
    }
    async findByEmail(email) {
        const result = this.executor.query(`SELECT id, email, password_hash, role, status, last_login_at, created_at, updated_at
       FROM users
       WHERE email = ?`, [normalizeEmail(email)]);
        return result.rows[0] ? mapUser(result.rows[0]) : null;
    }
    async findById(id) {
        const result = this.executor.query(`SELECT id, email, password_hash, role, status, last_login_at, created_at, updated_at
       FROM users
       WHERE id = ?`, [id]);
        return result.rows[0] ? mapUser(result.rows[0]) : null;
    }
    async updateLastLogin(userId, lastLoginAt) {
        const result = this.executor.run(`UPDATE users
       SET last_login_at = ?, updated_at = ?
       WHERE id = ?`, [lastLoginAt.toISOString(), lastLoginAt.toISOString(), userId]);
        if (result.changes === 0) {
            throw new Error(`User ${userId} was not found.`);
        }
    }
}
export class SqlUserSessionRepository {
    executor;
    constructor(executor) {
        this.executor = executor;
    }
    async create(input) {
        this.executor.run(`INSERT INTO user_sessions (
         id, user_id, session_token_hash, created_at, last_seen_at, expires_at,
         idle_expires_at, revoked_at, revoked_reason, ip_address_hash, user_agent
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
            input.id,
            input.userId,
            input.sessionTokenHash,
            input.createdAt.toISOString(),
            input.lastSeenAt.toISOString(),
            input.expiresAt.toISOString(),
            input.idleExpiresAt.toISOString(),
            toIsoString(input.revokedAt),
            input.revokedReason ?? null,
            input.ipAddressHash ?? null,
            input.userAgent ?? null,
        ]);
        const session = await this.findByTokenHash(input.sessionTokenHash);
        if (!session) {
            throw new Error(`Session ${input.id} was not persisted.`);
        }
        return session;
    }
    async findByTokenHash(sessionTokenHash) {
        const result = this.executor.query(`SELECT id, user_id, session_token_hash, created_at, last_seen_at, expires_at,
              idle_expires_at, revoked_at, revoked_reason, ip_address_hash, user_agent
       FROM user_sessions
       WHERE session_token_hash = ?`, [sessionTokenHash]);
        return result.rows[0] ? mapSession(result.rows[0]) : null;
    }
    async revoke(sessionId, revokedAt, revokedReason) {
        const result = this.executor.run(`UPDATE user_sessions
       SET revoked_at = ?, revoked_reason = ?
       WHERE id = ?`, [revokedAt.toISOString(), revokedReason, sessionId]);
        if (result.changes === 0) {
            throw new Error(`Session ${sessionId} was not found.`);
        }
    }
}
export class SqlAuditEventRepository {
    executor;
    constructor(executor) {
        this.executor = executor;
    }
    async create(input) {
        this.executor.run(`INSERT INTO audit_events (
         id, user_id, actor_identifier, event_type, occurred_at, request_id, metadata
       ) VALUES (?, ?, ?, ?, ?, ?, ?)`, [
            input.id,
            input.userId ?? null,
            input.actorIdentifier ?? null,
            input.eventType,
            input.occurredAt.toISOString(),
            input.requestId ?? null,
            JSON.stringify(input.metadata),
        ]);
        const result = this.executor.query(`SELECT id, user_id, actor_identifier, event_type, occurred_at, request_id, metadata
       FROM audit_events
       WHERE id = ?`, [input.id]);
        if (!result.rows[0]) {
            throw new Error(`Audit event ${input.id} was not persisted.`);
        }
        return mapAuditEvent(result.rows[0]);
    }
    async listByUserId(userId) {
        const result = this.executor.query(`SELECT id, user_id, actor_identifier, event_type, occurred_at, request_id, metadata
       FROM audit_events
       WHERE user_id = ?
       ORDER BY occurred_at ASC`, [userId]);
        return result.rows.map(mapAuditEvent);
    }
}
//# sourceMappingURL=sql-auth-repositories.js.map