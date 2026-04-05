# FR-001 Authentication and Session Management Architecture

## Skill Invocation
- Skill: architect
- Scope: FR-001 Authentication and Session Management
- Requirements Validated: no
- Enforcement Files Read:
  - .codex/enforcement/architecture.md
  - .codex/enforcement/adr.md
- Key Risks Identified: incomplete requirements around account bootstrap and session policy, weak brute-force protection if rate limiting is omitted, and operational dependence on database-backed session validation.

## 1. Problem Framing

### Goals
- Protect all finance data and protected application screens behind authenticated access.
- Support secure login, session continuity, and explicit logout for the single primary user.
- Keep the design extensible so future role-based authorization can be introduced without rewriting feature modules.
- Capture audit-friendly security events for authentication and access control operations.

### Constraints
- Passwords must be hashed securely.
- Secrets and sensitive configuration must be environment-driven and never hardcoded.
- Deployed environments must use HTTPS.
- Business rules must stay out of the UI layer and be exposed through stable API contracts.
- The repository architecture requires thin apps, core business logic in `/packages/core`, and persistence concerns in `/packages/db`.

### Assumptions
- MVP will use local email/password authentication rather than an external identity provider.
- MVP will have no public self-service registration flow; the primary user account will be provisioned operationally.
- The web app and API will be served from the same trusted origin, allowing secure cookie-based sessions.
- Session handling will use both idle and absolute expiry so long-lived unattended sessions are not trusted indefinitely.
- Existing domain tables will remain user-scoped through `user_id`, preserving future multi-user expansion.

### Requirements Completeness
The feature requirements are directionally correct but incomplete for implementation. Architecture can proceed only by making explicit assumptions.

### Missing or Ambiguous Requirements
- Account bootstrap is undefined: there is no requirement for how the first user is created.
- Password lifecycle is undefined: no requirements exist for password reset, password change, or credential rotation.
- Session policy is undefined: idle timeout, absolute timeout, remember-me behavior, and concurrent session support are not specified.
- Abuse controls are undefined: login rate limiting, lockout behavior, and suspicious-access handling are not specified.
- Audit scope is vague: "login activity" is mentioned, but the required event set, retention, and redaction rules are not defined.
- Authorization shape is only partially defined: future role extensibility is required, but no initial role vocabulary or policy boundary is stated.

## 2. Architecture Overview

### System Context
- `apps/web` will own the login UI, logout affordance, protected-route handling, and unauthenticated redirects.
- `apps/api` will expose auth endpoints, session-aware request guards, and shared authorization middleware.
- `packages/core` will own credential verification rules, session issuance/revocation logic, authorization context construction, and audit event contracts.
- `packages/db` will own user, session, and audit persistence plus schema migrations and repository implementations.

### High-Level Components
- Web auth surface: login page, session bootstrap call, protected-route wrapper, logout action.
- Auth API surface: login, logout, current session lookup, and reusable request guard for protected endpoints.
- Core auth service: validates credentials, issues sessions, revokes sessions, and resolves authorization context.
- Session repository: persists hashed session tokens and session lifecycle metadata.
- Audit event pipeline: records authentication and access-control events in durable storage and structured logs.

### Key Design Decisions
- Use local credential authentication with Argon2id-hashed passwords for MVP.
- Use server-issued opaque session tokens stored in secure, HttpOnly cookies rather than JWTs in browser storage.
- Persist only a hash of the session token in the database so token theft from persistence is less useful.
- Provision the primary owner account outside the public application flow to avoid introducing signup and recovery complexity into MVP.
- Model authorization through a core `AuthorizationContext` with an initial `owner` role so future roles can be added without moving policy into handlers or UI code.
- Create ADR-001 to capture the authentication and session strategy because it is a significant, cross-cutting architectural decision.

## 3. Component Design

### Web Auth Surface
Responsibilities:
- Render the login form and validation feedback.
- Request current session state during app bootstrap.
- Redirect unauthenticated users away from protected screens.
- Clear client auth state after logout or session expiry.

