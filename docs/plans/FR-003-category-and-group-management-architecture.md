# FR-003 Category and Group Management Architecture

## Skill Invocation
- Skill: architect
- Scope: FR-003 Category and Group Management
- Requirements Validated: no
- Enforcement Files Read:
  - .codex/enforcement/architecture.md
  - .codex/enforcement/adr.md
- Key Risks Identified: unresolved historical reclassification rules, ambiguous archive behavior for groups with dependent categories, and unstable import/report behavior if type and naming rules are weak.

## 1. Problem Framing

### Goals
- Establish a canonical category catalog that budgets, transactions, reports, and imports can all reuse.
- Allow the user to create, edit, archive, and order category groups and categories without corrupting historical records.
- Distinguish income and expense categories in a way that supports budgeting, transaction capture, and reporting.
- Keep category and group summaries stable enough for downstream variance and trend reporting.
- Preserve a clean path for future transfer/system categories without polluting the MVP model.

### Constraints
- Transfer and system category types are future-phase capabilities and must not complicate the MVP model.
- Archived categories must not break historical budgets, transactions, reports, or CSV imports.
- The catalog must support category-level reporting, group-level reporting, and import validation.
- Business rules must stay in shared domain services rather than React components or thin API handlers.
- The current repository only implements auth persistence in `packages/db`; `apps/web`, `apps/api`, and `packages/core` remain target architecture layers rather than current implementation reality.
- The design should stay portable across the current SQLite-oriented package setup and the product document's longer-term MySQL target.

### Assumptions
- Category groups are explicit, user-scoped records and each group is created for exactly one category type: `income` or `expense`.
- A category belongs to exactly one group at a time.
- Category and group renames are cosmetic and apply retroactively to historical views; MVP does not version display names over time.
- Archived groups and categories remain queryable for historical reporting, but active budgeting, transaction-entry, and import-selection flows use only non-archived catalog records.
- CSV import resolves category names against the active catalog first; unresolved rows go through mapping or uncategorized handling rather than auto-creating categories.
- FR-006 may allow `transactions.category_id` to remain nullable for uncategorized cleanup flows, but when present it must reference the canonical category catalog defined here.

### Requirements Completeness
The feature requirements are directionally strong but not complete enough for implementation without explicit assumptions. Architecture can proceed, but the unresolved product decisions below should be confirmed before coding begins.

### Missing or Ambiguous Requirements
- It is not defined whether category groups may contain a mix of income and expense categories.
- It is not defined whether a category may change group or type after budgets or transactions already reference it.
- It is not defined whether archiving a group should cascade to child categories, be blocked, or require explicit cleanup first.
- It is not defined whether duplicate category names are allowed and, if so, how CSV import disambiguates them.
- It is not defined whether imports may intentionally map historical rows to archived categories, or whether archived categories are strictly read-only history.
- It is not defined whether the product should expose hard delete for never-used groups/categories, or whether archive-only lifecycle is sufficient for MVP.

## 2. Architecture Overview

### System Context
- `packages/db` will add the category catalog schema, migrations, and repository implementations for groups, categories, ordering, and archive state.
- `packages/core` will own naming rules, type consistency, dependency-aware archive rules, reorder logic, and catalog read models for downstream consumers.
- `apps/api` will expose category-management and catalog-read endpoints under `/api/v1`.
- `apps/web` will provide management screens for groups/categories plus shared selectors used by annual budgets, monthly budgets, transactions, and imports.
- FR-004, FR-005, FR-006, FR-007, and FR-009 will depend on this catalog rather than creating feature-local category models.

### High-Level Components
- Category management UI for create, edit, archive, and reorder flows.
- Category catalog API surface for management commands and grouped read models.
- Core category catalog service for validation, lifecycle rules, and dependency checks.
- Category persistence layer for durable storage and indexed lookups.
- Downstream catalog consumers in budgeting, transaction capture, reporting, and import flows.

