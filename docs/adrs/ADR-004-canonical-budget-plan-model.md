# ADR-004: Canonical Budget Plan Model for Annual and Monthly Planning

- Status: Accepted
- Date: 2026-04-05

## Context

FR-004 introduces annual budgeting, but the feature does not live in isolation. The annual plan is the baseline for FR-005 monthly generation, FR-007 variance reporting, FR-010 budget CSV import, and FR-012 export. The product requirements sketch `budgets` and `budget_lines`, yet they do not define how annual and monthly plans share storage, how active versus draft budget versions should behave, or whether omitted category rows represent zero planned value.

FR-002 already established canonical `financial_years` and generated `budget_periods`, and FR-003 established a stable typed category hierarchy. Budget planning now needs a compatible model that can reuse those foundations without creating separate annual and monthly planning silos.

The repository is also still early in implementation. Budget persistence and services are not yet present, so the model chosen now will directly shape the schema, service contracts, imports, reports, and future monthly planning flows.

## Decision

The system will use a single canonical budget model for planned values:

- `budgets` are year-scoped plan containers with explicit `budget_scope` values of `annual` or `monthly`.
- `budget_lines` remain the single planned-value table. Every line references one budget, one canonical `budget_period`, and one category.
- Annual budgets store lines against the generated annual `budget_periods` row for the selected financial year. Monthly budgets will store lines against the monthly `budget_periods` rows for that same year.

The system will use lightweight lifecycle management for budget versions:

- Each user may have multiple draft budgets and archived budgets for the same financial year and scope.
- Each user may have at most one active budget per `(financial_year_id, budget_scope)` at a time.
- Activating a budget promotes it to active and archives the previously active budget for that same year and scope transactionally.
- Draft and active budgets may be edited. Archived budgets are read-only historical snapshots.

The system will use sparse storage and exact amounts:

- Missing budget lines represent zero planned amount rather than requiring explicit zero rows.
- The system stores only the persisted line set and builds zero-filled read models from the category catalog when presenting planning and reporting views.
- Planned amounts are stored in exact minor units in persistence and exposed through APIs as decimal strings.

## Consequences

### Positive
- Annual planning, monthly planning, reporting, import, and export all reuse one budget structure instead of maintaining separate annual and monthly storage models.
- Canonical `budget_periods` from FR-002 remain the time anchor for both annual and monthly plan lines.
- Sparse storage keeps writes smaller and avoids unnecessary zero-value rows.
- Exact money storage avoids floating-point drift in planning and reporting totals.
- One active budget per scope and year gives downstream features a clear default baseline.

### Negative
- Shared annual and monthly storage requires careful validation so annual budgets cannot accidentally mix with monthly periods.
- Sparse storage means domain services and reports must consistently zero-fill omitted categories.
- Allowing active budgets to remain editable keeps the workflow simple, but it also means the current reporting baseline can change over time.
- Automatic archival of the previous active budget preserves history, but it makes active-state comparisons and scenario planning more explicit workflow choices rather than freeform parallel states.
