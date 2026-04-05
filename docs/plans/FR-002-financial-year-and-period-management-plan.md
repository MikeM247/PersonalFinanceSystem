### Feature Summary

Implement FR-002 as the canonical finance-time foundation for the product: user-scoped financial years, generated annual and monthly budget periods, active-year selection, and shared current-period resolution that budgeting, reporting, and dashboard flows can consume without manual date setup. The plan keeps persistence concerns in `packages/db`, business rules in `packages/core`, transport in `apps/api`, and user interaction in `apps/web`, following the architecture approved in FR-002 and ADR-002.

### Assumptions & Open Questions

- Assumes a financial year is always a contiguous 12-month range aligned to whole calendar months.
- Assumes custom fiscal years are allowed, not only calendar years.
- Assumes overlapping financial years are not allowed for the same user.
- Assumes the first created financial year becomes active by default unless explicitly overridden.
- Assumes monthly periods are system-generated and not manually edited one by one.
- Open question: whether users may rename or correct year boundaries after creation, and under which dependency conditions.
- Open question: whether delete or archive flows are required in MVP for financial years, or whether create/list/detail/activate is sufficient.
- Open question: whether dashboards should treat "current month" outside the active year as an error, a setup state, or a fallback to the nearest valid period.
- Open question: whether financial years need explicit lifecycle states such as `draft`, `closed`, or `archived` in MVP.

### Architecture Alignment Notes

- This plan aligns with `docs/ARCHITECTURE.md`, `docs/plans/FR-002-financial-year-and-period-management-architecture.md`, and `docs/adrs/ADR-002-financial-period-model.md`.
- No new architecture decisions are introduced in this plan.
- Story boundaries preserve the documented layering rules:
  - `packages/db` owns schema, migrations, and repository implementations.
  - `packages/core` owns validation, period generation, activation rules, and current-period resolution.
  - `apps/api` owns request validation, DTOs, and authenticated endpoint behavior.
  - `apps/web` owns setup UX, year selection UX, and finance-context bootstrap.
- The plan preserves downstream compatibility with `docs/adrs/ADR-003-stable-category-hierarchy.md` and `docs/adrs/ADR-004-canonical-budget-plan-model.md` by keeping `financial_year_id` and `budget_period_id` as the canonical future anchors for category, budget, and reporting features.
- The current repository does not yet contain `packages/core`, `apps/api`, or `apps/web`. Stories that target those layers are still independently implementable, but they may need to include the minimum feature-local scaffolding required for those modules if no broader foundation slice lands first.

### Epic Breakdown

#### Epic 1: Finance Time Persistence Foundation

- [ ] Task: Add financial year and budget period schema support

  Description:
  Add the persistence structures required for user-scoped financial years, generated budget periods, and active-year storage on the authenticated user record.

  Dependencies:
  - ADR-002 accepted
  - FR-001 auth persistence available

  Acceptance Criteria:
    - `financial_years` exists with `user_id`, `name`, `start_date`, `end_date`, and audit timestamps.
    - `budget_periods` exists with `financial_year_id`, `period_type`, `sequence_number`, `start_date`, `end_date`, and audit timestamps.
    - `users.active_financial_year_id` is added as a nullable reference for the authenticated user's default planning context.
    - Foreign keys and uniqueness constraints prevent orphaned period rows and duplicate `(financial_year_id, period_type, sequence_number)` combinations.
    - Indexes exist for per-user financial-year lookup, active-year lookup, and period-by-year retrieval.

  Test Requirements:
    - Unit:
      - Any migration or schema helper constants are covered if helper code is introduced.
    - Integration:
      - Migration applies successfully to a test database and produces the expected tables, foreign keys, and indexes.
      - Invalid duplicate period keys are rejected by persistence constraints.
    - E2E (if applicable):
      - Not applicable.

  Observability:
    - Logging:
      - Log migration failures and schema-application failures without leaking connection secrets.
    - Metrics:
      - None required beyond existing migration or database telemetry.

- [ ] Task: Add finance-period repository contracts and transactional persistence flows

  Description:
  Implement repository interfaces and SQL-backed data-access flows for creating a financial year with its generated periods, listing years, loading year detail, activating a year, and resolving the current active context.

  Dependencies:
  - Add financial year and budget period schema support

  Acceptance Criteria:
    - Repositories expose create, list, detail, activate, and context-read operations without embedding business-rule calculations.
    - Creating a financial year and its generated periods can run inside one transaction and cannot leave a partial write set committed.
    - Repository queries support overlap detection and active-year ownership validation needed by the core service layer.
    - Repository contracts return persistence-shaped data suitable for core-service mapping instead of API-specific DTOs.

  Test Requirements:
    - Unit:
      - Row-mapping and repository helper logic are covered if introduced.
    - Integration:
      - Repository tests cover transactional creation, list/detail reads, active-year updates, and rollback on partial-write failure.
      - Overlap lookup and same-user ownership checks behave correctly against fixture data.
    - E2E (if applicable):
      - Not applicable.

  Observability:
    - Logging:
      - Log repository transaction failures and context-read failures with correlation identifiers when available.
    - Metrics:
      - Optional repository latency metrics if the shared data-access layer already emits them; otherwise none required.