### Key Design Decisions
- Model category groups and categories as user-scoped entities with stable IDs and archive-first lifecycle semantics.
- Make `category_groups` explicitly typed as `income` or `expense`, and require all child categories to match the parent group type.
- Keep downstream business records anchored to `category_id`; group-level reporting is derived from the category-to-group relationship rather than duplicating `category_group_id` on transactions or budget lines.
- Lock a category's classification after first use: once a category is referenced by a budget line or transaction, its `category_group_id` and `category_type` may no longer change. Reclassification happens by creating a replacement category and archiving the old one.
- Reserve active catalog uniqueness at the service layer so active category names and active group names remain deterministic for UI selection and CSV import matching, while archived records can coexist for historical continuity.
- Create ADR-003 to record the stable typed category hierarchy and archive-first lifecycle because it is a cross-cutting decision for budgets, transactions, reports, and imports.

## 3. Component Design

### Category Management UI
Responsibilities:
- Render grouped category management with separate income and expense sections.
- Support create, rename, archive, and reorder interactions for groups and categories.
- Show actionable guardrails when archive or reclassification requests are blocked by existing dependencies.
- Consume one normalized catalog DTO for both the management screen and shared selectors.

Interactions:
- Calls `GET /api/v1/category-catalog` for grouped read models.
- Calls group and category command endpoints for create, update, archive, and reorder actions.
- Reuses the same catalog data in annual budget, monthly budget, transaction-entry, and import mapping flows.

Failure Modes:
- Duplicate active names are rejected with actionable validation feedback.
- Attempting to move a used category to a different group returns a conflict rather than silently changing historical group summaries.
- API failure leaves the UI read-safe and does not apply speculative order changes permanently.

### Category Catalog API Surface
Responsibilities:
- Validate DTOs and translate them into core-service commands.
- Enforce authenticated user ownership on every category and group operation.
- Normalize grouped read models and selector-friendly response shapes.
- Return stable errors for duplicate names, archive conflicts, type mismatches, and reorder conflicts.

Interactions:
- Delegates domain decisions to `packages/core`.
- Uses repository implementations from `packages/db`.
- Exposes the same catalog contracts to the management UI, budget flows, transaction flows, and import flows.

Failure Modes:
- Invalid payload shape returns `400`.
- Rule violations such as duplicate active names or illegal reclassification return `409`.
- Type mismatches or malformed reorder payloads return `422`.
- Missing or foreign-user identifiers return `404` or `403`.
- Persistence failures return `503` or a generic `500`, with details only in logs.

### Core Category Catalog Service
Responsibilities:
- Enforce active-name uniqueness, group/type consistency, archive rules, and reorder rules.
- Determine whether a category is "in use" by budgets or transactions and block unsafe classification changes.
- Build grouped catalog projections for active and archived views.
- Centralize server-side filtering so downstream features never infer catalog rules locally.

Interactions:
- Reads and writes through group and category repositories.
- Uses dependency lookups from future budget-line and transaction repositories to determine whether reclassification is safe.
- Reuses authenticated user identity from FR-001 for ownership and audit context.

Failure Modes:
- Incomplete dependency checks can allow historical-report drift, so unsafe updates must fail closed if usage state cannot be determined.
- Non-transactional reorder operations can leave duplicate or missing positions.
- Weak name normalization can cause import ambiguity and inconsistent UI filtering.

### Category Persistence Layer
Responsibilities:
- Persist `category_groups` and `categories` plus archive timestamps and sort order.
- Expose indexed read patterns for grouped catalog listing, active selection, and report joins.
- Support transactional reorder and archive operations.

Interactions:
- Core services use repositories to create, update, archive, and reorder catalog entities.
- Future `budget_lines` and `transactions` repositories reference `categories.id`.
- Reporting queries join `categories` to `category_groups` to compute group summaries.

Failure Modes:
- Missing indexes degrade selector loading and report aggregation performance.
- Weak foreign-key enforcement can allow orphaned categories or broken report joins.
- Partial reorder writes can create unstable ordering across sessions.

### Downstream Catalog Consumers
Responsibilities:
- Use the shared category catalog as the only source for budgetable and selectable categories.
- Validate category references during manual transaction entry and CSV import preview.
- Aggregate report data by category and then by group through the canonical hierarchy.
- Keep archived categories visible only where historical records require them.

