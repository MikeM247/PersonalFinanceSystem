# Owner Account Bootstrap

## Purpose

Create the initial MVP owner account without exposing a public signup flow.

## Required Environment Variables

Copy values from [`.env.example`](F:/Dev/repos/PersonalFinanceSystem/.env.example) into your local environment or shell:

- `AUTH_SESSION_SECRET`
- `AUTH_COOKIE_NAME`
- `AUTH_COOKIE_SECURE`
- `AUTH_COOKIE_SAME_SITE`
- `AUTH_SESSION_IDLE_TIMEOUT_MINUTES`
- `AUTH_SESSION_ABSOLUTE_TIMEOUT_HOURS`
- `AUTH_LOGIN_WINDOW_MINUTES`
- `AUTH_LOGIN_MAX_ATTEMPTS`
- `AUTH_DATABASE_PATH`
- `AUTH_OWNER_EMAIL`
- `AUTH_OWNER_PASSWORD`
- `AUTH_OWNER_ID` (optional; defaults to `owner-1`)

## Command

```powershell
npm run provision:owner
```

## Behavior

- Applies the auth persistence migration to the configured SQLite database.
- Validates the auth configuration and provisioning inputs before writing anything.
- Hashes the owner password with Argon2id before persistence.
- Creates the owner account if it does not already exist.
- Returns a no-op success message if the owner account already exists for the configured email.

## Failure Modes

- Missing or invalid environment configuration stops the command before persistence.
- Database or migration failures stop the command before the owner account is created.
- Duplicate normalized email creation is rejected by the database constraint.
- The command never logs the raw password or session secret.

## Policy Notes

- Current defaults use a 15-minute login attempt window and a maximum of 5 failed attempts before throttling begins.
- These values are configurable through environment variables and should be reviewed before production release.
- Session idle and absolute timeout values are also environment-driven and should be validated against real usage expectations before production release.