#### Epic 2: Core Financial Context Services

- [ ] Task: Implement financial year validation and period generation services

  Description:
  Build framework-agnostic business logic to validate year boundaries, enforce the twelve-month rule, reject overlaps, and generate the canonical annual and monthly period set.

  Dependencies:
  - Add finance-period repository contracts and transactional persistence flows

  Acceptance Criteria:
    - Only full-month, twelve-month date ranges are accepted.
    - Overlapping financial years for the same user are rejected before persistence commits.
    - The service generates exactly one annual period and exactly twelve contiguous monthly periods for a valid year.
    - Invalid requests fail with explicit business-rule errors that API handlers can translate without guessing.

  Test Requirements:
    - Unit:
      - Boundary validation, month-alignment checks, overlap decisions, and period-generation logic are covered.
    - Integration:
      - Service-to-repository tests prove valid creation succeeds and invalid creation is rejected without partial data.
    - E2E (if applicable):
      - Not applicable.

  Observability:
    - Logging:
      - Record invalid-boundary and overlap rejection events with redacted request context.
    - Metrics:
      - `financial_year_create_success_total`
      - `financial_year_create_failure_total`
      - `financial_year_overlap_rejection_total`

- [ ] Task: Implement active-year selection and current-period resolution services

  Description:
  Add shared services that manage the user's default active financial year and resolve the current fiscal period for a supplied `asOf` date.

  Dependencies:
  - Add finance-period repository contracts and transactional persistence flows
  - Implement financial year validation and period generation services

  Acceptance Criteria:
    - The first created financial year can become the active default without separate manual repair steps.
    - A user can switch the active year only to a year they own.
    - Current-period resolution returns the correct monthly period for both calendar-aligned and custom fiscal years.
    - Missing active context and out-of-range `asOf` requests return explicit service-layer outcomes rather than silent fallbacks.

  Test Requirements:
    - Unit:
      - Active-year selection rules, ownership checks, and `asOf` date resolution are covered.
    - Integration:
      - Service tests cover first-year auto-activation, explicit activation changes, and out-of-range context resolution.
    - E2E (if applicable):
      - Not applicable.

  Observability:
    - Logging:
      - Log activation attempts, ownership rejections, and context-resolution failures.
    - Metrics:
      - `financial_year_activation_total`
      - `financial_context_resolution_latency_ms`

#### Epic 3: API and Web Delivery Slices

- [ ] Task: Expose financial year management and finance-context endpoints

  Description:
  Implement the API layer for create, list, detail, activate, and context-read flows using the core-service contracts and authenticated ownership checks.

  Dependencies:
  - Implement financial year validation and period generation services
  - Implement active-year selection and current-period resolution services

  Acceptance Criteria:
    - `POST /api/v1/financial-years`, `GET /api/v1/financial-years`, `GET /api/v1/financial-years/{id}`, `POST /api/v1/financial-years/{id}/activate`, and `GET /api/v1/financial-context` are implemented according to the architecture contract.
    - Request validation and response DTO mapping live in the API layer rather than in repositories or UI code.
    - Authenticated ownership is enforced for every financial-year and finance-context operation.
    - Error responses distinguish invalid payloads, business-rule violations, missing resources, and infrastructure failures consistently.

  Test Requirements:
    - Unit:
      - Request DTO validation and response mapping helpers are covered.
    - Integration:
      - Endpoint tests cover successful creation, invalid boundaries, overlap rejection, list/detail retrieval, activation, and context lookup.
      - Auth middleware rejects unauthenticated access before finance handlers execute.
    - E2E (if applicable):
      - Not applicable.

  Observability:
    - Logging:
      - Log create, activate, and context endpoint outcomes with user and request correlation identifiers.
    - Metrics:
      - `financial_year_create_success_total`
      - `financial_year_create_failure_total`
      - `financial_year_activation_total`

- [ ] Task: Build financial year setup and management UX

  Description:
  Add the desktop-first web experience for first-run year creation, financial-year review, generated-month inspection, and active-year switching.

  Dependencies:
  - Expose financial year management and finance-context endpoints

  Acceptance Criteria:
    - A user with no financial years sees a setup flow rather than broken downstream screens.
    - The create-year form captures name and date boundaries and shows actionable validation errors.
    - The UI displays available financial years, clearly indicates the active default, and allows switching the active year.
    - Generated monthly periods are visible from the management surface so the user can verify the time structure before using budgets or reports.

  Test Requirements:
    - Unit:
      - Client-side validation, active-year state handling, and selector behavior are covered.
    - Integration:
      - Web-layer tests cover setup submission, validation error rendering, year-list rendering, and active-year switching.
    - E2E (if applicable):
      - Not applicable unless the web E2E harness already exists.

  Observability:
    - Logging:
      - Capture client-side setup and activation failures through the frontend error-reporting path.
    - Metrics:
      - Optional client metric for setup submission failures if frontend telemetry exists.