Interactions:
- Calls `POST /api/auth/login` to establish a session.
- Calls `GET /api/auth/session` on initial load and refresh boundaries.
- Calls `POST /api/auth/logout` to revoke the active session.
- Consumes a normalized auth/session DTO only; it does not interpret persistence models.

Failure Modes:
- Invalid credentials return a user-safe error without exposing whether the email exists.
- Expired or revoked sessions force redirect to login and clear protected client state.
- API unavailability leaves the app in an unauthenticated-safe state rather than rendering protected data.

### Auth API Surface
Responsibilities:
- Validate auth request DTOs and translate them into core-service commands.
- Set and clear secure session cookies.
- Enforce authentication and authorization guards on protected routes.
- Normalize auth-related error responses.

Interactions:
- Delegates credential and session decisions to `packages/core`.
- Uses repositories from `packages/db` for session and audit persistence.
- Shares auth guard middleware with all protected finance endpoints.

Failure Modes:
- Validation failures return `400`.
- Invalid credentials return `401`.
- Excessive failed attempts return `429`.
- Missing or invalid sessions return `401`.
- Authorization failures for future non-owner roles return `403`.
- Database failures return `503` or a generic `500`, with full details only in logs.

### Core Auth Service
Responsibilities:
- Verify normalized credentials against stored password hashes.
- Issue, refresh, revoke, and expire sessions according to policy.
- Build an `AuthorizationContext` from the authenticated user record.
- Emit audit events for success, failure, logout, expiry, and unauthorized access.

Interactions:
- Reads the user record through a user repository.
- Writes session lifecycle changes through a session repository.
- Publishes audit event contracts consumed by the data layer.

Failure Modes:
- Unknown or disabled users are treated as invalid credentials at the API boundary.
- Expired sessions are rejected and optionally marked revoked for hygiene.
- Repository write failures prevent login success from being acknowledged.

### Persistence Layer
Responsibilities:
- Store the user identity, password hash, session records, and auth audit events.
- Expose indexed lookups for email and session token hash.
- Apply retention and revocation rules consistently.

Interactions:
- Auth service reads and writes through repository interfaces only.
- Other feature modules continue to rely on `user_id` ownership boundaries.

Failure Modes:
- Missing indexes degrade login and session lookup latency.
- Inconsistent revocation writes can leave sessions active longer than intended.
- Database outage blocks authentication and protected-route validation.

### Audit Event Pipeline
Responsibilities:
- Persist durable security-relevant events with timestamps and minimal identifying metadata.
- Emit structured application logs correlated by request ID.
- Avoid logging passwords, raw session tokens, or secrets.

Interactions:
- Receives auth event payloads from the core auth service.
- Stores durable records in `audit_events` and sends operational telemetry to logging/metrics sinks.

Failure Modes:
- If audit persistence fails during login, the login request should fail closed rather than authenticate without traceability.
- If external logging sinks fail, durable DB audit capture remains the source of truth.

## 4. Data Model

### Entities

#### `users`
- `id` UUID primary key
- `email` normalized unique value
- `password_hash` string, not null
- `role` enum, default `owner`
- `status` enum, default `active`
- `last_login_at` timestamptz nullable
- `created_at` timestamptz
- `updated_at` timestamptz

#### `user_sessions`
- `id` UUID primary key
- `user_id` UUID foreign key to `users.id`
- `session_token_hash` binary or text hash, unique
- `created_at` timestamptz
- `last_seen_at` timestamptz
- `expires_at` timestamptz
- `idle_expires_at` timestamptz
- `revoked_at` timestamptz nullable
- `revoked_reason` string nullable
- `ip_address_hash` string nullable
- `user_agent` string nullable

#### `audit_events`
- `id` UUID primary key
- `user_id` UUID nullable to support failed-login events before user resolution
- `actor_identifier` string nullable for normalized email or equivalent
- `event_type` string
- `occurred_at` timestamptz
- `request_id` string nullable
- `metadata` JSONB for redacted operational details

### Relationships
- One `users` record has many `user_sessions`.
- One `users` record has many `audit_events`.
- Existing feature tables continue to reference `users.id` via `user_id`.

