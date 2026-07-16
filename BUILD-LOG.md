# BUILD-LOG.md

## Commit convention

`P<phase>/<task-id>: <imperative summary>`

Tag each phase gate: `gate-P<n>`.

## Decisions

### DECISION: docs/ authority tree (P0-01)

Created `docs/` + `reference/` per Phase 0 plan. Promoted `semantic-contract (3).md` to `docs/semantic-contract.md`. Synthesized `docs/foundation-plan.md` from architecture doc + brief §3. Seeded `docs/programming-primitive-map.md` from atlas doc.

### DECISION: reference gap (P0-01)

`function-component-poc.html` is missing. Motion targets deferred to `visual-constitution.md` + `design-tokens.css` until a reference asset is supplied.

### DECISION: package naming (P0-05)

Using brief §4 names (`analyzer-python`, `trace-runtime`, `visual-grammar`) over legacy architecture doc names (`lens-parser-python`, `lens-render-svelte`).

## Phase P0 summary (gate-P0, 2026-07-16)

All P0 tasks judged. Monorepo skeleton, Zod contracts, JSON Schema export, six fixture scaffolds, and minimal web shell delivered. Fixture expected payloads are schema-valid hand analysis; runtime byte parity deferred to P1–P4.
