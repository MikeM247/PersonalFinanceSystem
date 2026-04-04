---
name: deploy
description: Use when validating release readiness for Vercel deployments, including build, configuration, and data migration risk.
---

# Deploy

## Goal
Provide a go/no-go deployment assessment with clear risks and required actions for a safe Vercel release.

## Task
Assess deployment readiness by verifying:
1. Build and runtime configuration.
2. Required environment variables.
3. Database migration safety and rollout order.
4. Post-deploy verification plan.

## Rules
- Treat missing critical configuration as a no-go.
- Validate assumptions against repository configuration when available.
- Highlight rollback strategy for risky changes.
- Separate required actions from optional improvements.
- Keep recommendations specific to Vercel + Prisma + Neon workflows.

## Output
Return:
- `## Deployment Checklist`
  - Build
  - Environment Variables
  - Database Migrations
  - Observability / Smoke Tests
- `## Risks`
- `## Go/No-Go Decision`
- `## Required Actions Before Deploy`
