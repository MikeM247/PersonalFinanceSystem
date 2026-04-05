import { randomUUID } from "node:crypto";

import type {
  AuthAuditRepository,
  AuthSessionRepository,
  AuthTelemetry,
  AuthUserRepository,
} from "./ports.js";
import {
  type AuthenticationResult,
  type AuthorizationContext,
  type RevokeSessionResult,
  type SessionValidationResult,
} from "./types.js";
import { noopAuthTelemetry, sanitizeObservabilityMetadata } from "./observability.js";
import { verifyPassword } from "./password-verification.js";
import { generateSessionToken, hashSessionToken } from "./session-token.js";

export interface AuthRuntimeConfig {
  sessionSecret: string;
  cookieName: string;
  cookieSecure: boolean;
  cookieSameSite: "lax" | "strict" | "none";
  sessionIdleTimeoutMinutes: number;
  sessionAbsoluteTimeoutHours: number;
  loginWindowMinutes: number;
  loginMaxAttempts: number;
}

export interface AuthenticationAttempt {
  email: string;
  password: string;
  ipAddressHash?: string | null;
  userAgent?: string | null;
  requestId?: string | null;
}

export interface AuthServiceDependencies {
  userRepository: AuthUserRepository;
  sessionRepository: AuthSessionRepository;
  auditRepository?: AuthAuditRepository;
  telemetry?: AuthTelemetry;
  config: AuthRuntimeConfig;
  now?: () => Date;
  generateId?: () => string;
  generateAuditEventId?: () => string;
}

function buildAuthorizationContext(user: { id: string; email: string; role: "owner" }): AuthorizationContext {
  return {
    userId: user.id,
    email: user.email,
    role: user.role,
  };
}

