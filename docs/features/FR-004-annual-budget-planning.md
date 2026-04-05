# Feature: Annual Budget Planning

## Goal

Enable the user to create an annual budget for a selected financial year by defining planned amounts per category.

## User Value

The user can set a full-year financial plan in one place and use it as the baseline for monthly budgeting and variance review.

## Requirements

* Allow the user to create an annual budget for a selected financial year.
* Allow planned annual amounts to be defined by category.
* Support both income and expense categories in the budget.
* Keep annual budget data tied to the relevant financial year and budget record.
* Support budget lifecycle states needed for working drafts and active plans.

## Constraints

* Annual budgets must align to the category and financial year structures defined elsewhere in the MVP.
* Calculations and stored values must be trustworthy and consistent for downstream reporting.
* The feature should remain simple enough for a single-user spreadsheet replacement workflow.
* Core budgeting rules should live in service or domain layers rather than UI code.

## Acceptance Criteria (High-Level)

* The user can create an annual budget for a financial year and save planned values by category.
* Annual budget values can include both income and expense targets.
* An annual budget can exist in a draft or active state suitable for later use.
* Saved annual budget data is available for monthly budget generation and annual reporting.

## Status

- 2026-04-05 13:15:22 +02:00 - STEP 1. Architecture complete for feature FR-004-annual-budget-planning - 1h 29m 73s
