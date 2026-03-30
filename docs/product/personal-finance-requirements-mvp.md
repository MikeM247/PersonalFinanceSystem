# Personal Finance System Requirements (MVP-First)
_Last updated: 2026-03-29_

## 1. Purpose

Build a personal finance application to replace multiple spreadsheets with a single clean, user-friendly system.

**Primary implementation stack**
- Front end: React
- Backend services: Python
- Database: MySQL
- Source control: GitHub
- CI/CD: GitHub Actions

This document is written to be **Codex-friendly**:
- clear scope
- explicit boundaries
- implementation-ready structure
- MVP first, then phased expansion
- consistent terminology

---

## 2. Product Vision

Create a secure personal finance system for a single primary user that:
- manages monthly and annual budgeting
- tracks income and expenses
- provides visibility into actual spend vs planned spend
- supports future expansion into assets, investments, net worth, forecasting, and AI-assisted insights
- consolidates existing spreadsheet-driven workflows into one maintainable application

The system should feel:
- simple
- fast
- trustworthy
- visually clean
- easy to update over time

---

## 3. Product Goals

### 3.1 Immediate goal
Deliver an MVP focused on:
- monthly budget planning
- annual budget planning
- category-based expense tracking
- variance reporting
- dashboard visibility
- spreadsheet import to reduce manual recapture

### 3.2 Longer-term goal
Expand into a full personal finance platform with:
- account tracking
- recurring bills
- asset register
- investment tracking
- net worth
- savings goals
- forecasting
- reporting
- AI-assisted categorisation, anomaly detection, and insights

---

## 4. Users and Operating Model

## 4.1 Primary user
Single owner/operator of the system.

## 4.2 Future user model
Design for single-user first, but structure the system so multi-user support could be added later without major redesign.

## 4.3 Usage assumptions
- Web application accessed from desktop first
- Mobile-responsive later, but not core MVP priority
- Sensitive financial data requires strong security practices
- Data may initially come from spreadsheets and manual capture
- Bank integration is not required for MVP

---

## 5. Design Principles

### 5.1 Product principles
- **Clarity over feature overload**
- **Fast entry and fast review**
- **Budget-first workflow**
- **Trustworthy calculations**
- **Spreadsheet migration without pain**
- **Progressive enhancement**
- **AI-ready but not AI-dependent**

### 5.2 Architecture principles
- Modular domain design
- API-first backend
- Clean separation of UI, services, and persistence
- Strong domain model for money, periods, categories, and transactions
- Support staged imports and future automation
- Make reporting easy through a normalized but practical schema

### 5.3 UX principles
- Minimize clicks for common tasks
- Make the current month obvious
- Emphasize planned vs actual vs remaining
- Use clean dashboards and drill-downs
- Keep forms simple and forgiving
- Allow editing without fear
- Show meaningful empty states and helper text

---

## 6. Scope Overview

## 6.1 MVP Scope
The MVP must focus on budget management first.

### Included in MVP
- Budget periods: monthly and annual
- Income categories
- Expense categories
- Budget creation and editing
- Actual transaction capture
- Transaction categorisation
- Budget vs actual reporting
- Monthly and annual dashboard views
- CSV import for budget and/or transaction data
- Basic recurring transaction templates
- Manual adjustments
- Authentication for single user
- Audit-friendly timestamps
- Export capability

### Excluded from MVP
- Bank API integrations
- Investment performance analytics
- Asset depreciation models
- OCR receipt scanning
- AI categorisation
- AI chat assistant
- Tax engine
- Multi-user collaboration
- Advanced notifications
- Native mobile app

---

## 7. MVP Business Capabilities

## 7.1 Budget Management
The system must support:
- creating an annual budget for a selected financial year
- creating month-by-month budgets
- optionally deriving monthly budgets from annual values
- editing monthly budgets independently after generation
- budgeting by category
- grouping categories into higher-level budget groups
- carrying forward unused or overspent amounts in future phases, but **not required for MVP**

