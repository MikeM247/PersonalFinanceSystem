# Feature: Transaction CSV Import

## Goal

Allow the user to import transaction history from CSV through a guided workflow with validation, preview, and duplicate checks before commit.

## User Value

The user can migrate spreadsheet or bank-export transaction data into the system quickly instead of recapturing historical activity by hand.

## Requirements

* Support importing transaction data from CSV.
* Accept transaction rows with fields such as transaction date, description, amount, transaction type, and category.
* Provide file upload, preview rows, validation summary, import confirmation, and import result summary.
* Validate required columns, date formats, numeric formats, and category mapping availability.
* Show import preview and validation results before final commit.
* Attempt duplicate detection using heuristics such as date, amount, and description.
* Surface import status and outcomes to the user.

## Constraints

* CSV is the only supported import format for the MVP.
* Import operations must be rollback-safe and must not leave partial or corrupt transaction data behind.
* Reusable import mappings are a later-phase enhancement, not an MVP requirement.
* Import processing should provide clear progress or status feedback.

## Acceptance Criteria (High-Level)

* The user can import transactions from a valid CSV file through a guided workflow.
* Invalid transaction files are blocked before commit with clear validation feedback.
* The user sees a preview before imported transactions are persisted.
* Potential duplicate transactions are flagged before final import where detection is possible.
* Failed transaction imports do not leave partially imported or corrupted transaction data behind.
