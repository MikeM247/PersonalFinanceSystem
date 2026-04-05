### Feature Summary

Implement secure single-user authentication and session management for the personal finance system using the approved architecture: local email/password authentication, database-backed opaque sessions, server-enforced protected routes, and audit-friendly auth events. The plan keeps business rules in `packages/core`, persistence in `packages/db`, transport concerns in `apps/api`, and user interaction in `apps/web`.

### Assumptions & Open Questions

- Assumes MVP uses local credential authentication only, with no public registration, password reset, or external identity provider.
- Assumes the primary owner account is provisioned operationally rather than through a user-facing onboarding flow.
- Assumes the initial authorization model exposes a single `owner` role through a shared authorization context.
- Open question: exact idle timeout, absolute timeout, and concurrent-session policy values are still undefined.
- Open question: login abuse thresholds and lockout behavior are undefined and need explicit product/security defaults before release.
- Open question: audit-event retention and operational review workflow are undefined.

### Architecture Alignment Notes

- This plan aligns with [docs/ARCHITECTURE.md](F:/Dev/repos/PersonalFinanceSystem/docs/ARCHITECTURE.md), [docs/plans/FR-001-authentication-and-session-management-architecture.md](F:/Dev/repos/PersonalFinanceSystem/docs/plans/FR-001-authentication-and-session-management-architecture.md), and [docs/adrs/ADR-001-authentication-session-strategy.md](F:/Dev/repos/PersonalFinanceSystem/docs/adrs/ADR-001-authentication-session-strategy.md).
- No new architecture decisions are introduced in this plan.
- Story boundaries follow the documented layering rules:
  - `packages/db` for schema and repository implementations
  - `packages/core` for credential, session, and authorization rules
  - `apps/api` for auth endpoints, cookie handling, and request guards
  - `apps/web` for login/logout flows and protected-route UX
- Unresolved product questions are kept explicit and are not silently resolved by implementation stories.

### Epic Breakdown

#### Epic 1: Identity Foundation [x]

- [x] Task: Establish authentication persistence and repository contracts

  Description:
  Add the data model, indexes, migrations, and repository interfaces needed for users, sessions, and auth audit events.

  Dependencies:
  - ADR-001 accepted

  Acceptance Criteria:
  - `users`, `user_sessions`, and `audit_events` persistence structures exist with the fields required by the architecture.
  - Unique and index constraints exist for normalized user email and session token hash lookups.
  - Repository interfaces expose only persistence operations and do not contain business rules.
  - Existing user-owned domain records remain compatible with `user_id` ownership boundaries.

  Test Requirements:
  - Unit:
    - Mapper or normalization helpers used in the data layer are covered.
  - Integration:
    - Migration applies successfully in a test database.
    - Repository create/read/update flows work for users, sessions, and audit events.
  - E2E (if applicable):
    - Not applicable.

  Observability:
  - Logging:
    - Log migration and repository failures without including secrets or raw tokens.
  - Metrics:
    - None required beyond existing database/migration telemetry.

- [x] Task: Add owner-account provisioning and auth configuration path

  Description:
  Implement the operational workflow for creating the MVP owner account and define the environment-driven configuration surface needed for auth and session behavior.

  Dependencies:
  - Establish authentication persistence and repository contracts

  Acceptance Criteria:
  - There is a documented, repeatable workflow to create the first owner account without a public signup flow.
  - Passwords are hashed before persistence and raw secrets are never stored in source control.
  - Required environment variables for auth secrets, cookie settings, and timeout configuration are documented.
  - Provisioning failure modes are explicit and do not leave partially initialized credentials in an unknown state.

  Test Requirements:
  - Unit:
    - Password hashing and credential normalization helpers are covered.
  - Integration:
    - The provisioning workflow creates a valid owner account in a test environment.
    - Invalid provisioning input is rejected safely.
  - E2E (if applicable):
    - Not applicable.

  Observability:
  - Logging:
    - Record provisioning success/failure events without logging passwords or secrets.
  - Metrics:
    - Optional operational counter for owner provisioning runs if the chosen workflow supports it.

#### Epic 2: Core Authentication and Session Enforcement [x]

