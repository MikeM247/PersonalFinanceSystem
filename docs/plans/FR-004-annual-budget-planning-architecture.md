# FR-004 Annual Budget Planning Architecture

## Skill Invocation
- Skill: architect
- Scope: FR-004 Annual Budget Planning
- Requirements Validated: no
- Enforcement Files Read:
  - .codex/enforcement/architecture.md
  - .codex/enforcement/adr.md
- Key Risks Identified: ambiguous budget lifecycle semantics, undefined zero-value and activation behavior, and cross-feature drift if annual and monthly plans do not share one canonical budget model.

## 1. Problem Framing

### Goals
- Introduce a canonical annual budget model that the user can create, edit, review, and activate for a selected financial year.
- Allow planned annual amounts per category across both income and expense categories.
- Preserve a stable budget baseline that FR-005 monthly generation, FR-007 variance reporting, FR-010 CSV import, and FR-012 export can all reuse.
- Keep annual budget data aligned to the canonical financial year and category structures defined by FR-002 and FR-003.
- Store and expose planned values in a way that remains trustworthy for downstream calculations and reporting.

### Constraints
- Annual budgeting must reuse the financial year and generated budget period model established by FR-002.
- Annual budget lines must reuse the typed category catalog and archive rules established by FR-003.
- The workflow must remain simple enough for a single-user spreadsheet-replacement budgeting flow.
- Business rules must live in shared domain services rather than in React components or thin API handlers.
- The current repository implements auth persistence in `packages/db` and auth services in `packages/core`; budget-specific persistence, services, and any `apps/api` or `apps/web` layers are target architecture, not current implementation reality.
- The current persistence direction is SQLite-oriented, but the design should remain portable enough for future database changes.

### Assumptions
- Each financial year may have multiple annual budget drafts, but at most one annual budget is active for that year at a time.
- Activating an annual budget promotes it to the default plan used by downstream features, and any previously active annual budget for the same year is archived transactionally.
- Draft and active annual budgets may be edited; archived annual budgets are read-only historical snapshots.
- Categories omitted from an annual budget line set are interpreted as zero planned amount rather than requiring explicit zero-value rows.
- Planned amounts are always non-negative; category type determines whether a value participates in income or expense totals.
- MVP annual budgeting uses one user base currency; per-budget or per-line multi-currency support is out of scope.
- Monetary values are persisted in exact minor units and exposed at API boundaries as decimal strings.

### Requirements Completeness
The feature requirements are directionally strong but not complete enough to implement without explicit assumptions. Architecture can proceed, but lifecycle behavior, line sparsity semantics, and amount representation need to be treated as design decisions rather than already-settled product requirements.

### Missing or Ambiguous Requirements
- It is undefined whether more than one annual budget may exist for the same financial year and whether multiple drafts are allowed.
- It is undefined whether an active annual budget remains editable or whether activation should freeze it.
- It is undefined whether activating a new annual budget archives the previous active budget automatically or blocks activation until the user resolves the conflict manually.
- It is undefined whether all active categories must be materialized as annual budget lines or whether omitted categories imply zero planned amount.
- It is undefined whether planned amounts are always positive with category type controlling interpretation, or whether signed values are allowed.
- It is undefined whether archived categories may still be added to draft budgets for historical corrections, or whether they are only preserved on already-existing lines.
- It is undefined whether budget names must be unique inside one financial year.
- It is undefined whether annual budgeting depends on one user-level base currency or whether per-budget currency support is required.

## 2. Architecture Overview

### System Context
- `packages/db` will add budget schema, migrations, and repository implementations for annual budget records and their line items.
- `packages/core` will own annual budget lifecycle rules, amount normalization, line validation, zero-fill read models, and activation behavior.
- `apps/api` will expose annual budget management endpoints under `/api/v1/budgets`.
- `apps/web` will provide the annual budget builder, budget version selection, and activation workflow for the selected financial year.
- FR-005, FR-007, FR-010, and FR-012 will consume the annual budget model rather than implementing feature-local planning structures.

### High-Level Components
- Annual budget builder UI for year selection, line editing, totals, and activation.
- Budget management API surface for annual budget create, list, detail, save, archive, and activate operations.
- Annual budget domain service for lifecycle rules, validation, amount handling, and read model composition.
- Budget persistence layer for `budgets` and `budget_lines` storage plus transactional replace and activation workflows.
- Downstream budget consumers in monthly generation, reporting, import, and export features.