Interactions:
- FR-004 and FR-005 store `category_id` on budget lines.
- FR-006 stores `category_id` on transactions when categorized and may allow null for uncategorized cleanup.
- FR-007 joins actuals and planned values to the catalog for category and group summaries.
- FR-009 validates incoming category strings against the active catalog and manual mapping workflow.

Failure Modes:
- Feature-local selector filtering can diverge from the canonical archive/type rules.
- Reusing archived categories in new entry flows can make active planning and capture inconsistent.
- Duplicate or weakly normalized active names can break import matching or produce wrong mappings.

## 4. Data Model

### Entities

#### `category_groups`
- `id` UUID/TEXT primary key
- `user_id` UUID/TEXT foreign key to `users.id`
- `name` string, not null
- `category_type` enum `income | expense`
- `sort_order` integer, not null
- `archived_at` timestamp nullable
- `created_at` timestamp
- `updated_at` timestamp

#### `categories`
- `id` UUID/TEXT primary key
- `user_id` UUID/TEXT foreign key to `users.id`
- `category_group_id` UUID/TEXT foreign key to `category_groups.id`
- `name` string, not null
- `category_type` enum `income | expense`
- `sort_order` integer, not null
- `archived_at` timestamp nullable
- `created_at` timestamp
- `updated_at` timestamp

### Relationships
- One `users` record has many `category_groups`.
- One `users` record has many `categories`.
- One `category_groups` record has many `categories`.
- Future `budget_lines.category_id` references `categories.id` and should be required.
- Future `transactions.category_id` references `categories.id` when categorized and may remain nullable for uncategorized cleanup flows.
- Group-level reports are produced by joining `budget_lines` and `transactions` through `categories` to `category_groups`.

### Integrity Constraints
- `category_groups.user_id` and `categories.user_id` must be required to preserve future multi-user ownership boundaries.
- `categories.user_id` must match the owning `category_groups.user_id`; cross-user group assignment is invalid.
- `category_groups.category_type` must be one of `income` or `expense`.
- `categories.category_type` must equal the parent group's `category_type`; the duplicated value is intentional so category-level selectors and exports remain self-describing.
- Active group names must be unique per user after normalization. Archived groups may coexist with reused names only if they are excluded from active selection.
- Active category names must be unique per user after normalization so imports and selectors can resolve a name to one active category deterministically.
- Active group ordering is maintained as a dense sequence per `(user_id, category_type)`; active category ordering is maintained as a dense sequence per `category_group_id`.
- Archiving a category must not invalidate existing `budget_lines` or `transactions` references.
- A category with dependent budget lines or transactions may be renamed or archived, but its `category_group_id` and `category_type` may not change.
- A group may be archived only when no active categories remain in that group; archived groups remain available for historical joins.

## 5. API Contracts

### `GET /api/v1/category-catalog?type=expense&includeArchived=false`
Purpose:
- Return the grouped category catalog for management screens and shared selectors.

Output:
```json
{
  "groups": [
    {
      "id": "uuid",
      "name": "Housing",
      "categoryType": "expense",
      "sortOrder": 1,
      "archived": false,
      "categories": [
        {
          "id": "uuid",
          "name": "Rent",
          "categoryType": "expense",
          "sortOrder": 1,
          "archived": false,
          "canMove": false,
          "canArchive": true
        }
      ]
    }
  ]
}
```

Error handling:
- `401` for unauthenticated requests.
- `422` for unsupported filter values.
- `503` for repository unavailability.

### `POST /api/v1/category-groups`
Purpose:
- Create a new category group in the requested type lane.

Input:
```json
{
  "name": "Housing",
  "categoryType": "expense"
}
```

Output:
```json
{
  "categoryGroup": {
    "id": "uuid",
    "name": "Housing",
    "categoryType": "expense",
    "sortOrder": 3,
    "archived": false
  }
}
```

Error handling:
- `400` for invalid payload shape.
- `409` for duplicate active group names.
- `422` for unsupported `categoryType`.
- `503` if persistence is unavailable.

### `PATCH /api/v1/category-groups/{id}`
Purpose:
- Rename or archive an existing category group.

Input:
```json
{
  "name": "Home",
  "archived": false
}
```

