# PLAN.md

## Purpose
This document tracks delivery scope in a format optimized for incremental execution by human contributors and AI agents.

Work should be organized as:
- Epic
- Slice
- Story

Only work one story at a time unless explicitly directed otherwise.

---

## Planning Rules
- Prefer small stories that can be completed and reviewed safely.
- Each story should have a clear outcome and acceptance criteria.
- Stories should be implementation-ready before execution.
- Avoid mixing unrelated infrastructure, UI, and domain changes in one story unless they are inseparable.

---

## Status Values
Use these status values:
- Backlog
- Ready
- In Progress
- Blocked
- Done

---

## Story Template

### Story ID
`<ID>`

### Title
`<short title>`

### Status
`Ready`

### Outcome
One or two sentences describing what will exist when the story is complete.

### Scope
- included item
- included item

### Out of Scope
- excluded item
- excluded item

### Acceptance Criteria
- criterion
- criterion
- criterion

### Technical Notes
- architecture notes
- data notes
- AI/event notes
- deployment notes

### Dependencies
- dependency or `None`

### Risks
- risk or `None`

---

## Current Delivery Structure

### Epic: Template Foundation
Goal: establish the reusable monorepo template, context system, and strict workflow.

#### Slice: Documentation Foundation
Goal: create the baseline context and operating documents.

##### Story: DOC-001 Create core context files
Status: Done
Outcome: Core docs exist and define the project operating model.

##### Story: DOC-002 Refine project-specific starter guidance
Status: Backlog
Outcome: Add instructions for adapting the template to a new project.

#### Slice: Repository Foundation
Goal: establish monorepo folders, package boundaries, and starter tooling.

##### Story: REP-001 Create monorepo folder structure
Status: Backlog

##### Story: REP-002 Add workspace and package manager configuration
Status: Backlog

##### Story: REP-003 Add starter app and shared package scaffolds
Status: Backlog

#### Slice: Quality Foundation
Goal: establish lint, typecheck, test, and build standards.

##### Story: QLT-001 Add lint and formatting defaults
Status: Backlog

##### Story: QLT-002 Add typecheck and test scripts
Status: Backlog

##### Story: QLT-003 Add CI validation workflow
Status: Backlog

#### Slice: AI-Readiness Foundation
Goal: make the template ready for future intelligence features.

##### Story: AI-001 Add baseline event model
Status: Backlog

##### Story: AI-002 Add AI-ready metadata conventions
Status: Backlog

##### Story: AI-003 Add placeholder embedding pipeline contract
Status: Backlog

---

## How to Use This File
When a new project starts:
1. keep the planning structure
2. replace template stories with project-specific epics, slices, and stories
3. mark only the next executable story as `Ready`
4. move completed work to `Done`
5. keep scope explicit and small
