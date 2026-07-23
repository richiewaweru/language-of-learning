# Phase 0 and Phase 1 Acceptance Gates

## Phase 0

- [x] Baseline commit recorded: `97fa2c1`.
- [x] Decode behavior classified in the regression matrix.
- [x] Existing supported and unsupported fixtures identified.
- [x] State ownership, persistence, and route coupling audited.
- [x] Actual source-to-artifact-to-view pipeline documented.
- [x] Public contracts adapted to repository types and current four-view behavior.
- [x] Risks and rollback triggers recorded.
- [x] No repository/spec conflict is hidden by invented semantics.

Decision: **PASS**

Blocking findings: none.

## Phase 1

- [x] `LensEngine` is route-, lesson-, UI-, and storage-agnostic.
- [x] `LensWorkspace` mounts outside Decode.
- [x] Mutable state is created per session.
- [x] Capabilities are supplied and enforced per instance.
- [x] Decode uses an isolated controller and no-op persistence.
- [x] Failed runs cannot retain previous verified output.
- [x] Two harness sessions hold different code, artifacts, frames, views, and keys.
- [x] Reset and capability restrictions remain instance-local.
- [x] No global Decode/Lesson mode switch was introduced.
- [x] Existing and new Decode Playwright suites pass: 39/39.
- [x] Typecheck, lint, and production build pass.
- [x] Manual browser matrix and screenshot evidence review complete.
- [x] Lens contract tests pass: 6/6.
- [ ] Repository-wide Vitest is fully green: 174/176 pass, with two
  pre-existing failures outside this change (a stale relation-count expectation
  and a pathway-page source assertion).

Decision: **PASS FOR PHASE 1 WITH RECORDED BASELINE EXCEPTIONS**

Blocking Lens findings: none.

Repository follow-up: repair the two unrelated baseline Vitest expectations in a
separate change.
