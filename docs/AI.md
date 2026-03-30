# AI.md

## Purpose
This document defines the default AI-readiness strategy for projects built from this template.

The goal is not to force heavy AI implementation early.
The goal is to ensure today’s design does not block tomorrow’s intelligence features.

---

## AI Readiness Principles

### 1. Capture Useful Signals Early
Where meaningful, capture:
- user actions
- workflow transitions
- content creation and updates
- system outcomes
- recommendation outcomes
- feedback signals

### 2. Keep Data Understandable
AI systems are only useful if the underlying data is coherent, attributable, and queryable.

### 3. Prefer Additive Design
Add eventing, metadata, and derived structures in a way that does not destabilize the core product.

### 4. Separate Core Logic from AI Logic
AI features should enhance the product, not entangle the whole system.

---

## AI-Ready Building Blocks

### Event Layer
The system should be able to emit meaningful events for:
- create
- update
- delete or archive
- workflow transition
- user interaction
- recommendation shown
- recommendation accepted or ignored
- processing success or failure

### Metadata Layer
Important entities should support useful metadata, such as:
- type
- category
- source
- tags
- ownership
- timestamps
- version
- status

### Content Layer
Where the product has text, notes, messages, documents, descriptions, or transcripts:
- keep content ownership clear
- preserve stable identifiers
- keep timestamps
- avoid opaque storage if future retrieval matters

### Derived Intelligence Layer
Future AI capabilities may require:
- embedding records
- chunking strategies
- summaries
- feature vectors
- recommendation snapshots
- anomaly or score outputs

These should be added as adjacent structures, not forced into the core domain model prematurely.

---

## Candidate Future AI Features
Depending on the product, likely future capabilities include:
- semantic search
- summarization
- recommendation
- anomaly detection
- forecasting
- decision support
- assistant workflows
- natural-language querying
- classification and tagging

---

## Event Guidance
When designing new features, ask:
1. What meaningful action happened?
2. Should that become an event?
3. Could that signal be useful later for analytics, AI, or automation?
4. Can it be captured cheaply now?

If yes, add or plan for an event.

---

## Embedding Guidance
Do not embed everything blindly.

Potential embedding candidates:
- user-authored content
- documents
- notes
- item descriptions
- support interactions
- knowledge base content
- normalized summaries

For each embedding candidate, preserve:
- source entity id
- content type
- content version
- chunk index if chunked
- updated timestamp

---

## Recommendation Guidance
If the product may later recommend actions, items, or content:
- capture exposure events
- capture selection events
- capture outcome events where feasible

Without exposure and outcome signals, recommendation quality will remain weak.

---

## Guardrails
- Do not invent AI features where the product has no use for them.
- Do not add complex pipelines before there is a real need.
- Do not couple core workflows directly to external model availability.
- Keep AI an enhancement layer unless explicitly required as core.

---

## Project-Specific Extension Guidance
When adapting this template, add:
- candidate AI use cases
- priority AI-ready entities
- event types to capture
- content types worth embedding
- privacy or data sensitivity constraints
- success metrics for future intelligence features
