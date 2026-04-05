# Feature: Category and Group Management

## Goal

Provide a structured way to manage category groups and categories used across budgets, transactions, and reports.

## User Value

The user can organize spending and income in a way that makes planning, capture, and reporting understandable and repeatable.

## Requirements

* Allow the user to create, edit, archive, and order category groups.
* Allow the user to create, edit, archive, and order categories.
* Assign each category to a higher-level category group.
* Distinguish between income categories and expense categories.
* Make categories available for both budgeting and transaction capture flows.
* Preserve category references needed for reporting and imports.

## Constraints

* Transfer or system category types are future-phase capabilities, not MVP requirements.
* Archived categories should not break historical budgets, transactions, or reports.
* Category structures must support import validation and category-level reporting.
* Domain rules for category behavior should live outside React components.

## Acceptance Criteria (High-Level)

* The user can create and maintain a usable category hierarchy of groups and categories.
* Categories can be classified as income or expense and reused across budget and transaction screens.
* Archived categories are removed from normal active selection while keeping historical data intact.
* Reports can summarize data at both category and category-group levels.

## Status

- 2026-04-05 11:31:25 +02:00 - STEP 1. Architecture complete for feature FR-003-category-and-group-management - 1h 7m 40s