Error handling:
- `404` when the group does not exist for the authenticated user.
- `409` when archiving is blocked because active child categories still exist, or when the new name conflicts with another active group.
- `503` for repository unavailability.

### `POST /api/v1/category-groups/reorder`
Purpose:
- Persist the ordered list of active groups for one category type.

Input:
```json
{
  "categoryType": "expense",
  "orderedGroupIds": ["uuid-1", "uuid-2", "uuid-3"]
}
```

Output:
```json
{
  "updated": true
}
```

Error handling:
- `422` when IDs are missing, duplicated, foreign to the user, or do not all belong to the requested type lane.
- `503` for repository unavailability.

### `POST /api/v1/categories`
Purpose:
- Create a category inside an existing group.

Input:
```json
{
  "categoryGroupId": "uuid",
  "name": "Rent"
}
```

Output:
```json
{
  "category": {
    "id": "uuid",
    "categoryGroupId": "uuid",
    "name": "Rent",
    "categoryType": "expense",
    "sortOrder": 1,
    "archived": false
  }
}
```

Error handling:
- `400` for invalid payload shape.
- `404` when the parent group does not exist for the authenticated user.
- `409` for duplicate active category names.
- `503` if persistence is unavailable.

### `PATCH /api/v1/categories/{id}`
Purpose:
- Rename, move, or archive a category.

Input:
```json
{
  "name": "Primary Rent",
  "categoryGroupId": "uuid",
  "archived": false
}
```

Error handling:
- `404` when the category does not exist for the authenticated user.
- `409` when the requested move would change the group or type of a used category, or when the new active name conflicts with another category.
- `422` when the target group is invalid or its type conflicts with the requested move.
- `503` for repository unavailability.

### `POST /api/v1/categories/reorder`
Purpose:
- Persist the ordered list of active categories within one group.

Input:
```json
{
  "categoryGroupId": "uuid",
  "orderedCategoryIds": ["uuid-1", "uuid-2", "uuid-3"]
}
```

Output:
```json
{
  "updated": true
}
```

Error handling:
- `422` when IDs are missing, duplicated, foreign to the group, or refer to archived records.
- `503` for repository unavailability.

## 6. Non-Functional Requirements

### Performance Expectations
- Active catalog reads must be fast enough to support app bootstrap, budget-form loads, transaction-entry dialogs, and import preview without noticeable lag.
- Reorder operations should update only the affected active list and remain bounded by the number of groups in one type lane or categories in one group.
- Category and group report aggregations must remain index-backed as transaction history grows across multiple financial years.

### Scalability Approach
- User-scoped catalog records preserve clean ownership boundaries for future multi-user support.
- Shared category selectors prevent budget, transaction, report, and import modules from duplicating category logic.
- Typed groups and stable category IDs keep downstream queries predictable and reduce repeated classification logic.

### Reliability Considerations
- Create, archive, move, and reorder operations must commit transactionally or not at all.
- If dependency state cannot be resolved reliably, the system must reject classification-changing updates rather than risk historical drift.
- Archived records must be excluded server-side from active selectors so clients do not need to enforce lifecycle rules themselves.

## 7. Observability

### Logging Strategy
- Emit structured logs for `category_group.created`, `category_group.updated`, `category_group.archived`, `category.created`, `category.updated`, `category.archived`, `category.reordered`, and `category.reclassification_rejected`.
- Include `request_id`, `user_id`, entity ID, group ID where relevant, and validation outcome.
- Avoid logging full request payloads if they could expose notes or imported row contents beyond what is necessary for debugging.

### Metrics
- `category_group_create_success_total`
- `category_group_archive_conflict_total`
- `category_create_success_total`
- `category_archive_total`
- `category_reclassification_rejection_total`
- `category_catalog_read_latency_ms`

### Health Checks
- Readiness checks must verify database connectivity because catalog reads and writes depend on persistence.
- Catalog consistency should be validated primarily through automated integration tests and optional diagnostics rather than heavyweight runtime health checks.
- Operational dashboards should surface spikes in duplicate-name conflicts, archive conflicts, and catalog read latency.

## 8. Execution Plan

### Epic 1: Category Catalog Persistence Foundation

