# Feature: Recurring Entry Templates

## Goal

Let the user define recurring monthly items and generate suggested entries for review before they become active records.

## User Value

The user can reduce repetitive data entry for predictable items like salary, rent, utilities, and subscriptions while keeping control over final records.

## Requirements

* Allow the user to define recurring monthly items such as salary, rent, subscriptions, or utilities.
* Store recurring template details including category, amount, transaction type, frequency, next due date, and active status.
* Support generating suggested entries from recurring templates for review.
* Allow the user to review, edit, and manually confirm generated entries before activation.
* Integrate confirmed recurring entries into the normal budgeting or transaction workflows as applicable.

## Constraints

* Automatic posting without user confirmation is not required for the MVP.
* The MVP focus is on recurring monthly items rather than a broad automation engine.
* Template generation should reuse core transaction and budgeting rules rather than duplicate them.
* The feature should remain compatible with future expansion into more advanced recurring bill handling.

## Acceptance Criteria (High-Level)

* The user can create and maintain recurring templates for common monthly items.
* The system can generate suggested entries from active templates.
* Suggested entries can be edited before confirmation.
* Generated entries do not become active records until the user explicitly confirms them.