function isSessionExpired(now: Date, session: { expiresAt: Date; idleExpiresAt: Date }): boolean {
  return session.expiresAt.getTime() <= now.getTime() || session.idleExpiresAt.getTime() <= now.getTime();
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export class AuthService {
  private readonly now: () => Date;
  private readonly generateId: () => string;
  private readonly generateAuditEventId: () => string;
  private readonly telemetry: AuthTelemetry;

  constructor(private readonly dependencies: AuthServiceDependencies) {
    this.now = dependencies.now ?? (() => new Date());
    this.generateId =
      dependencies.generateId ??
      (() => {
        return randomUUID();
      });
    this.generateAuditEventId =
      dependencies.generateAuditEventId ??
      (() => {
        return randomUUID();
      });
    this.telemetry = dependencies.telemetry ?? noopAuthTelemetry;
  }

  private async recordAuditEvent(input: {
    userId?: string | null;
    actorIdentifier?: string | null;
    eventType: string;
    occurredAt: Date;
    requestId?: string | null;
    metadata: Record<string, unknown>;
  }): Promise<void> {
    if (!this.dependencies.auditRepository) {
      return;
    }

    await this.dependencies.auditRepository.create({
      id: this.generateAuditEventId(),
      userId: input.userId ?? null,
      actorIdentifier: input.actorIdentifier ?? null,
      eventType: input.eventType,
      occurredAt: input.occurredAt,
      requestId: input.requestId ?? null,
      metadata: sanitizeObservabilityMetadata(input.metadata) as Record<string, unknown>,
    });
  }

  private async logEvent(eventType: string, metadata: Record<string, unknown>): Promise<void> {
    await this.telemetry.log(eventType, sanitizeObservabilityMetadata(metadata) as Record<string, unknown>);
  }

  private async setActiveSessionGauge(at: Date): Promise<void> {
    const activeSessions = await this.dependencies.sessionRepository.countActive(at);
    await this.telemetry.setGauge("auth_active_session_count", activeSessions);
  }

  async authenticate(input: AuthenticationAttempt): Promise<AuthenticationResult> {
    const normalizedEmail = normalizeEmail(input.email);
    const user = await this.dependencies.userRepository.findByEmail(normalizedEmail);
    const attemptedAt = this.now();

    if (!user || user.status !== "active") {
      await this.recordAuditEvent({
        userId: user?.id ?? null,
        actorIdentifier: normalizedEmail,
        eventType: "auth.login.failed",
        occurredAt: attemptedAt,
        requestId: input.requestId ?? null,
        metadata: {
          outcome: "invalid_credentials",
          ipAddressHash: input.ipAddressHash ?? null,
          userAgent: input.userAgent ?? null,
        },
      });
      await this.telemetry.incrementCounter("auth_login_failure_total");
      await this.logEvent("auth.login.failed", {
        requestId: input.requestId ?? null,
        actorIdentifier: normalizedEmail,
        outcome: "invalid_credentials",
      });
      return { authenticated: false, reason: "invalid_credentials" };
    }

    const passwordMatches = await verifyPassword(input.password, user.passwordHash);
    if (!passwordMatches) {
      await this.recordAuditEvent({
        userId: user.id,
        actorIdentifier: normalizedEmail,
        eventType: "auth.login.failed",
        occurredAt: attemptedAt,
        requestId: input.requestId ?? null,
        metadata: {
          outcome: "invalid_credentials",
          ipAddressHash: input.ipAddressHash ?? null,
          userAgent: input.userAgent ?? null,
        },
      });
      await this.telemetry.incrementCounter("auth_login_failure_total");
      await this.logEvent("auth.login.failed", {
        requestId: input.requestId ?? null,
        userId: user.id,
        actorIdentifier: normalizedEmail,
        outcome: "invalid_credentials",
      });
      return { authenticated: false, reason: "invalid_credentials" };
    }

    const issuedAt = attemptedAt;
    const expiresAt = new Date(
      issuedAt.getTime() + this.dependencies.config.sessionAbsoluteTimeoutHours * 60 * 60 * 1000,
    );
    const idleExpiresAt = new Date(
      issuedAt.getTime() + this.dependencies.config.sessionIdleTimeoutMinutes * 60 * 1000,
    );
    const token = generateSessionToken();
    const sessionId = this.generateId();
    const tokenHash = hashSessionToken(token, this.dependencies.config.sessionSecret);

    const session = await this.dependencies.sessionRepository.create({
      id: sessionId,
      userId: user.id,
      sessionTokenHash: tokenHash,
      createdAt: issuedAt,
      lastSeenAt: issuedAt,
      expiresAt,
      idleExpiresAt,
      ipAddressHash: input.ipAddressHash ?? null,
      userAgent: input.userAgent ?? null,
    });

    await this.dependencies.userRepository.updateLastLogin(user.id, issuedAt);
    await this.recordAuditEvent({
      userId: user.id,
      actorIdentifier: user.email,
      eventType: "auth.login.succeeded",
      occurredAt: issuedAt,
      requestId: input.requestId ?? null,
      metadata: {
        sessionId: session.id,
        ipAddressHash: input.ipAddressHash ?? null,
        userAgent: input.userAgent ?? null,
      },
    });
    await this.telemetry.incrementCounter("auth_login_success_total");
    await this.setActiveSessionGauge(issuedAt);
    await this.logEvent("auth.login.succeeded", {
      requestId: input.requestId ?? null,
      userId: user.id,
      sessionId: session.id,
    });

    return {
      authenticated: true,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
      authorizationContext: buildAuthorizationContext(user),
      session: {
        sessionId: session.id,
        token,
        expiresAt: session.expiresAt,
        idleExpiresAt: session.idleExpiresAt,
      },
    };
  }

  async validateSession(token: string, context?: { requestId?: string | null }): Promise<SessionValidationResult> {
    const validationStartedAt = Date.now();
    if (!token.trim()) {
      await this.telemetry.observeHistogram("auth_session_validation_latency_ms", Date.now() - validationStartedAt);
      return { valid: false, reason: "invalid_session" };
    }

    const now = this.now();
    const tokenHash = hashSessionToken(token, this.dependencies.config.sessionSecret);
    const session = await this.dependencies.sessionRepository.findByTokenHash(tokenHash);
    if (!session) {
      await this.telemetry.observeHistogram("auth_session_validation_latency_ms", Date.now() - validationStartedAt);
      return { valid: false, reason: "invalid_session" };
    }

    if (session.revokedAt) {
      await this.telemetry.observeHistogram("auth_session_validation_latency_ms", Date.now() - validationStartedAt);
      return { valid: false, reason: "invalid_session" };
    }

    if (isSessionExpired(now, session)) {
      await this.dependencies.sessionRepository.revoke(session.id, now, "expired");
      await this.recordAuditEvent({
        userId: session.userId,
        eventType: "auth.session.expired",
        occurredAt: now,
        requestId: context?.requestId ?? null,
        metadata: {
          sessionId: session.id,
          expiresAt: session.expiresAt.toISOString(),
          idleExpiresAt: session.idleExpiresAt.toISOString(),
        },
      });
      await this.telemetry.incrementCounter("auth_session_expired_total");
      await this.setActiveSessionGauge(now);
      await this.logEvent("auth.session.expired", {
        requestId: context?.requestId ?? null,
        userId: session.userId,
        sessionId: session.id,
      });
      await this.telemetry.observeHistogram("auth_session_validation_latency_ms", Date.now() - validationStartedAt);

      return { valid: false, reason: "invalid_session" };
    }

    const user = await this.dependencies.userRepository.findById(session.userId);
    if (!user || user.status !== "active") {
      await this.dependencies.sessionRepository.revoke(session.id, now, "user-unavailable");
      await this.setActiveSessionGauge(now);
      await this.telemetry.observeHistogram("auth_session_validation_latency_ms", Date.now() - validationStartedAt);
      return { valid: false, reason: "invalid_session" };
    }

    await this.telemetry.observeHistogram("auth_session_validation_latency_ms", Date.now() - validationStartedAt);

    return {
      valid: true,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
      authorizationContext: buildAuthorizationContext(user),
      session,
    };
  }

  async revokeSession(
    token: string,
    reason = "manual-logout",
    context?: { requestId?: string | null },
  ): Promise<RevokeSessionResult> {
    if (!token.trim()) {
      return { revoked: false };
    }

    const tokenHash = hashSessionToken(token, this.dependencies.config.sessionSecret);
    const session = await this.dependencies.sessionRepository.findByTokenHash(tokenHash);
    if (!session || session.revokedAt) {
      return { revoked: false };
    }

    const revokedAt = this.now();
    await this.dependencies.sessionRepository.revoke(session.id, revokedAt, reason);
    await this.setActiveSessionGauge(revokedAt);

    if (reason === "manual-logout") {
      const user = await this.dependencies.userRepository.findById(session.userId);
      await this.recordAuditEvent({
        userId: session.userId,
        actorIdentifier: user?.email ?? null,
        eventType: "auth.logout",
        occurredAt: revokedAt,
        requestId: context?.requestId ?? null,
        metadata: {
          sessionId: session.id,
          revokedReason: reason,
        },
      });
      await this.logEvent("auth.logout", {
        requestId: context?.requestId ?? null,
        userId: session.userId,
        sessionId: session.id,
      });
    }

    return { revoked: true };
  }
}