### Key Design Decisions
- Extend `budgets` with an explicit `budget_scope` so annual and monthly plans can share one canonical persistence model without ambiguous meaning.
- Store annual budget values in `budget_lines` using the generated annual `budget_periods` row from FR-002; monthly plans will later use monthly period rows in the same structure.
- Enforce at most one active annual budget per `(user_id, financial_year_id, budget_scope = annual)` while allowing multiple drafts and archived snapshots.
- Save annual budget line sets atomically as sparse data: omitted categories imply zero, and zero-filled projections are built in the domain layer for UI and reporting consumers.
- Persist monetary values in exact minor units and expose decimal strings in contracts to avoid floating-point drift.
- Create ADR-004 to record the canonical budget plan model because it affects annual planning, monthly generation, reporting, imports, and export.

## 3. Component Design

### Annual Budget Builder UI
Responsibilities:
- Render the selected financial year, available annual budget versions, and the currently active annual plan.
- Display grouped income and expense planning rows using the canonical category catalog.
- Support create, rename, edit, archive, and activate flows for annual budgets.
- Show calculated totals and readiness feedback without duplicating budget rules in the client.

Interactions:
- Calls `GET /api/v1/budgets?financialYearId=...&budgetScope=annual` for version selection and summaries.
- Calls `POST /api/v1/budgets` to create a new annual budget draft.
- Calls `GET /api/v1/budgets/{id}` to load the zero-filled planning matrix and totals.
- Calls `PUT /api/v1/budgets/{id}/lines` to replace the annual line set atomically.
- Calls `POST /api/v1/budgets/{id}/activate` and `PATCH /api/v1/budgets/{id}` for lifecycle changes.

Failure Modes:
- Missing financial year or missing active categories leaves the UI in a guided empty state rather than a broken editor.
- Stale client state can overwrite newer line edits unless requests use `updatedAt` or equivalent concurrency checks.
- API failure must not leave the UI showing partially saved totals or inconsistent active-state badges.

### Budget Management API Surface
Responsibilities:
- Validate DTOs and translate them into core-service commands.
- Enforce authenticated ownership on all budget and budget-line operations.
- Normalize annual budget responses into decimal-string amounts and zero-filled grouped read models.
- Return stable errors for invalid amounts, invalid lifecycle transitions, period/category mismatches, and ownership violations.

Interactions:
- Delegates business rules to `packages/core`.
- Uses repository implementations from `packages/db`.
- Reuses FR-001 authorization context plus FR-002 and FR-003 domain identifiers.

Failure Modes:
- Invalid payload shape returns `400`.
- Invalid monetary format, invalid scope, or malformed lifecycle values return `422`.
- Missing or foreign-user budget, year, or category IDs return `404` or `403`.
- Activation or archive conflicts return `409`.
- Persistence failures return `503` or a generic `500`, with details kept in logs.

### Annual Budget Domain Service
Responsibilities:
- Create annual budget drafts for a financial year and validate lifecycle transitions.
- Resolve the financial year's annual `budget_periods` row and validate that all annual lines bind to it.
- Normalize exact planned amounts, replace annual line sets atomically, and calculate totals for grouped read models.
- Enforce category eligibility rules, including active-category selection for new lines and archived-category preservation for historical reads.
- Promote one annual budget to active state while archiving any previously active annual budget for that year.

Interactions:
- Reads and writes through budget, budget-line, financial-year, budget-period, and category repositories.
- Uses FR-002 for year and annual period validation.
- Uses FR-003 for category ownership, type metadata, and archive semantics.
- Provides the canonical annual baseline that FR-005 monthly generation will consume later.

Failure Modes:
- Missing or duplicated annual period rows break annual line binding and must fail closed.
- Weak amount normalization can introduce reporting drift, so invalid values must be rejected before persistence.
- Non-atomic line replacement can leave duplicate or missing annual lines.
- Non-transactional activation can leave more than one annual budget marked active for the same year.
- Inconsistent zero-fill behavior can cause UI totals and report totals to diverge from stored data.

### Budget Persistence Layer
Responsibilities:
- Persist `budgets` and `budget_lines` with indexes and foreign keys aligned to the financial year and category models.
- Expose filtered reads by user, year, scope, status, and budget detail with line items.
- Support transactional replacement of annual lines and transactional active-budget promotion.
- Preserve archived budget versions for historical inspection and future export.

Interactions:
- Core services use repositories for create, list, detail, update metadata, replace lines, archive, and activate flows.
- Future monthly budget generation reuses the same `budgets` and `budget_lines` structures with monthly periods.
- Reporting and export queries join annual `budget_lines` through `categories` and `budget_periods`.