## 7.2 Expense and Income Tracking
The system must support:
- manual entry of transactions
- import of transactions from CSV
- transaction date, amount, description, type, and category
- support for income and expense transactions
- transaction editing and deletion
- filtering transactions by period, category, and text search

## 7.3 Variance Reporting
The system must support:
- budgeted amount
- actual amount
- variance amount
- variance percentage
- monthly totals
- annual totals
- category-level and group-level summaries

## 7.4 Dashboard and Review
The system must support:
- current month snapshot
- year-to-date snapshot
- spending by category
- top over-budget categories
- top under-budget categories
- trend view across months
- recent transactions list

## 7.5 Spreadsheet Consolidation
The system must support:
- CSV import for initial migration
- reusable import mappings in a later phase
- validation of imported data
- duplicate prevention where possible
- import preview before commit

---

## 8. Functional Requirements

## 8.1 Authentication and Access

### FR-001 User login
The system shall require authentication before access to financial data.

### FR-002 Session management
The system shall maintain authenticated sessions securely and allow logout.

### FR-003 Single-user authorization
The system shall assume one primary user for MVP, but authorization logic shall be structured so roles can be introduced later.

---

## 8.2 Budget Structure

### FR-010 Financial year
The system shall allow the user to define one or more financial years.

### FR-011 Months within year
The system shall store monthly periods belonging to a financial year.

### FR-012 Budget categories
The system shall allow the user to create, edit, archive, and group budget categories.

### FR-013 Annual budget
The system shall allow the user to define annual planned amounts by category.

### FR-014 Monthly budget
The system shall allow the user to define monthly planned amounts by category.

### FR-015 Annual-to-month generation
The system shall support generating monthly budgets from annual values using one of these methods:
- equal distribution
- manual distribution
- copy previous pattern

### FR-016 Editable generated budgets
The system shall allow generated monthly budgets to be edited manually after creation.

### FR-017 Income and expense category types
The system shall distinguish between:
- income categories
- expense categories
- optional transfer/system categories in later phases

---

## 8.3 Transactions

### FR-020 Manual transaction entry
The system shall allow the user to manually capture a transaction with:
- transaction date
- amount
- type (income or expense)
- description
- category
- optional notes
- optional source tag

### FR-021 Transaction editing
The system shall allow existing transactions to be edited.

### FR-022 Transaction deletion
The system shall allow existing transactions to be deleted or soft-deleted.

### FR-023 Transaction listing
The system shall provide a paged and filterable transaction list.

### FR-024 Transaction filtering
The system shall allow filtering by:
- date range
- month
- year
- category
- type
- search text

### FR-025 Uncategorized transactions
The system shall visibly identify uncategorized transactions.

### FR-026 Import transactions
The system shall allow importing transactions from CSV.

### FR-027 Import preview
The system shall show import preview and validation results before final commit.

### FR-028 Duplicate handling
The system shall attempt duplicate detection using configurable heuristics such as date, amount, and description.

---

## 8.4 Budget vs Actual Reporting

### FR-030 Monthly comparison
The system shall show monthly budget vs actual values by category.

### FR-031 Annual comparison
The system shall show annual budget vs actual values by category and in aggregate.

### FR-032 Variance values
The system shall calculate:
- variance amount
- variance percentage
- favourable/unfavourable indicator

### FR-033 Group summaries
The system shall summarize values by category group.

### FR-034 Trend analysis
The system shall show monthly trends across the selected year.

### FR-035 Year-to-date view
The system shall show year-to-date budget vs actual.

---

## 8.5 Dashboard

### FR-040 Dashboard overview
The system shall provide a dashboard landing page summarizing:
- current month total income
- current month total expenses
- current month variance
- year-to-date variance
- highest spending categories
- recent transactions

### FR-041 Visualizations
The system shall provide charts for:
- monthly spend trend
- spend by category
- budget vs actual comparison