### Integrity Constraints
- `users.email` must be unique after normalization.
- Only `active` users may authenticate.
- `user_sessions.session_token_hash` must be unique and indexed.
- A session is valid only when `revoked_at IS NULL`, `expires_at > now()`, and `idle_expires_at > now()`.
- `audit_events.metadata` must exclude raw passwords, raw session tokens, and secret values.
- Protected business records must continue to require a valid `user_id` foreign key so future multi-user isolation remains possible.

## 5. API Contracts

### `POST /api/auth/login`
Purpose:
- Authenticate the primary user and establish a new session.

Input:
```json
{
  "email": "owner@example.com",
  "password": "plain-text password"
}
```

Output:
```json
{
  "user": {
    "id": "uuid",
    "email": "owner@example.com",
    "role": "owner"
  },
  "session": {
    "authenticated": true,
    "expiresAt": "2026-04-11T18:25:22Z",
    "idleExpiresAt": "2026-04-04T20:25:22Z"
  }
}
```

Error handling:
- `400` for invalid payload shape.
- `401` for invalid credentials or disabled user.
- `429` for rate-limited login attempts.
- `503` if required persistence is unavailable.

### `POST /api/auth/logout`
Purpose:
- Revoke the current session and clear the auth cookie.

Input:
- No body required; session is identified from the secure cookie.

Output:
```json
{
  "loggedOut": true
}
```

Error handling:
- `200` may be returned even if the session is already absent so logout stays idempotent.
- `500` only when revocation state cannot be persisted safely.

### `GET /api/auth/session`
Purpose:
- Resolve current authentication state for app bootstrap and protected-route guards.

Output when authenticated:
```json
{
  "authenticated": true,
  "user": {
    "id": "uuid",
    "email": "owner@example.com",
    "role": "owner"
  },
  "session": {
    "expiresAt": "2026-04-11T18:25:22Z",
    "idleExpiresAt": "2026-04-04T20:25:22Z"
  }
}
```

Output when unauthenticated:
```json
{
  "authenticated": false
}
```

Error handling:
- `401` is reserved for protected resource requests; this endpoint may safely return `authenticated: false` for missing sessions.
- `503` for repository unavailability.

### Protected Feature Endpoints
Requirements:
- All finance endpoints must run through shared authentication middleware before business logic executes.
- Protected handlers receive an `AuthorizationContext`, not a raw cookie or persistence model.
- Future authorization checks must use role and ownership policies in core services rather than endpoint-local conditionals.

## 6. Non-Functional Requirements

### Performance Expectations
- Session lookup must remain index-backed and constant-time for normal request volume.
- Protected request authentication should add minimal overhead relative to domain work.
- Login latency may be higher than standard requests because secure password verification is intentionally expensive, but it should still feel acceptable for a single-user web workflow.

### Scalability Approach
- Database-backed opaque sessions allow horizontally scaled stateless app instances because no node-local session memory is trusted.
- Existing `user_id` ownership across domain records keeps the data model ready for future multi-user segmentation.
- Authorization logic remains centralized in core services so role growth does not require re-implementing checks in every feature surface.

### Reliability Considerations
- Logout and explicit revocation take effect immediately once the session row is updated.
- If session validation cannot complete, the system must fail closed and treat the request as unauthenticated.
- Session expiry must be enforced server-side; the browser alone is not trusted to end access.

## 7. Observability

### Logging Strategy
- Emit structured logs for `auth.login.succeeded`, `auth.login.failed`, `auth.logout`, `auth.session.expired`, and `auth.access.denied`.
- Attach `request_id`, outcome, route, and `user_id` when known.
- Redact or hash email and network identifiers where useful for correlation.
- Never log passwords, raw cookies, raw session tokens, or secrets.

### Metrics
- `auth_login_success_total`
- `auth_login_failure_total`
- `auth_login_rate_limited_total`
- `auth_active_session_count`
- `auth_session_validation_latency_ms`
- `auth_unauthorized_request_total`

### Health Checks
- Readiness checks must verify database connectivity because authentication and session validation depend on persistence.
- No health check may attempt a real login with production credentials.
- Operational dashboards should surface spikes in failed logins, repeated unauthorized requests, and session-validation failures.

## 8. Execution Plan