- [x] Task: Implement core authentication and session lifecycle services

  Description:
  Build the framework-agnostic business logic for credential verification, session issuance, session validation, revocation, expiry handling, and authorization context creation.

  Dependencies:
  - Establish authentication persistence and repository contracts
  - Add owner-account provisioning and auth configuration path

  Acceptance Criteria:
  - Valid credentials create a persisted session and return an authorization context for the authenticated owner.
  - Invalid credentials return a generic failure outcome that does not reveal whether the account exists.
  - Expired and revoked sessions are rejected consistently by shared session-validation logic.
  - Session policy values are read from configuration rather than hardcoded in business logic.

  Test Requirements:
  - Unit:
    - Credential verification, session validity, revocation, and authorization-context rules are covered.
  - Integration:
    - Service flows succeed against repository implementations for login, session lookup, and revocation.
    - Expired and revoked sessions fail as expected.
  - E2E (if applicable):
    - Not applicable.

  Observability:
  - Logging:
    - Log authentication-service errors and rejected session states with request correlation where available.
  - Metrics:
    - `auth_login_attempt_total`
    - `auth_session_validation_failure_total`

- [x] Task: Expose authentication endpoints and shared request guards

  Description:
  Add the login, logout, and current-session API contracts plus shared middleware/guards that block unauthenticated access before finance handlers run.

  Dependencies:
  - Implement core authentication and session lifecycle services

  Acceptance Criteria:
  - `POST /api/auth/login`, `POST /api/auth/logout`, and `GET /api/auth/session` are implemented according to the architecture contract.
  - Secure cookie issuance and clearing are handled in the API layer rather than the UI.
  - Shared auth guards can be attached to protected finance routes without duplicating access logic in handlers.
  - Missing or invalid sessions are rejected before protected business logic executes.

  Test Requirements:
  - Unit:
    - Request validation and cookie option construction are covered.
  - Integration:
    - Endpoint tests cover successful login, invalid credentials, logout, missing session, and session bootstrap.
    - Protected route middleware rejects unauthenticated requests and passes valid auth context through.
  - E2E (if applicable):
    - Not applicable.

  Observability:
  - Logging:
    - Log auth endpoint outcomes and guard rejections with redacted identifiers.
  - Metrics:
    - `auth_login_success_total`
    - `auth_login_failure_total`
    - `auth_unauthorized_request_total`

- [x] Task: Add login abuse protection and session policy enforcement

  Description:
  Harden the auth surface with configurable rate limiting, timeout enforcement, and failure handling that matches the architecture's security expectations.

  Dependencies:
  - Expose authentication endpoints and shared request guards

  Acceptance Criteria:
  - Repeated invalid login attempts trigger a configurable protective response such as `429`.
  - Idle and absolute session expiry are enforced server-side on protected requests.
  - Cookie security flags and timeout behavior are controlled by environment-driven configuration.
  - The implementation documents any remaining open policy decisions that must be finalized before production release.

  Test Requirements:
  - Unit:
    - Rate-limit decision logic and timeout evaluation rules are covered.
  - Integration:
    - Endpoint tests prove throttled login responses and expired-session rejection.
    - Guard behavior respects configured session expiry.
  - E2E (if applicable):
    - Not applicable.

  Observability:
  - Logging:
    - Record rate-limited login attempts and session-expiry enforcement events.
  - Metrics:
    - `auth_login_rate_limited_total`
    - `auth_session_expired_total`

#### Epic 3: Protected Web Experience [x]

- [x] Task: Implement login page and protected-route bootstrap flow

  Description:
  Add the login form, session-bootstrap fetch, and protected-route redirect behavior needed to keep finance screens unavailable to unauthenticated users.

  Dependencies:
  - Expose authentication endpoints and shared request guards

  Acceptance Criteria:
  - Unauthenticated users are redirected to the login page when they request protected screens.
  - The login form submits to the auth API and shows generic credential failure messaging.
  - Authenticated users can reload the app and recover their valid session through bootstrap without being sent back to login.
  - Protected client views do not render finance data before auth state is resolved.

  Test Requirements:
  - Unit:
    - Client auth state handling and redirect conditions are covered.
  - Integration:
    - Web-layer tests cover login form submission, failed-login messaging, and bootstrap state transitions.
  - E2E (if applicable):
    - Basic protected-route redirect coverage is added if the test harness already exists; otherwise defer to the dedicated auth E2E story.

  Observability:
  - Logging:
    - Capture client-side auth bootstrap and login-flow errors through the project's frontend error-reporting path.
  - Metrics:
    - Optional client metric for login form submission failures if frontend telemetry exists.

