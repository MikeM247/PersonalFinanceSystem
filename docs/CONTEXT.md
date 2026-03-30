# CONTEXT.md

## Product Context
This repository is a reusable monorepo template for building software products with strong architectural discipline, AI-readiness, and an execution workflow optimized for human + AI collaboration.

The template is intended to support multiple product types, including:
- web applications
- APIs and backend services
- internal tools
- data-oriented products
- AI-enabled products

---

## Goals
- Provide a strong default structure for new projects.
- reduce setup friction for future projects
- keep context explicit, durable, and easy for AI tools to consume
- support iterative delivery through epics, slices, and stories
- bake in future AI capability from the start without overengineering
- improve quality, consistency, and reviewability across projects

---

## Non-Goals
This template does not aim to:
- prebuild every feature needed by all products
- force heavyweight enterprise process for simple changes
- define business-specific requirements for a particular product
- lock the repo to one front-end or one domain forever

---

## Default Product Assumptions
Unless a project-specific context overrides these defaults:
- the product is built incrementally
- the product values clarity over cleverness
- the product is expected to evolve over time
- data quality and observability matter from the beginning
- AI capability is a planned future layer, not an afterthought
- serverless-friendly deployment is preferred where it fits

---

## Target Outcomes
A project created from this template should:
- be easy to understand quickly
- have clear boundaries between UI, business logic, and data access
- support safe iteration
- be ready for analytics, search, recommendation, summarization, or automation features later
- be easy to operate with Codex or similar AI development workflows

---

## Working Style
The project follows:
- strict monorepo boundaries
- explicit documentation
- small, reviewable changes
- strong defaults
- additive design where possible
- pragmatic, not theoretical, architecture

---

## Project-Specific Extension Guidance
When this template is used for a real product, update this file with:
- product name
- target users
- core user outcomes
- top features
- non-goals
- key constraints
- success measures

Keep this file short and strategic. Detailed structure belongs in other docs.
