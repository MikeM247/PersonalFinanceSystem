# Feature: Transaction Management

## Goal

Capture, maintain, and review actual income and expense transactions that drive budget-versus-actual analysis.

## User Value

The user can track real financial activity in one system and no longer rely on scattered spreadsheet entries or manual reconciliations.

## Requirements

* Allow manual entry of transactions with date, amount, type, description, category, and optional notes or source tag.
* Support both income and expense transactions.
* Allow existing transactions to be edited.
* Allow existing transactions to be deleted or soft-deleted.
* Provide a paged transaction list.
* Allow filtering by date range, month, year, category, type, and text search.
* Visibly identify uncategorized transactions for cleanup.

## Constraints

* One transaction maps to one category in the MVP.
* Changes must be persisted atomically and support audit-friendly timestamps.
* The UI should provide strong filtering and clear confirmation for destructive actions.
* Soft delete should be used only where it preserves historical integrity and traceability.

## Acceptance Criteria (High-Level)

* The user can create, edit, and remove transactions without corrupting history.
* Transaction lists support the required filters and paging behavior.
* Uncategorized transactions are clearly surfaced to the user.
* Transaction changes update actual spend and income values used by reporting and dashboard views.
