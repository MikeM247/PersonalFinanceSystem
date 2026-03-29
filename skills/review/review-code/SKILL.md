---
name: review-code
description: Use when performing a senior-level review of code changes for correctness, maintainability, and production risk.
---

# Review Code

## Goal
Provide a rigorous, actionable review that identifies high-impact issues before merge.

## Task
Review the proposed changes and evaluate:
1. Correctness and edge cases.
2. Performance and scalability concerns.
3. Architectural consistency and maintainability.
4. Security, reliability, and operational risk.

## Rules
- Prioritize findings by impact and likelihood.
- Be specific: cite exact files/areas and failure modes.
- Suggest concrete fixes, not generic advice.
- Distinguish blocking issues from non-blocking improvements.
- Avoid stylistic nitpicks unless they affect maintainability or defects.

## Output
Return Markdown with:
- `## Review Summary`
- `## Findings`
  - `### [Severity: Critical|High|Medium|Low] <title>`
    - `Issue:`
    - `Why it matters:`
    - `Suggested fix:`
- `## Recommended Next Steps`
