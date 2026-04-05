# Feature: Monthly Budget Generation and Editing

## Goal

Turn annual budget plans into month-by-month budgets and allow manual refinement after generation.

## User Value

The user can reflect seasonality, expected spikes, and real-world adjustments without rebuilding the budget manually every month.

## Requirements

* Allow the user to define monthly planned amounts by category.
* Support generating monthly budgets from annual values using equal distribution.
* Support generating monthly budgets from annual values using manual distribution.
* Support generating monthly budgets from annual values using a copied prior pattern.
* Allow generated monthly budgets to be edited independently after creation.
* Keep monthly budget lines linked to the correct financial year, month, and category.

## Constraints

* Budget rollover or carry-forward behavior is not required in the MVP.
* The workflow should keep the current month obvious and minimize effort for common edits.
* Generated values and edited values must remain compatible with downstream reporting calculations.
* Inline editing and forgiving form behavior should be used where practical.

## Acceptance Criteria (High-Level)

* The user can generate monthly budgets from an annual plan using the supported distribution methods.
* Generated monthly budgets can be manually adjusted without losing the underlying plan context.
* Monthly budget data remains stored per category and per month.
* Edited monthly budgets are reflected correctly in dashboard and reporting features.
