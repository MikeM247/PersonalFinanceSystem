---
name: fix-ci
description: Use when CI pipelines fail and you need root-cause analysis, minimal remediation, and prevention guidance.
---

# Fix CI

## Goal
Restore CI reliability quickly by identifying the true root cause and applying the smallest safe fix.

## Task
1. Parse failing CI job logs and isolate first meaningful failure.
2. Determine root cause (code, config, dependency, environment, or workflow).
3. Propose and apply minimal corrective change.
4. Recommend prevention steps to reduce recurrence.

## Rules
- Diagnose before changing code.
- Prefer minimal, reversible fixes.
- Do not mask failures by disabling checks unless explicitly approved.
- Validate the fix with the closest local equivalent command.
- Document assumptions when log context is incomplete.

## Output
Return:
- `## CI Failure Summary`
- `## Root Cause`
- `## Minimal Fix`
- `## Validation`
- `## Prevention`