### Epic 1: Identity and Persistence Foundation

#### Story 1.1: Define auth persistence model
- Add `users`, `user_sessions`, and `audit_events` schema support required for authentication.
- Acceptance criteria:
  - Schema supports unique normalized user email, hashed password storage, session lifecycle fields, and auth audit events.
  - Session lookup and user email lookup are indexed.
  - Domain records can continue to rely on `user_id` ownership without redesign.

#### Story 1.2: Implement owner-account provisioning path
- Define the operational mechanism for creating and rotating the MVP owner credential without a public signup endpoint.
- Acceptance criteria:
  - There is a documented and repeatable way to create the first owner account.
  - The provisioning flow does not expose raw secrets in source control.
  - Password hashing is performed before persistence.

### Epic 2: Authentication and Session Services

#### Story 2.1: Implement core login and session lifecycle services
- Build framework-agnostic auth services in `packages/core` backed by repositories in `packages/db`.
- Acceptance criteria:
  - Valid credentials create a new persisted session and update `last_login_at`.
  - Invalid credentials do not reveal whether the email exists.
  - Expired or revoked sessions are rejected consistently.

#### Story 2.2: Expose auth API contracts and shared guards
- Add the login, logout, and current-session endpoints plus shared request-authentication middleware.
- Acceptance criteria:
  - Protected endpoints reject unauthenticated requests before business logic runs.
  - Logout revokes the active session and clears the cookie.
  - Error responses follow the documented auth contract.

### Epic 3: Protected Web Experience

#### Story 3.1: Add login screen and protected-route bootstrap
- Implement the login UI and session bootstrap flow in the web app.
- Acceptance criteria:
  - Unauthenticated users are redirected to login when they request protected screens.
  - Authenticated users can reach protected screens without repeated login during a valid session.
  - User-facing errors remain generic for invalid credentials.

#### Story 3.2: Handle logout and session expiry cleanly
- Ensure the web app responds correctly to explicit logout and server-side expiry.
- Acceptance criteria:
  - Logout returns the user to the login screen and clears protected client state.
  - Expired sessions do not leave stale finance data visible after the next protected request.
  - The app can recover from expired sessions by redirecting to login without crashing.

### Epic 4: Security Observability and Hardening

#### Story 4.1: Capture auth audit events and operational telemetry
- Persist and expose the minimum audit trail required for secure operation.
- Acceptance criteria:
  - Successful login, failed login, logout, session expiry, and access denial are recorded.
  - Audit records contain timestamps and correlation fields but no secret values.
  - Metrics and logs support investigating auth failures.

#### Story 4.2: Validate auth security behavior
- Add automated coverage for credential verification, session validation, and protected-route enforcement.
- Acceptance criteria:
  - Unit tests cover credential and session rules.
  - Integration tests cover login, logout, protected endpoint rejection, and revoked-session behavior.
  - End-to-end coverage validates login, logout, and redirect behavior for protected pages.

## 9. Risks / Trade-offs
- Database-backed sessions add a read on protected requests, but they provide immediate revocation and simpler server-side control than JWT invalidation.
- No public registration or password-recovery flow keeps MVP smaller and safer, but it creates operational dependency on a manual provisioning process.
- Using a single `owner` role keeps MVP authorization simple, but a future multi-role system will still require richer policy modeling and likely schema extension.
- Strict session expiry improves security, but aggressive timeout settings can degrade usability if they are not calibrated to real usage.
- Audit logging of auth events improves traceability, but poor redaction discipline can create a secondary data-exposure risk.

## 10. Validation
- Review the plan against the feature requirements and note that open requirement gaps remain around bootstrap, timeout values, and abuse controls.
- Validate the ADR before implementation so the team aligns on local auth, opaque sessions, and operational provisioning.
- Add unit tests for password verification, session validity rules, and authorization context creation.
- Add integration tests for login, logout, session lookup, and protected endpoint enforcement.
- Add end-to-end tests for redirect-to-login, successful login, logout, and expired-session recovery.
- Perform a release-readiness review for cookie flags, HTTPS enforcement, environment secret configuration, and audit-log redaction before production use.