- [x] Task: Implement logout and expired-session user experience

  Description:
  Add logout affordances and session-expiry handling so the UI exits protected state cleanly when the user logs out or the server no longer trusts the session.

  Dependencies:
  - Implement login page and protected-route bootstrap flow
  - Add login abuse protection and session policy enforcement

  Acceptance Criteria:
  - The user can log out from the protected application and the active session is revoked.
  - Expired or revoked sessions clear protected client state and return the user to login.
  - Logout remains idempotent from the user's perspective even if the session is already absent.
  - User-facing expiry and logout messaging stays clear and non-technical.

  Test Requirements:
  - Unit:
    - Logout state transitions and expired-session handling are covered.
  - Integration:
    - Web/API interaction tests cover logout success and expired-session redirect behavior.
  - E2E (if applicable):
    - Logout flow is covered if the auth E2E harness is already in place; otherwise defer to the dedicated auth E2E story.

  Observability:
  - Logging:
    - Capture logout-flow and forced-reauthentication errors without exposing protected data.
  - Metrics:
    - Optional client/server metric for logout failures if supported by the telemetry stack.

#### Epic 4: Auditability and Regression Safety [x]

- [x] Task: Persist auth audit events and expose operational telemetry

  Description:
  Complete the auditability requirements by recording security-relevant auth events and wiring the agreed metrics/logging surface.

  Dependencies:
  - Implement core authentication and session lifecycle services
  - Expose authentication endpoints and shared request guards
  - Add login abuse protection and session policy enforcement

  Acceptance Criteria:
  - Successful login, failed login, logout, session expiry, and access-denied events are captured in durable audit storage.
  - Structured logs and durable audit records exclude raw passwords, raw tokens, and secrets.
  - Operational metrics defined by the architecture are emitted for login outcomes, session expiry, and unauthorized requests.
  - Audit-event payloads include timestamps and correlation fields sufficient for investigation.

  Test Requirements:
  - Unit:
    - Audit event construction and redaction rules are covered.
  - Integration:
    - Auth flows persist the expected audit events with the expected event types and redacted metadata.
    - Metrics/logging hooks fire for the main auth outcomes.
  - E2E (if applicable):
    - Not applicable.

  Observability:
  - Logging:
    - `auth.login.succeeded`
    - `auth.login.failed`
    - `auth.logout`
    - `auth.session.expired`
    - `auth.access.denied`
  - Metrics:
    - `auth_login_success_total`
    - `auth_login_failure_total`
    - `auth_login_rate_limited_total`
    - `auth_active_session_count`
    - `auth_session_validation_latency_ms`
    - `auth_unauthorized_request_total`

- [x] Task: Add end-to-end auth regression coverage

  Description:
  Add end-to-end coverage for the core user journeys so authentication regressions are caught before broader finance features rely on the auth layer.

  Dependencies:
  - Implement login page and protected-route bootstrap flow
  - Implement logout and expired-session user experience
  - Persist auth audit events and expose operational telemetry

  Acceptance Criteria:
  - End-to-end tests cover redirect-to-login for protected routes, successful login, session bootstrap, logout, and expired-session recovery.
  - The auth regression suite is runnable in CI and does not depend on manually provisioned production credentials.
  - Test fixtures or setup steps provision a safe test owner account for automated environments.
  - Failing auth behavior blocks release of dependent protected features.

  Test Requirements:
  - Unit:
    - None beyond story-specific support utilities.
  - Integration:
    - Any missing API-level auth regression cases discovered during E2E setup are backfilled.
  - E2E (if applicable):
    - Full auth journey coverage is required.

  Observability:
  - Logging:
    - Test-run failures clearly identify which auth journey failed.
  - Metrics:
    - CI may publish auth test pass/fail telemetry if the project already supports it; otherwise none required.

### Recommended Execution Order

1. Establish authentication persistence and repository contracts
2. Add owner-account provisioning and auth configuration path
3. Implement core authentication and session lifecycle services
4. Expose authentication endpoints and shared request guards
5. Add login abuse protection and session policy enforcement
6. Implement login page and protected-route bootstrap flow
7. Implement logout and expired-session user experience
8. Persist auth audit events and expose operational telemetry
9. Add end-to-end auth regression coverage

### Risks / Gaps

- Exact timeout and abuse-control thresholds are still unresolved, so production hardening cannot be considered complete until those values are agreed.
- Owner provisioning is operationally sensitive; a weak bootstrap workflow would undermine the rest of the auth design.
- Protected-route rollout can block all finance work if the auth guard is introduced before a usable login/bootstrap path exists in development environments.
- Audit logging creates its own data-handling risk if redaction rules are not tested rigorously.
- The feature remains intentionally MVP-scoped: password reset, external identity providers, and multi-role authorization are out of scope for this plan.

### Validation
- Are all tasks independently implementable? yes
- Are dependencies valid? yes
- Are acceptance criteria testable? yes
