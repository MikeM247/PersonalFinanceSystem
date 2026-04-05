# ADR-003: Stable Typed Category Hierarchy with Archive-First Lifecycle

- Status: Accepted
- Date: 2026-04-05

## Context

FR-003 introduces category groups and categories that will be reused by annual budgeting, monthly budgeting, transaction capture, CSV import, and budget-variance reporting. The feature requirements make archival and reuse mandatory, but they do not fully define how historical reporting should behave if a category is moved to a different group later, whether groups may mix income and expense categories, or how imports should resolve category names safely.

The product requirements document also expects group-level reporting, category-based imports, and both income and expense support. That means the category hierarchy cannot be treated as a simple UI convenience. It is a canonical classification structure whose decisions affect data integrity across multiple downstream features.

## Decision

The system will use a stable, typed category hierarchy:

- `category_groups` are explicit user-scoped records and each group is created as either `income` or `expense`.
- `categories` belong to exactly one group and persist a matching `category_type`.
- Downstream business records such as budget lines and transactions will store `category_id` as the canonical reference. Group-level reporting will be derived through the category-to-group relationship rather than storing redundant group references.

The system will use an archive-first lifecycle for historical preservation:

- Referenced groups and categories are not hard-deleted in MVP.
- Archived categories and groups remain available for historical joins and report rendering, but they are excluded from normal active selection flows.
- A group may be archived only after its active categories have been archived or moved elsewhere.

The system will protect historical classification by locking reclassification after first use:

- Once a category is referenced by a budget line or transaction, its `category_group_id` and effective `category_type` become immutable.
- If the user wants a different classification later, they create a new category and archive the old one instead of rewriting history.
- Category and group renames remain allowed because MVP does not version display names over time.

## Consequences

### Positive
- Budgets, transactions, reports, and imports all rely on one canonical category model.
- Group-level reporting remains stable because used categories cannot silently move to a different group later.
- Typed groups simplify selector filtering, reporting logic, and import validation.
- Archive-first lifecycle preserves historical references without requiring category-version tables in MVP.

### Negative
- Some real-world reorganizations require replacement categories instead of simple edits.
- Typed groups reduce flexibility for intentionally mixed income/expense groupings.
- Archived records accumulate over time and require careful UI filtering.
- Historical views use current names rather than time-versioned names, which is simpler but less audit-perfect than a full classification-history model.