Failure Modes:
- Missing indexes degrade budget detail loads and annual report queries as yearly history grows.
- Weak foreign-key enforcement can allow cross-user category or financial-year references.
- Partial writes can corrupt annual plan completeness or active-state integrity.

### Downstream Budget Consumers
Responsibilities:
- Treat the active annual budget as the default yearly planning baseline.
- Generate monthly budgets from annual values without inventing a second annual data model.
- Reuse annual budget lines in annual budget-vs-actual reporting and annual export flows.
- Reconcile imported annual budget rows into the same canonical budget and period structures.

Interactions:
- FR-005 reads annual line values by category from the active annual budget for the selected year.
- FR-007 joins annual budget lines with transaction aggregates and category groups for variance reporting.
- FR-010 validates imported annual budget rows against the same year, category, and budget lifecycle rules.
- FR-012 exports selected or active annual budgets through the same canonical read model.

Failure Modes:
- Feature-local assumptions about sign handling or zero defaults can make monthly generation and reporting disagree with annual planning totals.
- Import flows can create duplicate lines if they bypass the canonical `(budget_id, budget_period_id, category_id)` uniqueness rule.
- Report consumers can misstate totals if they treat missing lines as null instead of zero.

## 4. Data Model

### Entities

#### `budgets`
- `id` UUID/TEXT primary key
- `user_id` UUID/TEXT foreign key to `users.id`
- `financial_year_id` UUID/TEXT foreign key to `financial_years.id`
- `budget_scope` enum `annual | monthly`
- `name` string, not null
- `status` enum `draft | active | archived`
- `activated_at` timestamp nullable
- `archived_at` timestamp nullable
- `created_at` timestamp
- `updated_at` timestamp

#### `budget_lines`
- `id` UUID/TEXT primary key
- `budget_id` UUID/TEXT foreign key to `budgets.id`
- `budget_period_id` UUID/TEXT foreign key to `budget_periods.id`
- `category_id` UUID/TEXT foreign key to `categories.id`
- `planned_amount_minor` integer, not null
- `created_at` timestamp
- `updated_at` timestamp

### Relationships
- One `users` record has many `budgets`.
- One `financial_years` record has many `budgets`.
- One `budgets` record has many `budget_lines`.
- Annual budgets store lines only against the generated annual `budget_periods` row for their parent financial year.
- Future monthly budgets will store lines against the monthly `budget_periods` rows for the same financial year.
- `budget_lines.category_id` references the canonical category catalog from FR-003 for both income and expense planning.

### Integrity Constraints
- `budgets.user_id` and `budgets.financial_year_id` must be required and must remain ownership-consistent with the selected financial year.
- `budgets.budget_scope` must be required and immutable after creation.
- At most one annual budget may be active per `(user_id, financial_year_id)`; the service enforces this transactionally during activation.
- `budget_lines` must be unique on `(budget_id, budget_period_id, category_id)`.
- Every annual `budget_lines` row must reference the annual period row belonging to the parent budget's `financial_year_id`.
- `planned_amount_minor` must be greater than or equal to zero.
- New or updated budget lines may reference only active categories owned by the same user; archived categories remain valid only on already-existing historical lines.
- Archived budgets are read-only and may not accept line mutations.

## 5. API Contracts

### `POST /api/v1/budgets`
Purpose:
- Create a new annual budget draft for the selected financial year.

Input:
```json
{
  "financialYearId": "uuid",
  "budgetScope": "annual",
  "name": "FY 2026 Baseline"
}
```

Output:
```json
{
  "budget": {
    "id": "uuid",
    "financialYearId": "uuid",
    "budgetScope": "annual",
    "name": "FY 2026 Baseline",
    "status": "draft"
  }
}
```

Error handling:
- `400` for invalid payload shape.
- `404` when the financial year does not exist for the authenticated user.
- `422` for unsupported `budgetScope` or invalid lifecycle inputs.
- `503` if persistence is unavailable.

### `GET /api/v1/budgets?financialYearId=uuid&budgetScope=annual&includeArchived=false`
Purpose:
- List annual budget versions for one financial year.

Output:
```json
{
  "items": [
    {
      "id": "uuid",
      "name": "FY 2026 Baseline",
      "budgetScope": "annual",
      "status": "active",
      "updatedAt": "2026-04-05T11:00:00.000Z"
    }
  ]
}
```

Error handling:
- `401` for unauthenticated requests.
- `422` for unsupported query values.
- `503` for repository unavailability.

### `GET /api/v1/budgets/{id}`
Purpose:
- Retrieve one annual budget with a zero-filled grouped planning matrix and totals.

