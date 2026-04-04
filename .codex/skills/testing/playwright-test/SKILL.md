---
name: playwright-test
description: Use when creating or extending Playwright end-to-end tests for critical business user journeys.
---

# Playwright Test

## Goal
Create reliable Playwright coverage for high-value business flows to reduce regression risk.

## Task
1. Identify critical user flows and their success conditions.
2. Define test cases with preconditions, actions, and assertions.
3. Implement maintainable Playwright tests.
4. Document how to run and interpret results.

## Rules
- Prioritize business-critical paths over exhaustive UI permutations.
- Keep tests deterministic and isolated; avoid flaky selectors and timing assumptions.
- Use resilient locators (role, label, test id) before CSS or XPath.
- Include both happy path and at least one meaningful failure/validation path.
- Keep fixtures and setup minimal and reusable.

## Output
Return:
- `## Critical Flows Covered`
- `## Test Cases`
- `## Playwright Test Code`
- `## Run Instructions`
