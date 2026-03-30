# STANDARDS.md

## Purpose
This document defines the default engineering standards for projects created from this template.

These standards are intentionally strict. Prefer consistency over personal style.

---

## General Standards
- Keep changes small and focused.
- Prefer clear code over clever code.
- Prefer explicit naming over abbreviations.
- Avoid duplication.
- Keep modules cohesive.
- Keep public interfaces stable unless a breaking change is explicitly planned.

---

## Monorepo Standards
- Deployable apps go in `apps/*`.
- Shared code goes in `packages/*`.
- Shared business logic belongs in `packages/core`.
- Shared data access belongs in `packages/db`.
- Shared UI belongs in `packages/ui`.
- Do not place reusable business logic directly inside app folders.

---

## File and Folder Naming
- Use consistent naming conventions across the repo.
- Prefer descriptive names.
- Avoid ambiguous folder names like `misc`, `temp`, or `helpers` unless genuinely justified.
- Keep folder depth reasonable.

---

## Code Structure
- Prefer small functions with clear intent.
- Keep side effects close to boundaries.
- Keep business rules separate from transport and persistence concerns.
- Prefer composition over deeply coupled inheritance structures.
- Isolate framework-specific code where practical.

---

## Type Safety
- Prefer explicit types at important boundaries.
- Avoid unnecessary `any`.
- Validate external inputs.
- Keep domain types intentional and readable.

---

## Error Handling
- Fail clearly.
- Do not swallow errors silently.
- Return predictable error shapes at API boundaries.
- Log enough context for diagnosis without leaking secrets.

---

## API Standards
- Validate request inputs.
- Return consistent response shapes.
- Use clear status codes.
- Keep handlers thin.
- Do not mix transport logic and domain logic excessively.

---

## Data Standards
- Use stable identifiers.
- Keep timestamps on important entities.
- Prefer explicit status fields over hidden state.
- Document meaningful invariants.
- Avoid schema drift between code and docs.

---

## Event and Observability Standards
Where relevant:
- use structured logs
- emit meaningful domain or user events
- preserve timestamps and identifiers
- make future tracing possible

---

## Testing Standards
Default expectation:
- unit test pure business logic
- add integration tests for key boundaries
- add smoke coverage for critical flows where useful

Do not add brittle tests that mostly verify implementation details.

---

## Documentation Standards
Update docs when changes affect:
- architecture
- data model
- workflow
- public behaviour
- setup expectations

Prefer short, current documentation over long stale documentation.

---

## Dependency Standards
- Prefer fewer dependencies.
- Add a dependency only when it provides clear value.
- Avoid overlapping libraries that solve the same problem.
- Avoid introducing infrastructure-heavy dependencies by default.

---

## Default Delivery Standards
Before considering a story complete:
- lint passes
- typecheck passes
- tests pass where relevant
- build passes where relevant
- docs updated if needed
- review passes against `docs/REVIEW.md`

---

## Project-Specific Extension Guidance
When adapting this template, add:
- language-specific standards
- framework-specific conventions
- testing stack conventions
- branch and PR conventions
- CI expectations
- deployment guardrails
