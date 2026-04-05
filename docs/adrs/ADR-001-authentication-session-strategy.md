# ADR-001: Local Credential Authentication with Database-Backed Sessions

- Status: Accepted
- Date: 2026-04-04

## Context

The MVP product is a desktop-first personal finance web application for a single primary user. All financial data must be protected by authentication, logout must end the active session, and the system must remain extensible for future role-based authorization. The repository architecture also assumes thin apps, framework-agnostic core logic, stateless serverless-friendly application layers, and durable auditability for security-relevant events.

The feature requirements do not ask for self-service registration, social login, or external identity providers. They do require secure credential handling, environment-driven secrets, HTTPS, stable API contracts, and audit-friendly access events. The architecture therefore needs an auth approach that is simple for MVP, secure by default, and compatible with future multi-user expansion.

## Decision

The system will use local email/password authentication for MVP, with passwords hashed using Argon2id before persistence.

The system will issue opaque random session tokens after successful login. The raw token will be delivered only through a secure, HttpOnly, SameSite cookie over HTTPS. Persistence will store only a hash of the session token in a `user_sessions` table, together with lifecycle metadata such as creation time, last-seen time, idle expiry, absolute expiry, and revocation state.

The primary owner account will be provisioned operationally, outside the public application flow. MVP will not expose self-service registration or password recovery endpoints.

Authorization will be modeled through a core authorization context with an initial `owner` role. Protected business data will remain scoped by `user_id` so future role and multi-user expansion can build on the existing model rather than bypass it.

Authentication and access-control events such as login success, login failure, logout, session expiry, and access denial will be recorded in durable audit storage and structured logs with sensitive fields redacted.

## Consequences

### Positive
- Session revocation and logout take effect immediately because the server remains the source of truth.
- The approach is compatible with stateless, horizontally scaled app instances because session state is not stored in process memory.
- Opaque cookies avoid placing bearer tokens in browser-accessible storage.
- The public auth surface stays small, which reduces MVP implementation and attack surface.
- Centralized authorization context keeps future role support aligned with the repository architecture.

### Negative
- Protected requests incur a session lookup against persistence.
- Authentication availability depends on database availability.
- Operational account provisioning and credential recovery require documented runbooks until richer account-management flows exist.
- Future external identity-provider support will require an additional identity abstraction layer if adopted later.
