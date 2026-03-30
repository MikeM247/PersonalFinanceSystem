# REVIEW.md

## Purpose
This document defines the quality gate for all changes in this repository.

A story is not complete until it passes this review.

---

## Core Review Criteria

### 1. Scope Discipline
- Does the change solve the requested story without unnecessary expansion?
- Is the diff appropriately small for review?
- Were unrelated changes avoided?

### 2. Architectural Alignment
- Does the change follow `docs/ARCHITECTURE.md`?
- Are package boundaries respected?
- Is shared logic placed in the right layer?
- Were serverless constraints preserved where relevant?

### 3. Standards Compliance
- Does the code follow `docs/STANDARDS.md`?
- Are names clear and consistent?
- Is error handling appropriate?
- Is the implementation understandable and maintainable?

### 4. Data and AI Readiness
If relevant:
- Does the data shape align with `docs/DATA_MODEL.md`?
- Were meaningful events considered?
- Is the design future-friendly for analytics, AI, or search?
- Were stable identifiers and metadata handled well?

### 5. User and Product Fit
- Does the result satisfy the intended user outcome?
- Does it preserve clarity and usability?
- Were obvious edge cases considered?

### 6. Verification
- Were required checks run?
- Did build, lint, typecheck, and tests pass where applicable?
- If not run, was the gap clearly stated?

---

## Definition of Done
A change is done only when all of the following are true:
- acceptance criteria are met
- implementation is minimal and coherent
- architecture is respected
- standards are respected
- required checks were run or limitations were clearly stated
- no obvious follow-up bug is introduced
- documentation is updated if behaviour or structure changed

---

## Review Checklist

### General
- [ ] Story scope is clear and satisfied
- [ ] Diff is reviewable
- [ ] No unrelated changes included

### Architecture
- [ ] Correct layer placement
- [ ] No avoidable duplication
- [ ] Boundaries respected
- [ ] No runtime pattern violations

### Code Quality
- [ ] Clear naming
- [ ] Readable structure
- [ ] No dead code introduced
- [ ] Errors handled appropriately
- [ ] Types are sound

### Data / AI
- [ ] Data model remains coherent
- [ ] Events added or consciously deferred where relevant
- [ ] Metadata and identifiers handled properly

### Validation
- [ ] Lint
- [ ] Typecheck
- [ ] Tests
- [ ] Build
- [ ] Manual smoke check if relevant

### Docs
- [ ] Plan updated if needed
- [ ] Context docs updated if the design changed

---

## Review Output Format
When summarizing a review, use:

### Result
Pass / Pass with Notes / Needs Changes

### Strengths
- concise points

### Issues
- concise points

### Required Follow-Ups
- concise points or `None`