### FR-042 Drill-down
The system shall allow drill-down from dashboard figures into relevant transaction or budget detail.

---

## 8.6 Imports and Exports

### FR-050 CSV import for budgets
The system shall support importing budget data from CSV.

### FR-051 CSV import for transactions
The system shall support importing transaction data from CSV.

### FR-052 Import validation
The system shall validate:
- required columns
- date format
- numeric format
- category mapping availability

### FR-053 Export
The system shall allow export of:
- monthly budget report
- annual budget report
- transactions list

---

## 8.7 Recurring Entries

### FR-060 Recurring templates
The system shall allow defining recurring monthly items such as salary, rent, subscriptions, or utilities.

### FR-061 Suggested generation
The system shall support generating planned entries from recurring templates for review.

### FR-062 Manual confirmation
The user shall be able to review, edit, and confirm generated entries before they become active records.

---

## 9. Non-Functional Requirements

## 9.1 Performance
- Normal page loads should feel near-instant for typical single-user data volumes.
- List and dashboard views should respond quickly for datasets up to at least several years of personal transaction history.
- Import processing should provide progress/status feedback.

## 9.2 Security
- All sensitive access must require authentication.
- Passwords must be hashed securely.
- Secrets must not be hardcoded.
- Sensitive config must be environment-driven.
- Transport must use HTTPS in deployed environments.
- Basic audit logging should exist for key changes.

## 9.3 Reliability
- Changes should be persisted atomically.
- Import operations should be rollback-safe.
- The system should prevent partial corrupt imports.
- Database migrations must be versioned.

## 9.4 Maintainability
- Codebase should be modular and testable.
- Domain logic should not live in React components.
- Business rules should live in Python service/domain layers.
- API contracts should be stable and versioned.

## 9.5 Usability
- The interface should be understandable without training.
- Common flows should be possible in a few steps.
- Error messages should be useful and specific.
- Empty states should help the user know what to do next.

## 9.6 Accessibility
- Use semantic HTML where practical.
- Support keyboard navigation for core workflows.
- Ensure text contrast and readable typography.

---

## 10. Recommended Solution Architecture

## 10.1 High-level architecture

```text
React Web App
    |
    v
Python API Services
    |
    v
MySQL Database
```

### Supporting components
- GitHub repository
- GitHub Actions CI/CD
- File storage for imports/exports if needed
- Optional background jobs for imports and report refreshes

## 10.2 Suggested implementation shape

### Front end
- React
- TypeScript
- Component-based UI architecture
- State management kept simple initially
- Charting library for budget visuals
- Data table/grid for transactions and budget rows

### Back end
- Python REST API
- Clear service layer
- Domain-focused modules
- Validation layer for input and imports
- Background job support later if imports become heavier

### Database
- MySQL relational schema
- Strong indexing for transactions and period queries
- Audit fields on core tables
- Soft delete only where useful

---

## 11. Recommended Logical Modules

## 11.1 MVP modules
1. Authentication
2. Budget setup
3. Category management
4. Transaction management
5. Dashboard and reporting
6. Import/export
7. Recurring templates

## 11.2 Future modules
1. Accounts and balances
2. Bills and reminders
3. Goals and savings
4. Assets register
5. Investments portfolio
6. Net worth
7. Forecasting
8. AI assistant and insights
9. Document storage
10. Tax support

---

## 12. Domain Model (MVP)

## 12.1 Core entities

### User
Represents the authenticated owner of the system.

### FinancialYear
Represents a planning/reporting year.

### BudgetPeriod
Represents a month or a year.

### CategoryGroup
Represents a logical grouping such as:
- Housing
- Transport
- Groceries
- Income
- Utilities

### Category
Represents a budget/transaction category.

### Budget
Represents the budget definition for a year or month.

### BudgetLine
Represents a planned amount for a category in a specific period.

### Transaction
Represents an actual income or expense record.

### RecurringTemplate
Represents a repeatable planned item.

