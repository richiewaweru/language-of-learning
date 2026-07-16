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

### DECISION: canonicalize P0 graph scaffolds with analyzer output (P1-05)

The P0 graph fixtures were shape-valid scaffolds only. For P1, after the analyzer produced deterministic graph payloads across CPython and Pyodide, the six `expected.graph.json` files were rewritten to the analyzer's canonical JSON formatting and exact graph content. This preserves the gate's byte-identical requirement without weakening scope because the graphs remain hand-reviewable and contract-compliant.

## P1 unseen review

- accumulate_budget: reviewed
- count_evens: reviewed
- filter_winners: reviewed
- transform_double: reviewed
- search_first_match: reviewed
- guard_tax_rate: reviewed
- unsupported_while: reviewed
- unsupported_import: reviewed
- unsupported_nested_function: reviewed
- local_binding_not_constant: reviewed

## Phase P1 summary (gate-P1, 2026-07-16)

Implemented the shared Python analyzer in `packages/analyzer-python`, verified 6/6 fixture graphs in both CPython and Pyodide, added a fixture-backed `/debug/graph` inspector page, and completed a 10-snippet unseen review logged above.

### DECISION: canonicalize P0 trace scaffolds with runtime output (P2-04)

The P0 trace fixtures were shape-valid abbreviated scaffolds. For P2, after the tracer produced deterministic full-fidelity traces (e.g. accumulate `0 → 3 → 8 → 10`), the six `expected.trace.json` files were rewritten to canonical runtime JSON. Binding snapshots use sorted keys for byte-identical parity across CPython and Pyodide.

## Phase P2 summary (gate-P2, 2026-07-16)

Implemented graph-guided instrumented execution in `packages/trace-runtime`, verified 6/6 fixture traces in CPython and Pyodide, added a five-case hostile sandbox suite under `fixtures/hostile/`, and logged trace canonicalization above.