- [ ] Task: Add shared finance-context bootstrap for downstream feature surfaces

  Description:
  Introduce the reusable client and API consumption path that later budgeting, dashboard, and reporting screens will use to resolve selected year and current fiscal period without duplicating date logic.

  Dependencies:
  - Expose financial year management and finance-context endpoints
  - Build financial year setup and management UX

  Acceptance Criteria:
    - A shared finance-context read model exists for downstream screens to consume active-year and current-period data.
    - Screens that depend on finance context can distinguish setup-required, loading, ready, and error states.
    - The bootstrap path does not duplicate fiscal date calculations in the UI.
    - The shared context contract is documented clearly enough for FR-004, FR-005, FR-007, and FR-008 to consume it later.

  Test Requirements:
    - Unit:
      - Finance-context state transitions and selector helpers are covered.
    - Integration:
      - Bootstrap tests cover no-year, active-year, and out-of-range context states.
    - E2E (if applicable):
      - Not applicable until downstream screens exist.

  Observability:
    - Logging:
      - Log finance-context bootstrap failures and unexpected empty-context states.
    - Metrics:
      - `financial_context_resolution_latency_ms`

#### Epic 4: Regression Safety and Operational Readiness

- [ ] Task: Add financial year change telemetry and audit-friendly event coverage

  Description:
  Complete the operational surface for the feature by capturing the create, activate, and rejection paths in logs and metrics that are safe for production troubleshooting.

  Dependencies:
  - Expose financial year management and finance-context endpoints

  Acceptance Criteria:
    - Financial-year creation success, creation failure, activation, overlap rejection, and context-resolution failure are captured in structured logs.
    - Metrics defined by the architecture are emitted for create, activation, overlap rejection, and context-resolution latency paths.
    - Logged payloads exclude unrelated record contents and sensitive auth/session details.
    - Operational troubleshooting guidance is documented where the project keeps runbook-level notes.

  Test Requirements:
    - Unit:
      - Event payload construction and redaction behavior are covered if helper code is introduced.
    - Integration:
      - Main create and activate flows emit the expected logs and metrics.
      - Overlap and invalid-boundary failures emit the expected rejection signals.
    - E2E (if applicable):
      - Not applicable.

  Observability:
    - Logging:
      - `financial_year.created`
      - `financial_year.activated`
      - `financial_year.activation_failed`
      - `budget_periods.generated`
    - Metrics:
      - `financial_year_create_success_total`
      - `financial_year_create_failure_total`
      - `financial_year_activation_total`
      - `financial_year_overlap_rejection_total`
      - `financial_context_resolution_latency_ms`
      - `budget_period_generation_failure_total`

- [ ] Task: Add regression coverage for first-run setup and active-year switching

  Description:
  Add automated regression coverage that proves the feature works end to end from initial setup through ongoing context selection.

  Dependencies:
  - Build financial year setup and management UX
  - Add shared finance-context bootstrap for downstream feature surfaces
  - Add financial year change telemetry and audit-friendly event coverage

  Acceptance Criteria:
    - Automated tests cover first-time financial-year creation, generated-period verification, active-year switching, and finance-context bootstrap.
    - Tests prove invalid boundaries and overlapping ranges are rejected without corrupting stored data.
    - The regression suite is runnable in CI without manual data preparation.
    - Failing finance-period regressions block release of dependent budgeting and reporting features.

  Test Requirements:
    - Unit:
      - None beyond any story-specific support helpers.
    - Integration:
      - Missing API or repository regressions discovered during end-to-end setup are backfilled.
    - E2E (if applicable):
      - Full setup-to-switching coverage is required once the web/API harness exists.

  Observability:
    - Logging:
      - Test-run failures identify which setup or switching journey failed.
    - Metrics:
      - CI may publish pass/fail telemetry if the existing pipeline already supports it; otherwise none required.

### Recommended Execution Order

1. Add financial year and budget period schema support
2. Add finance-period repository contracts and transactional persistence flows
3. Implement financial year validation and period generation services
4. Implement active-year selection and current-period resolution services
5. Expose financial year management and finance-context endpoints
6. Build financial year setup and management UX
7. Add shared finance-context bootstrap for downstream feature surfaces
8. Add financial year change telemetry and audit-friendly event coverage
9. Add regression coverage for first-run setup and active-year switching

### Risks / Gaps

- The lifecycle rules for edit, delete, or archive flows remain unresolved, so this plan intentionally focuses on create, view, activate, and consume flows.
- The repository currently lacks `packages/core`, `apps/api`, and `apps/web`, so the API/UI stories may need minimum scaffolding work before the feature logic can land.
- A wrong overlap policy or current-period fallback rule would ripple into budgets, dashboard, reporting, and imports, so those open questions should be settled before implementation reaches production readiness.
- Date-range joins for fiscal membership are correct architecturally, but they increase the importance of indexing and regression coverage once transaction volumes grow.
- If the first-year auto-activation assumption is later rejected, Story 2.2 and the setup UX story will need a minor behavioral adjustment.

### Validation

- Are all tasks independently implementable? yes
- Are dependencies valid? yes
- Are acceptance criteria testable? yes
