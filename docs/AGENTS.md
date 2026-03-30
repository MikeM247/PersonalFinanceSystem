# AGENTS.md

## Purpose
This file defines the required operating rules for AI agents and contributors working in this repository.

The repository uses strict defaults. Agents must prefer small, reviewable changes over broad rewrites.

---

## Primary Sources of Truth
Agents must treat these files as authoritative, in this order:

1. `docs/CONTEXT.md`
2. `docs/ARCHITECTURE.md`
3. `docs/DATA_MODEL.md`
4. `docs/AI.md`
5. `docs/STANDARDS.md`
6. `docs/PLAN.md`
7. `docs/REVIEW.md`

If a lower-order file conflicts with a higher-order file, the higher-order file wins.

---

## Required Workflow
For every story, task, or requested change, follow this exact loop:

1. Read `docs/CONTEXT.md` to understand product intent.
2. Read `docs/ARCHITECTURE.md` and `docs/STANDARDS.md` before making structural decisions.
3. Read `docs/DATA_MODEL.md` and `docs/AI.md` if the change touches data, events, analytics, search, or future intelligence capabilities.
4. Read the relevant item in `docs/PLAN.md`.
5. Implement the smallest change that satisfies the story.
6. Run all required checks.
7. Review the result against `docs/REVIEW.md`.
8. Return a concise summary of:
   - what changed
   - checks run
   - risks or follow-ups

Do not skip checks. Do not skip review.

---

## Execution Rules
- Prefer minimal diffs.
- Do not make unrelated refactors.
- Do not introduce new frameworks, libraries, or infrastructure without explicit need.
- Do not duplicate logic across apps or packages.
- Put shared business logic in shared packages, not in UI layers.
- Preserve backwards compatibility unless the plan explicitly allows breaking change.
- Keep code and docs aligned in the same change where practical.

---

## Planning Rules
- Work from `docs/PLAN.md`.
- Complete one story at a time.
- If a task is too large, split it into smaller implementation steps in the response, then execute only the requested scope.
- Do not silently expand scope.

---

## Monorepo Rules
- `apps/*` contains deployable applications.
- `packages/*` contains shared modules.
- Business rules belong in `packages/core`.
- Data access and schema belong in `packages/db`.
- Shared UI belongs in `packages/ui`.
- Avoid app-specific business logic leaking into shared packages.

---

## AI-Readiness Rules
For features that create user actions, state changes, workflows, content, or decisions:
- consider whether an event should be emitted
- consider whether the data may later be queried, embedded, summarized, or recommended on
- prefer additive telemetry over implicit behaviour

If unsure, add a follow-up note instead of inventing a large AI subsystem.

---

## Safety Rules for Changes
- Do not hard-delete important code paths unless explicitly requested.
- Do not commit secrets.
- Do not store credentials in code, docs, tests, or fixtures.
- Do not add long-running listeners or server processes in serverless apps.
- Do not use mock implementations in production paths unless clearly marked and allowed by the plan.

---

## Required Checks
At minimum, agents must run the checks defined by the repo if available, typically:
- lint
- typecheck
- unit tests
- build
- targeted integration or smoke checks where relevant

If a check cannot be run, explicitly state that.

---

## Response Format for Change Work
When reporting work, use this structure:

### Completed
- brief statement of what was implemented

### Files Changed
- list of key files changed

### Checks
- list of checks run and result

### Notes
- risks, assumptions, or next recommended step

Keep responses concise and factual.

---

## Default Quality Bar
A task is not complete unless:
- acceptance criteria are met
- code follows `docs/STANDARDS.md`
- review passes against `docs/REVIEW.md`
- there is no obvious duplication, drift, or architectural violation
