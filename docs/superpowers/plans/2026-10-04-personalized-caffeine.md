# Personalized caffeine implementation plan

> Execution: coordinated model, evidence and UI work with integration and final review in this session. The user supplied the full implementation specification and authorized execution.

**Goal:** Separate fixed caffeine mass estimates from optional, experimentally personalized perceived-duration forecasts and next-day observations.

**Architecture:** Keep existing PK functions; add a pure personalization feature with immutable predictions, feedback, replay and chronological evaluation. Version the existing repository state without changing the Toss adapter. Home presents optional inline check-in/forecast; settings manages learning, never PK half-life.

**Tech stack:** Existing React, TypeScript, Vite, CSS, Vitest and Playwright; no new dependency.

**Spec:** `docs/prompts/personalized-caffeine-algorithm.md`, superseded for manual half-life by the user's October 4 request to remove that control.

## Global constraints

- PK uses the existing 5-hour initial assumption; neither feedback nor user controls change it.
- Preserve intake/custom drinks, body-centered home, calendar restrictions, routing and sheet back handling.
- Self-report is not caffeine concentration. No measured half-life, health classification, confidence percentage or proven accuracy claims.
- All model time is injectable. UI never accesses storage. Save failures never publish success.
- Never transmit personal observations to a server.

## Review focus

- Legacy user-set half-lives: migrate to fixed 5h and retain the old value as migration provenance.
- A prediction never viewed before the outcome: offer absolute intervals only, never fabricate a comparison forecast.
- Additional intake, edited/deleted records and duplicate feedback: invalidate affected contribution and replay once.
- Midnight, late-night intake, timezone changes, missing/stale outcomes: avoid premature or repeated check-ins.
- Failed persistence and malformed new-schema data: keep originals and provide retry rather than replacing records.

## Tasks

- [x] 1. Evidence table: verify original studies, document access limits, compare model complexity and label engineering assumptions.
- [x] 2. Domain: test then implement snapshot, interval/ordinal learning, regularization, bounded changes, held updates, chronological baseline/candidate/simple evaluation, invalidation/replay and next-day policy in `src/features/personalization/model/`.
- [x] 3. Storage/integration: failing migration tests; version 2 under the existing key, strict validation, legacy provenance and atomic saves; integrate domain transitions in `useCaffeine`.
- [x] 4. UI: optional check-in with observations before forecast comparison, persisted forecast exposure, learning controls and feedback removal; remove manual half-life slider and callback; preserve themes and 48px targets.
- [x] 5. Verify: npm install, lint, unit tests, build, existing and new Playwright flows at 375/390px including text scaling and light theme; inspect screenshots and independently review model/integration.
- [x] 6. Report implementation and behavior verification separately from unverified real-world forecast accuracy; include a prospective validation protocol.

## Decisions

- Retain the storage key so reset/migration remains one atomic document. Version is inside the document.
- No absorption/PBPK model is fitted without identifying concentration data. Literature validation does not validate this app.
- A fixed 6h subjective-duration prior is an explicitly experimental product assumption, unrelated to PK half-life. Candidate offset, step limits and activation rules must be documented and sensitivity-tested.
- No commits are created automatically: the workspace starts with the entire project untracked; keep the user's existing work intact and make local changes reviewable.

## Completion evidence

See `docs/verification-personalization.md`: 85 unit tests, 42 mobile E2E scenarios, lint and build passed. Evidence, formulas and a prospective validation protocol are saved under `docs/research/`. Real-user forecast performance remains unverified.