#### Story 1.1: Add category group and category schema support
- Introduce `category_groups` and `categories` in the persistence layer with archive timestamps, type fields, and sort order.
- Acceptance criteria:
  - Schema supports user-scoped groups and categories with archive state and ordering.
  - Foreign keys prevent orphaned categories and cross-user assignments.
  - Indexes support active catalog reads and report joins.

#### Story 1.2: Add repository operations for lifecycle and ordering
- Expose repository contracts and implementations for create, update, archive, list, and reorder flows.
- Acceptance criteria:
  - Reorder operations are transactional.
  - Archive operations preserve existing references.
  - Repository tests cover duplicate-name rejection and archive/read behavior.

### Epic 2: Core Category Catalog Services

#### Story 2.1: Implement naming, type, and archive rules
- Build framework-agnostic services that enforce active-name uniqueness, group/type consistency, and archive guardrails.
- Acceptance criteria:
  - Groups are created in explicit income or expense lanes.
  - Categories inherit and persist the parent group type.
  - Group archive is blocked while active child categories remain.

#### Story 2.2: Implement dependency-aware reclassification rules
- Add service logic that detects downstream usage and blocks unsafe category moves or type changes.
- Acceptance criteria:
  - Used categories cannot change group or effective type.
  - Rename and archive remain allowed for used categories.
  - Conflict responses are deterministic and explain why a move was rejected.

### Epic 3: API and Web Management Flows

#### Story 3.1: Expose category catalog endpoints
- Add grouped-read, create, update, archive, and reorder endpoints under `/api/v1`.
- Acceptance criteria:
  - API responses match the documented contracts and error semantics.
  - Authenticated ownership is enforced consistently.
  - Active catalog responses can power both management and shared selector UI.

#### Story 3.2: Build category and group management UI
- Add management screens for typed group lanes, category lists, archive flows, and drag/drop or ordered repositioning.
- Acceptance criteria:
  - The user can create, rename, archive, and reorder groups and categories.
  - Archive and move conflicts are surfaced with actionable messaging.
  - Archived records are hidden from normal active lists while remaining available in historical views.

### Epic 4: Downstream Integration and Hardening

#### Story 4.1: Integrate budgets, transactions, reports, and imports with the shared catalog
- Replace feature-local category assumptions with the canonical catalog in downstream flows.
- Acceptance criteria:
  - Budget lines save canonical `category_id` values.
  - Transaction entry and import preview validate against active categories.
  - Reporting aggregates category and group totals through the shared hierarchy.

#### Story 4.2: Validate historical integrity end to end
- Add automated coverage for archive behavior, reclassification conflicts, selector filtering, and group summaries.
- Acceptance criteria:
  - Unit tests cover normalization, type consistency, and dependency-lock rules.
  - Integration tests cover transactional reorder and archive flows.
  - End-to-end tests cover management UI, budget selection, transaction selection, and report group summaries.

## 9. Risks / Trade-offs
- Locking group and type changes after first use preserves historical group reporting, but it makes certain reorganizations require replacement categories instead of simple edits.
- Typed groups simplify reporting and selector logic, but they remove the flexibility to intentionally mix income and expense categories under one group.
- Active-name uniqueness simplifies imports and UI selection, but it constrains how users can reuse display names until older records are archived.
- Archive-first lifecycle preserves references, but it means the catalog will accumulate inactive records over time and requires clear UI filtering.
- The repository still lacks `apps/web`, `apps/api`, and `packages/core`, so this architecture is implementation-ready conceptually but depends on scaffolding beyond the existing auth-focused persistence package.

## 10. Validation
- Review this architecture against FR-003 plus FR-004, FR-005, FR-006, FR-007, and FR-009 because category decisions are cross-cutting.
- Validate ADR-003 before implementation so the team agrees on typed groups, archive-first lifecycle, and dependency-aware reclassification rules.
- Add unit tests for name normalization, type matching, archive eligibility, and dependency locks.
- Add repository integration tests for grouped reads, transactional reorder, and archive behavior.
- Add API tests for grouped catalog reads, create, update, archive, and reorder endpoints.
- Add end-to-end and downstream contract tests to verify that archived categories disappear from active selectors while category and group reports remain historically correct.
