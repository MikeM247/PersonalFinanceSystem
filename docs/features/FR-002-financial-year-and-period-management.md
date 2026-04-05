# Feature: Financial Year and Period Management

## Goal

Allow the user to define financial years and their monthly periods so budgeting and reporting run against a consistent time structure.

## User Value

The user can plan and review finances in the correct year and month context instead of relying on spreadsheet tabs and manual date organization.

## Requirements

* Allow the user to define one or more financial years.
* Store monthly periods that belong to each financial year.
* Support selecting the relevant financial year for planning and reporting workflows.
* Keep annual and monthly period relationships consistent for budgets, transactions, and reports.
* Support an active year model so the current planning context is clear.

## Constraints

* The MVP is single-user first, but the data model should remain compatible with future multi-user support.
* The default operating assumption is desktop-first usage.
* Period structures must support efficient queries for monthly, annual, and year-to-date views.
* The feature must align with a normalized domain model for financial years and budget periods.

## Acceptance Criteria (High-Level)

* The user can create at least one financial year with valid boundaries.
* The system stores the monthly periods associated with that year.
* Budgeting and reporting features can use the selected financial year without manual date setup.
* The active financial year context is clear and consistent across core flows.

## Status

| Date       | Time     | Step   | Description                                                                  | Duration        |
|------------|----------|--------|------------------------------------------------------------------------------|-----------------|
| 2026-04-05 | 09:41:46 +02:00 | STEP 1. Architecture complete | FR-001-authentication-and-session-management | 1h 28m 8s |
| 2026-04-05 | 22:54:32 +02:00 | STEP 2. Planning complete | FR-002-financial-year-and-period-management | PENDING_DURATION |