### ImportJob
Represents a data import process and status.

---

## 13. Suggested MVP Data Model

```text
users
- id
- email
- password_hash
- display_name
- base_currency
- created_at
- updated_at

financial_years
- id
- user_id
- name
- start_date
- end_date
- is_active
- created_at
- updated_at

budget_periods
- id
- financial_year_id
- period_type      // year | month
- month_number     // nullable for annual
- start_date
- end_date
- created_at
- updated_at

category_groups
- id
- user_id
- name
- sort_order
- created_at
- updated_at

categories
- id
- user_id
- category_group_id
- name
- category_type    // income | expense
- is_active
- sort_order
- created_at
- updated_at

budgets
- id
- user_id
- financial_year_id
- name
- status           // draft | active | archived
- created_at
- updated_at

budget_lines
- id
- budget_id
- budget_period_id
- category_id
- planned_amount
- created_at
- updated_at

transactions
- id
- user_id
- transaction_date
- amount
- transaction_type // income | expense
- description
- notes
- category_id
- source           // manual | import | recurring
- import_job_id    // nullable
- created_at
- updated_at
- deleted_at       // nullable

recurring_templates
- id
- user_id
- name
- category_id
- amount
- transaction_type
- frequency
- next_due_date
- is_active
- created_at
- updated_at

import_jobs
- id
- user_id
- import_type      // transaction | budget
- file_name
- status           // uploaded | validated | failed | imported
- summary_json
- created_at
- updated_at
```

---

## 14. Key Calculations

## 14.1 Monthly actual
Sum of all transaction amounts for a given month and category.

## 14.2 Annual actual
Sum of all transaction amounts for a given year and category.

## 14.3 Variance amount
`planned_amount - actual_amount`

For expense categories:
- positive can mean under budget
- negative can mean over budget

For income categories:
- interpretation is reversed unless standardized in UI

### Recommendation
Store the raw calculation, but display a user-friendly status:
- On track
- Over budget
- Under budget
- Behind income target
- Above income target

## 14.4 Year-to-date values
Sum of all values from the start of the financial year through the current selected month.

---

## 15. MVP Screens

## 15.1 Login
Purpose:
- authenticate user

## 15.2 Dashboard
Purpose:
- high-level budget performance snapshot

Key components:
- current month summary cards
- year-to-date summary cards
- budget vs actual chart
- category variance chart
- recent transactions

## 15.3 Financial Year Setup
Purpose:
- define planning year and defaults

## 15.4 Category Management
Purpose:
- manage category groups and categories

## 15.5 Annual Budget Builder
Purpose:
- create annual plan by category

## 15.6 Monthly Budget Builder
Purpose:
- view and edit monthly budgets
- generate monthly budgets from annual values

## 15.7 Transactions
Purpose:
- capture, import, browse, and edit actuals

## 15.8 Import Wizard
Purpose:
- upload CSV
- map columns
- validate data
- preview results
- commit import

## 15.9 Reports
Purpose:
- monthly and annual reporting views

---

## 16. MVP User Flows

## 16.1 First-time setup
1. User signs in
2. User creates financial year
3. User creates category groups and categories
4. User creates annual budget
5. User generates initial monthly budgets
6. User imports or captures transactions
7. User reviews dashboard and variance reports

## 16.2 Monthly review flow
1. Open current month dashboard
2. Review actual vs budget
3. Drill into over-budget categories
4. Review transactions
5. Capture missing transactions or import CSV
6. Adjust budget if required
7. Close out the month

## 16.3 Annual planning flow
1. Select financial year
2. Enter annual planned amounts by category
3. Generate monthly distribution
4. Adjust seasonal months
5. Activate budget

---

## 17. UX and UI Requirements

## 17.1 Visual direction
The application should be:
- minimal
- modern
- calm
- information-rich without clutter
- suitable for frequent use

