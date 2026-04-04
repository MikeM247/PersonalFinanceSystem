---
name: plan-feature
description: Use when you need to break a feature request into epics, ordered tasks, and measurable acceptance criteria.
---

# Plan Feature

## Goal
Produce a clear, execution-ready implementation plan that decomposes a feature into small, testable units with explicit acceptance criteria.

## Pre-Planning Checks
- Validate requirements completeness
- Identify missing or ambiguous requirements
- Confirm architecture exists or is provided
- Identify assumptions explicitly

## Architecture Alignment
- Ensure plan aligns with:
  - docs/ARCHITECTURE.md
  - docs/plans/<feature-name>-architecture.md
- Do not introduce new architecture decisions without flagging them

## Enforcement

You MUST comply with:

- .codex/enforcement/planning.md
- .codex/enforcement/definition-of-done.md

Read and apply these before producing output.

## Task
Analyze the request and generate:
1. Epics that capture major outcomes.
2. Ordered tasks under each epic.
3. Dependencies and execution order.
4. Acceptance criteria for every task.

## Rules
- Scope tasks so each one can be completed and validated in a single focused pull request.
- Keep tasks vertical when possible (UI + API + persistence for one slice).
- Identify assumptions and open questions explicitly.
- Do not include implementation code.
- Prefer incremental delivery that preserves a working system after each task.
- Do not produce tasks without acceptance criteria
- Every task must be independently implementable
- Every task must include test requirements
- Do not introduce architecture changes without flagging them
- Ensure execution order is valid and logical

## Output

### Feature Summary

### Assumptions & Open Questions

### Architecture Alignment Notes

### Epic Breakdown

#### Epic N: <name>

- [ ] Task: <task title>

  Description:
  Dependencies:
  Acceptance Criteria:
    - <criterion>

  Test Requirements:
    - Unit:
    - Integration:
    - E2E (if applicable):

  Observability:
    - Logging:
    - Metrics:

### Recommended Execution Order

### Risks / Gaps

### Validation
- Are all tasks independently implementable? (yes/no)
- Are dependencies valid? (yes/no)
- Are acceptance criteria testable? (yes/no)
