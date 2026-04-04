---
name: implement-story
description: Use when implementing a single planned task with a minimal, production-safe code change.
---

# Implement Story

## Goal
Deliver exactly one scoped story with the smallest practical diff while maintaining production quality.

## Task
Implement one task from an approved plan:
1. Confirm the exact scope and boundaries of the selected story.
2. Apply only the code changes required for that story.
3. Validate the implementation:
   - Run unit tests and ensure all pass
   - Add or update tests for new/changed logic
   - Ensure build passes with no errors
   - Ensure lint/type checks pass
4. Summarize what changed and why.

## Enforcement
Follow repository enforcement rules:

- .codex/enforcement/implement-story.md
- .codex/enforcement/definition-of-done.md

You MUST read and comply with these before completing the task.
## Pre-Implementation Checks
Before making changes:
1. Confirm the story includes clear acceptance criteria.
2. Identify impacted modules, APIs, and data structures.
3. Identify required tests (unit, integration, e2e if applicable).
4. Confirm Definition of Done requirements for this story.

## Rules
- Implement ONE task only; defer adjacent work.
- No unrelated refactors, renames, or formatting-only churn.
- Preserve existing architecture and conventions.
- Ensure the project builds and tests relevant to the story pass.
- If blocked, report the blocker and provide the smallest safe fallback.
- Every change to business logic must include corresponding tests.
- Do not implement a story without defined acceptance criteria.
- Ensure changes satisfy the Definition of Done for the repository.

## Output

The response MUST include this section at the end:

Return:
- `## Story Implemented`
- `## Changes Made`
- ## Enforcement Compliance
- Enforcement Files Read:
  - .codex/enforcement/implement-story.md
  - .codex/enforcement/definition-of-done.md
- `## Validation`
- Validation Performed:
  - Tests Added/Updated: <yes/no + summary>
  - Build: pass/fail
  - Tests: pass/fail
  - Lint/Types: pass/fail
- `## Out-of-Scope / Follow-ups`