## 17.2 Layout
- Left navigation for main modules on desktop
- Top summary bar on dashboard
- Main content area optimized for tables and charts
- Consistent filtering pattern across screens

## 17.3 Interaction design
- Inline editing where useful
- Clear save/cancel actions
- Confirmation for destructive actions
- Sticky totals for budget tables
- Strong filter UX for transactions

## 17.4 Empty states
Each main screen should have helpful empty states, such as:
- “No budget created yet”
- “No transactions imported for this month”
- “Create categories to start planning”

## 17.5 Error states
Errors must:
- explain what failed
- explain what can be fixed
- avoid technical jargon in user-facing messages

---

## 18. API Requirements

## 18.1 API style
- RESTful JSON API
- Versioned under `/api/v1`
- Clear request/response schemas
- Predictable error structure

## 18.2 Example API resources
- `/api/v1/auth`
- `/api/v1/financial-years`
- `/api/v1/category-groups`
- `/api/v1/categories`
- `/api/v1/budgets`
- `/api/v1/budget-periods`
- `/api/v1/budget-lines`
- `/api/v1/transactions`
- `/api/v1/recurring-templates`
- `/api/v1/import-jobs`
- `/api/v1/reports`

## 18.3 Example report endpoints
- `/api/v1/reports/dashboard?year=2026&month=3`
- `/api/v1/reports/monthly-budget-vs-actual?year=2026&month=3`
- `/api/v1/reports/annual-budget-vs-actual?year=2026`

---

## 19. Import Requirements

## 19.1 Supported MVP format
- CSV only

## 19.2 Budget import
Support importing budget rows with fields such as:
- year
- month
- category
- planned_amount

## 19.3 Transaction import
Support importing transaction rows with fields such as:
- transaction_date
- description
- amount
- transaction_type
- category

## 19.4 Validation rules
- required columns present
- valid dates
- valid decimal numbers
- valid category references or category mapping workflow
- duplicate warning logic

## 19.5 Import UX
- file upload
- preview rows
- validation summary
- import confirmation
- import result summary

---

## 20. Reporting Requirements

## 20.1 Monthly reports
- monthly budget vs actual by category
- monthly category group summary
- monthly income vs expense summary

## 20.2 Annual reports
- annual budget vs actual by category
- annual totals by month
- annual variance trends

## 20.3 Downloadable reports
Allow CSV export at minimum.

---

## 21. Security Requirements

## 21.1 MVP security baseline
- authenticated access
- secure password hashing
- secure secret storage
- HTTPS in deployment
- server-side validation
- sanitized logging
- environment-specific configuration

## 21.2 Auditability
Capture timestamps and user/action context for key events such as:
- login
- budget creation
- budget update
- transaction import
- transaction edit
- transaction delete

---

## 22. AI-Readiness Requirements

The MVP will not include AI features, but must be designed to support them later.

## 22.1 Future AI use cases
Potential future AI features:
- category suggestion for uncategorized transactions
- recurring expense detection
- anomaly detection
- conversational finance Q&A
- budget recommendations
- forecasting assistance

## 22.2 Architectural provisions for AI
The system should:
- keep domain data clean and structured
- retain stable entity identifiers
- capture useful metadata on transactions
- support derived reporting tables later
- isolate AI features behind separate service interfaces
- avoid coupling core budgeting logic to AI logic

## 22.3 Privacy principle for AI
AI must be optional and not required for core product use.

---

## 23. Recommended Repository Structure

```text
personal-finance/
├─ apps/
│  ├─ web/                     # React front end
│  └─ api/                     # Python API service
├─ docs/
│  ├─ requirements.md
│  ├─ architecture.md
│  ├─ api-spec.md
│  ├─ domain-model.md
│  └─ roadmap.md
├─ infra/
│  ├─ github-actions/
│  └─ scripts/
├─ database/
│  ├─ migrations/
│  ├─ seeds/
│  └─ schema/
├─ tests/
│  ├─ api/
│  ├─ web/
│  └─ e2e/
└─ .github/
   └─ workflows/
```

