# ARCHITECTURE.md

## Overview
This repository uses a strict monorepo architecture designed for:
- scalability
- maintainability
- AI-assisted development
- serverless-friendly deployment

The architecture enforces clear separation between applications, shared logic, and data layers.

---

## Repository Structure

/apps
  web        Frontend application (e.g. Next.js)
  api        Backend / serverless API

/packages
  core       Business logic and domain layer
  db         Database schema and data access
  ui         Shared UI components

/docs        Project context and governance

---

## Architectural Principles

### 1. Separation of Concerns
Each layer has a single responsibility:

- UI Layer → rendering and interaction
- API Layer → transport and orchestration
- Core Layer → business logic and rules
- Data Layer → persistence and retrieval

Strict rule:
Business logic must NOT live in UI or API layers.

---

### 2. Thin Applications
Applications should:
- orchestrate flows
- call services
- handle input/output

Applications must NOT:
- contain core domain logic
- duplicate shared logic

---

### 3. Shared Logic First
If logic is reused or expected to be reused:
→ it must be placed in /packages

Avoid duplication across apps.

---

### 4. Stable Boundaries
Define clear interfaces between layers:
- API contracts
- service interfaces
- repository interfaces

Do not leak internal structures across boundaries.

---

### 5. Additive Evolution
Prefer:
- extending functionality
- adding new fields
- introducing new modules

Avoid:
- breaking changes
- destructive refactors without need

---

## Package Responsibilities

### packages/core
Contains:
- domain models
- business rules
- services
- validation
- workflows

Rules:
- must be framework-agnostic
- must be testable in isolation

Must NOT include:
- UI code
- HTTP handling
- direct infrastructure coupling

---

### packages/db
Contains:
- schema definitions
- ORM configuration
- migrations
- repositories
- persistence mapping

Rules:
- encapsulate database logic
- expose clean interfaces

Must NOT include:
- UI logic
- business orchestration

---

### packages/ui
Contains:
- reusable components
- layout primitives
- design system elements

Rules:
- reusable across apps
- no domain-heavy logic unless intentional

---

## API Design Principles

- Keep handlers thin
- Validate all inputs
- Return consistent response shapes
- Separate DTOs from persistence models where needed
- Do not embed business logic in controllers

---

## Serverless Constraints

Default assumption: serverless deployment (e.g. Vercel)

Rules:
- Do NOT use server.listen()
- Do NOT create long-running processes
- Keep functions stateless
- Execute per request
- Avoid hidden global state

---

## Observability

System should support:
- structured logging
- error tracing
- health checks
- event emission

Key actions should be traceable.

---

## AI-Ready Architecture

The system must support future:
- embeddings
- semantic search
- recommendations
- summarisation
- analytics

Design implications:
- capture meaningful events
- maintain clean data structures
- use stable identifiers
- preserve history where useful

Refer to docs/AI.md for details.

---

## Data Flow (Conceptual)

User → App (web)
     → API layer
     → Core services
     → Data layer (db)
     → Response

Optional:
     → Event emission
     → Analytics / AI pipeline

---

## Decision Framework

When making architectural decisions:

1. Choose the simplest solution that works
2. Preserve clean boundaries
3. Avoid duplication
4. Keep logic in core
5. Optimise for maintainability and readability
6. Ensure compatibility with AI evolution

---

## Anti-Patterns to Avoid

- Business logic in UI
- Business logic in API handlers
- Direct DB access from UI
- Long-running processes in serverless
- Tight coupling across packages
- Duplicate logic across apps
- Over-engineering early

---

## Extension Guidance

When adapting this template for a real project, add:

- authentication strategy
- external integrations
- caching strategy
- background processing approach
- file storage strategy
- deployment details
- environment configuration
- scaling considerations

Keep extensions aligned with core principles.
