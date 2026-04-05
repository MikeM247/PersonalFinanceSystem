# Feature Implementation

# STEP 1 â€” Architecture
Use the skill: architecture/architect

## Input:
Feature: "FR-007-budget-variance-reporting"

### Context:
- docs/CONTEXT.md
- docs/ARCHITECTURE.md
- docs/features/FR-007-budget-variance-reporting.md

### Goal:
- Validate requirements completeness
- Identify missing or ambiguous requirements
- Define architecture changes required
- Define data model and API impacts
- Identify risks and trade-offs
- Identify required ADRs

### Output:
- Write to: docs/plans/FR-007-budget-variance-reporting-architecture.md
- Create ADRs in docs/adrs/ if required
- Update docs/features/FR-007-budget-variance-reporting.md Status section, append current date and time and "STEP 1 â€” Architecture complete for feature " Featurename
   - If the Status section doesn't exist, add it to the end of the file

## STEP 2. Planning
Use the skill: planning/plan-feature

### Input:
Feature: "FR-007-budget-variance-reporting"

### Context:
- docs/CONTEXT.md
- docs/ARCHITECTURE.md
- docs/features/FR-007-budget-variance-reporting.md
- docs/plans/FR-007-budget-variance-reporting-architecture.md
- docs/adrs/
  
### Goal:
- Break architecture into epics and stories
- Define acceptance criteria for each story
- Define dependencies and execution order
- Ensure stories are implementable independently
- Include test requirements per story

### Output:
- Write to: docs/plans/FR-007-budget-variance-reporting-plan.md
- Update docs/features/FR-007-budget-variance-reporting.md Status section, append current date and time and "STEP 2. Planning complete"
   - If the Status section doesn't exist, add it to the end of the file

## STEP 3 - Implementation
Use the skill: implementation/implement-story

### Input:
Task "Establish authentication persistence and repository contracts"

### Context:
- docs/CONTEXT.md
- docs/ARCHITECTURE.md
- docs/features/FR-007-budget-variance-reporting.md
- docs/plans/FR-007-budget-variance-reporting-architecture.md
- docs/plans/FR-007-budget-variance-reporting-plan.md
- docs/adrs/
- .codex/enforcement/

### Goal:
- Implement ONE story only
- Add/update tests
- Validate against acceptance criteria

### Rules:
- Do NOT implement multiple stories
- Do NOT exceed story scope
- MUST follow enforcement rules

### Output:
- Update docs/plans/FR-007-budget-variance-reporting-plan.md - mark the task complete.  
  - If all tasks for an epic is complete, mark the Epic off as well
- Update docs/features/FR-007-budget-variance-reporting.md Status section. append current date and time - duration to execute - name of the Feature - Epic Name - Task Name. "Feature Implementation complete".
   - If the Status section doesn't exist, add it to the end of the file

## STEP 4 â€” Validation & Output
After implementation:
- Confirm:
  - Build passes
  - Tests pass
  - Lint/type checks pass
  - Acceptance criteria satisfied
- Provide structured output including:
  - Summary of changes
  - Tests added/updated
  - Validation results
  - Any assumptions or risks

## GLOBAL RULES
- Always use repository files as the source of truth (not chat memory)
- Do not skip steps
- Do not proceed if inputs are incomplete â€” call it out
- Maintain strict scope discipline
- Prefer small, safe, incremental changes

## EXECUTION MODE
Start at STEP 1 and proceed sequentially.
Stop after STEP 3 unless explicitly instructed to continue.