---

## 24. CI/CD Requirements

## 24.1 Source control workflow
- GitHub repository
- branch-per-feature
- pull request workflow
- protected main branch

## 24.2 CI pipeline
At minimum:
- lint front end
- type check front end
- run Python tests
- run API lint/format checks
- run build checks
- run database migration checks

## 24.3 CD pipeline
For MVP, deploy:
- React app
- Python API
- MySQL database in target environment

The deployment platform can be chosen later, but the application should be environment-configurable.

---

## 25. Out-of-Scope for MVP but Planned

### Phase 2
- account register
- recurring bills dashboard
- savings goals
- improved imports
- more reports
- balance tracking

### Phase 3
- asset tracking
- liabilities
- net worth dashboard
- investment holdings
- price history imports

### Phase 4
- forecasting
- alerts
- AI-assisted categorisation
- AI insight assistant
- anomaly detection
- natural language reporting

---

## 26. Recommended MVP Delivery Sequence

### Slice 1: Foundation
- repo setup
- React app scaffold
- Python API scaffold
- MySQL setup
- auth foundation
- CI setup

### Slice 2: Core master data
- financial years
- category groups
- categories

### Slice 3: Budget engine
- annual budgets
- monthly budgets
- distribution from annual to monthly
- budget editing UI

### Slice 4: Transactions
- manual entry
- list/filter/edit/delete
- category assignment

### Slice 5: Budget vs actual reporting
- monthly reports
- annual reports
- dashboard cards and charts

### Slice 6: Imports
- transaction CSV import
- budget CSV import
- preview and validation

### Slice 7: Recurring templates
- create templates
- generate suggested entries

### Slice 8: Hardening
- audit logging
- better validation
- export
- UX refinement
- test coverage improvement

---

## 27. Acceptance Criteria for MVP

The MVP is complete when:

1. A user can define a financial year.
2. A user can create category groups and categories.
3. A user can create an annual budget.
4. A user can generate and edit monthly budgets.
5. A user can capture and import transactions.
6. Transactions affect actual spend correctly.
7. The dashboard shows monthly and annual budget vs actual summaries.
8. Monthly and annual reports show variances by category.
9. CSV import works with preview and validation.
10. The system is deployable through a repeatable CI/CD workflow.
11. Core flows are usable without spreadsheets for monthly and annual budgeting.

---

## 28. Open Questions for Final Refinement

These answers will improve later story creation:

1. What is your base currency?
2. Does your financial year align to calendar year or custom year?
3. Do you want zero-based budgeting or conventional category budgeting first?
4. Do you want income budgeting in MVP or expense-only budgeting first?
5. How many years of historic spreadsheet data do you want to import initially?
6. Do you want split transactions in MVP, or can each transaction map to one category only at first?
7. Do you want planned recurring items to automatically become transactions, or only suggested items for confirmation?
8. Do you want budget rollover behavior later?
9. Do you want separate personal and household budgets in future?
10. Do you want actual bank account balance tracking in Phase 2?

---

## 29. Architect Recommendation

### Recommended MVP decisions
To keep the first build clean and high-value, use these defaults:

- Single-user system
- Desktop-first responsive web UI
- Calendar year unless you need otherwise
- One transaction maps to one category in MVP
- CSV import only
- Manual + import transaction capture
- Annual budget with monthly breakdown
- No bank integration yet
- No AI in MVP
- Strong reporting from day one

### Why this is the right MVP
This gets you off spreadsheets quickly while building the right foundation for:
- better financial discipline
- future asset and investment modules
- future forecasting
- future AI support

---

## 30. Next Document to Create

After this requirements document, the next best document is:

`docs/architecture.md`

Recommended contents:
- system context
- component diagram
- module boundaries
- API conventions
- database design notes
- deployment model
- security model
- AI extension points

After that, generate:
- epic list
- story map
- user story prompts for Codex

