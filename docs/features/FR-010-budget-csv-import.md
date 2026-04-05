# Feature: Budget CSV Import

## Goal

Allow the user to import annual or monthly budget data from CSV with validation and preview before the budget data is committed.

## User Value

The user can migrate existing spreadsheet-based budget plans into the application without rebuilding every budget line manually.

## Requirements

* Support importing budget data from CSV.
* Accept budget rows with fields such as year, month, category, and planned amount.
* Provide file upload, preview rows, validation summary, import confirmation, and import result summary.
* Validate required columns, date formats where applicable, numeric formats, and category mapping availability.
* Show import preview and validation results before final commit.
* Preserve the relationship between imported budget data, periods, and categories.
* Surface import status and outcomes to the user.

## Constraints

* CSV is the only supported import format for the MVP.
* Import operations must be rollback-safe and must not leave partial or corrupt budget data behind.
* Reusable import mappings are a later-phase enhancement, not an MVP requirement.
* Imported budget rows must stay compatible with annual and monthly budget reporting.

## Acceptance Criteria (High-Level)

* The user can import budget data from a valid CSV file through a guided workflow.
* Invalid budget files are blocked before commit with clear validation feedback.
* The user sees a preview before imported budget data is persisted.
* Imported budget rows are linked correctly to the relevant period and category context.
* Failed budget imports do not leave partially imported or corrupted budget data behind.
