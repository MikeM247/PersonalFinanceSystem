---
name: plan-feature
description: Use when you need to break a feature request into epics, ordered tasks, and measurable acceptance criteria.
---

# Plan Feature

## Goal
Produce a clear, execution-ready implementation plan that decomposes a feature into small, testable units with explicit acceptance criteria.

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

## Output
Return a Markdown plan using this structure:
- `## Feature Summary`
- `## Assumptions & Open Questions`
- `## Epic Breakdown`
  - `### Epic N: <name>`
  - `- [ ] Task: <task title>`
    - `Description:`
    - `Dependencies:`
    - `Acceptance Criteria:`
      - `- <criterion>`
- `## Recommended Execution Order`