Output:
```json
{
  "budget": {
    "id": "uuid",
    "financialYearId": "uuid",
    "budgetScope": "annual",
    "name": "FY 2026 Baseline",
    "status": "draft"
  },
  "groups": [
    {
      "id": "uuid",
      "name": "Salary",
      "categoryType": "income",
      "categories": [
        {
          "categoryId": "uuid",
          "name": "Primary Salary",
          "plannedAmount": "60000.00"
        }
      ]
    }
  ],
  "totals": {
    "income": "60000.00",
    "expense": "42000.00",
    "net": "18000.00"
  }
}
```

Error handling:
- `404` when the budget does not exist for the authenticated user.
- `503` for repository unavailability.

### `PUT /api/v1/budgets/{id}/lines`
Purpose:
- Replace the annual category line set atomically for one annual budget.

Input:
```json
{
  "lines": [
    {
      "categoryId": "uuid",
      "plannedAmount": "12000.00"
    }
  ]
}
```

Output:
```json
{
  "updated": true,
  "totals": {
    "income": "60000.00",
    "expense": "42000.00",
    "net": "18000.00"
  }
}
```

Error handling:
- `400` for invalid payload shape.
- `404` when the budget or a referenced category does not exist for the authenticated user.
- `409` when the budget is archived or the lifecycle state blocks mutation.
- `422` for invalid monetary format, negative values, duplicate categories, or period/category mismatches.
- `503` for repository unavailability.

### `PATCH /api/v1/budgets/{id}`
Purpose:
- Rename or archive an annual budget.

Input:
```json
{
  "name": "FY 2026 Revised",
  "status": "archived"
}
```

Error handling:
- `404` when the budget does not exist for the authenticated user.
- `409` when archiving is blocked because this is the only active annual budget and product rules require a replacement first.
- `422` for unsupported lifecycle transitions.
- `503` for repository unavailability.

### `POST /api/v1/budgets/{id}/activate`
Purpose:
- Promote one annual budget to active state for its financial year and archive the previously active annual budget transactionally.

Output:
```json
{
  "activeBudgetId": "uuid",
  "archivedBudgetId": "uuid"
}
```

Error handling:
- `404` when the budget does not exist for the authenticated user.
- `409` when activation cannot complete because of inconsistent lifecycle state or unresolved integrity issues.
- `503` for repository unavailability.

## 6. Non-Functional Requirements

### Performance Expectations
- Annual budget detail reads must be fast enough to load the yearly planning screen with grouped categories and totals without noticeable lag.
- Full annual line replacement should remain bounded by the number of active categories in one financial year, which is expected to stay modest for MVP single-user usage.
- Annual report queries must remain index-backed when joining budget lines to categories, category groups, and transaction aggregates across several years of history.

### Scalability Approach
- User-scoped budgets preserve clean ownership boundaries for future multi-user support.
- Shared `budgets` and `budget_lines` tables reduce duplication between annual and future monthly planning models.
- Sparse storage keeps writes and storage volume predictable even as the category catalog expands over time.

### Reliability Considerations
- Annual budget creation, line replacement, and activation must commit atomically or not at all.
- Exact money normalization must happen before persistence so reporting never depends on floating-point math.
- If category eligibility or annual-period resolution cannot be verified, the system must reject the mutation rather than store uncertain lines.
- Archived budget versions must remain readable for auditability, export, and historical comparison.

## 7. Observability

### Logging Strategy
- Emit structured logs for `budget.created`, `budget.updated`, `budget.archived`, `budget.activated`, `budget.lines_replaced`, and `budget.activation_failed`.
- Include `request_id`, `user_id`, `financial_year_id`, `budget_id`, and validation outcome where relevant.
- Log rejection reasons for invalid amounts, duplicate categories, and lifecycle conflicts without logging unnecessary financial payload detail.

### Metrics
- `annual_budget_create_success_total`
- `annual_budget_create_failure_total`
- `annual_budget_lines_replace_total`
- `annual_budget_activation_total`
- `annual_budget_activation_conflict_total`
- `annual_budget_detail_read_latency_ms`

### Health Checks
- Readiness checks must verify database connectivity because budget lifecycle operations depend entirely on persistence.
- Budget integrity should be validated primarily through automated tests and optional diagnostics rather than heavyweight runtime repair logic.
- Operational dashboards should surface spikes in activation failures, invalid amount submissions, and annual budget detail latency.

## 8. Execution Plan

### Epic 1: Budget Persistence Foundation

