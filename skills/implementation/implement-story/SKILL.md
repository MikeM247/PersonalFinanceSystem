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
3. Run relevant checks to verify build and behavior.
4. Summarize what changed and why.

## Rules
- Implement ONE task only; defer adjacent work.
- No unrelated refactors, renames, or formatting-only churn.
- Preserve existing architecture and conventions.
- Ensure the project builds and tests relevant to the story pass.
- If blocked, report the blocker and provide the smallest safe fallback.

## Output
Return:
- `## Story Implemented`
- `## Changes Made`
- `## Validation`
  - Commands run and outcomes.
- `## Out-of-Scope / Follow-ups`
