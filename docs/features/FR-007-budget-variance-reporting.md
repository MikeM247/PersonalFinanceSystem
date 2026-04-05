# Feature: Budget Variance Reporting

## Goal

Provide monthly, annual, and year-to-date reporting that compares planned values against actual results and highlights variance.

## User Value

The user can see where spending or income is off plan without recreating formulas and pivot tables in spreadsheets.

## Requirements

* Show monthly budget versus actual values by category.
* Show annual budget versus actual values by category and in aggregate.
* Calculate variance amount and variance percentage.
* Display a favorable or unfavorable indicator that makes variance easy to interpret.
* Summarize values by category group.
* Show monthly trends across the selected financial year.
* Show year-to-date budget versus actual values.

## Constraints

* Variance calculations must remain trustworthy and align with the defined planned-minus-actual model.
* Income and expense categories may require different user-facing interpretation of the same raw variance.
* Reporting must perform well across several years of single-user transaction history.
* Reporting logic should remain in backend or shared domain layers, not React components.

## Acceptance Criteria (High-Level)

* Monthly and annual reports show budget, actual, and variance correctly for the selected time period.
* Category and group summaries reconcile to the relevant totals.
* Trend and year-to-date views align with the selected financial year.
* The user can identify over-budget, under-budget, and off-target income positions directly from report outputs.