#### Story 1.1: Add annual budget schema support
- Introduce `budgets` and `budget_lines` with annual-scope support, lifecycle fields, and exact amount storage.
- Acceptance criteria:
  - Schema supports annual budget records linked to one financial year and one owning user.
  - `budget_lines` support canonical category and annual-period references.
  - Indexes and constraints support annual budget lookup, detail load, and uniqueness rules.

#### Story 1.2: Add repository operations for annual budget lifecycle
- Expose repository contracts and implementations for create, list, detail, replace-lines, archive, and activate flows.
- Acceptance criteria:
  - Full annual line replacement is transactional.
  - Budget activation archives any previously active annual budget in the same transaction.
  - Repository tests cover rollback behavior and duplicate-line protection.

### Epic 2: Core Annual Budget Services

#### Story 2.1: Implement annual amount normalization and line validation
- Build framework-agnostic services that validate category eligibility, normalize exact amounts, and assemble zero-filled annual planning read models.
- Acceptance criteria:
  - Invalid or negative annual amounts are rejected before persistence.
  - Omitted categories read back as zero in grouped planning views.
  - Annual line totals reconcile exactly from stored values.

#### Story 2.2: Implement budget lifecycle and activation rules
- Add service logic for draft, active, and archived annual budgets.
- Acceptance criteria:
  - At most one annual budget is active for a financial year at a time.
  - Draft and active budgets remain editable while archived budgets are immutable.
  - Activation conflicts return deterministic, user-safe errors.

### Epic 3: API and Web Planning Flow

#### Story 3.1: Expose annual budget endpoints
- Add create, list, detail, replace-lines, archive, and activate endpoints under `/api/v1/budgets`.
- Acceptance criteria:
  - Contracts match the documented request and response shapes.
  - Authenticated ownership is enforced consistently.
  - Invalid amounts, lifecycle conflicts, and foreign references return deterministic errors.

#### Story 3.2: Build the annual budget planner UI
- Add the year-scoped annual budget builder with grouped category rows, totals, and activation workflow.
- Acceptance criteria:
  - The user can create an annual budget and edit planned values by category.
  - Income and expense categories appear in the same canonical planner with clear totals.
  - The active annual budget is visible and changeable for the selected financial year.

### Epic 4: Downstream Integration and Hardening

#### Story 4.1: Integrate annual budgets with monthly generation, reports, and import foundations
- Wire the active annual budget model into FR-005, FR-007, FR-010, and FR-012 foundations.
- Acceptance criteria:
  - Monthly generation reads from the canonical annual budget line set.
  - Annual budget-vs-actual reporting uses the same annual line totals.
  - Budget import and export align with the same year, period, and category rules.

#### Story 4.2: Validate annual budget correctness end to end
- Add automated coverage for persistence, services, API contracts, and planning UI flows.
- Acceptance criteria:
  - Unit tests cover amount parsing, zero-fill behavior, totals, and lifecycle transitions.
  - Integration tests cover transactional line replacement and activation/archiving behavior.
  - End-to-end tests cover annual budget creation, editing, activation, and reload of persisted values.

## 9. Risks / Trade-offs
- Reusing one canonical `budgets` model for annual and monthly plans reduces duplication, but it requires strong scope and period validation to prevent invalid mixes.
- Allowing sparse line storage keeps the write path simple, but it pushes zero-fill responsibility into shared domain read models and reporting logic.
- Allowing active budgets to remain editable matches spreadsheet-style workflows, but it means the reporting baseline can change over time unless older versions are archived intentionally.
- Automatic archival of the previously active annual budget preserves history and keeps one clear default, but it limits parallel "what-if" scenarios in active state.
- Exact minor-unit storage keeps math trustworthy, but it requires deliberate parsing and formatting at all boundaries.
- The current repository has no implemented web or API app layer yet, so this architecture is implementation-ready conceptually but still depends on scaffolding beyond the current auth-focused packages.

## 10. Validation
- Review this architecture against FR-004 plus FR-005, FR-007, FR-010, and FR-012 because annual budget decisions are cross-cutting.
- Validate ADR-004 before implementation so the team agrees on the shared budget plan model, lifecycle semantics, and sparse-line behavior.
- Add unit tests for money normalization, zero-fill projections, total calculations, and lifecycle transitions.
- Add repository integration tests for create, replace-lines, archive, and activate behavior.
- Add API tests for annual budget create, list, detail, replace-lines, archive, and activate endpoints.
- Add end-to-end tests to verify the user can create an annual plan, persist edits, activate it, and reload the same totals without drift.
