# ADR-002: Canonical Financial Year and Period Model

- Status: Accepted
- Date: 2026-04-05

## Context

FR-002 establishes the time structure that downstream budgeting, transaction filtering, dashboard, and reporting features depend on. The feature requires one or more financial years, monthly periods within each year, selection of the relevant year for planning and reporting, and a clear active-year model.

The broader product requirements currently sketch `financial_years` and `budget_periods`, but they leave several implementation-critical details open: whether custom financial years are allowed, how active-year state is stored, whether periods are user-entered or generated, and how transactions should be aligned to fiscal periods without duplicating time-bucketing logic across features.

The current repository also has only auth persistence implemented in `packages/db`. Any time model introduced now needs to be durable, normalized, and compatible with future API and core-service layers rather than optimized for a temporary UI-only workflow.

## Decision

The system will model financial time through explicit user-scoped `financial_years` records and generated `budget_periods` records.

Each `financial_years` record will represent one contiguous 12-month range aligned to whole calendar months. On creation, the system will generate exactly one annual `budget_periods` record and exactly twelve monthly `budget_periods` records transactionally. Monthly periods will be system-managed; users define the year boundaries, but they do not create or edit month rows individually.

The active financial year will be stored as user context through `users.active_financial_year_id`, not as an `is_active` flag on `financial_years`. This keeps "active year" modeled as a per-user default selection instead of an intrinsic property of the year entity, and it avoids cross-database complexity around enforcing a single active row with partial unique indexes.

Transactions will remain anchored by their natural `transaction_date`. Reports and dashboards will derive fiscal membership by joining transaction dates to the generated period date ranges rather than persisting `budget_period_id` directly on transaction rows.

If a financial year has no dependent budgets, reports, or transactions yet, the system may allow boundary correction by regenerating the year's periods transactionally. Once downstream records depend on that year, boundary changes should be blocked and the user should create a replacement year instead, preserving referential stability.

## Consequences

### Positive
- Downstream features reuse one canonical period model instead of recalculating fiscal month boundaries independently.
- Monthly, annual, and year-to-date reporting can share the same period identities and date ranges.
- Active-year selection is resolved through a single user-context pointer, which is simple to query and portable across SQLite/MySQL-style databases.
- Transactions keep their natural accounting date without duplicated or denormalized fiscal foreign keys.

### Negative
- The system stores generated period rows, which adds persistence and migration complexity compared with deriving periods on the fly.
- Resolving actuals into fiscal periods requires date-range joins and careful indexing.
- Blocking boundary edits after downstream data exists makes corrections safer, but it introduces a replacement-year workflow for certain mistakes.
- Storing `active_financial_year_id` on `users` couples one finance-context preference to the user profile until a broader preferences/settings model exists.
