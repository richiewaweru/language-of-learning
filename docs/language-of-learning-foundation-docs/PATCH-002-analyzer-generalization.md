# PATCH-002 — Analyzer Generalization & Truth-Path Corrections
**For:** Cursor, run as a single phase (P-fix) using the same Planner–Worker–Judge discipline, rules, and gate format as the main run (CURSOR-RUN.md). One conversation; commit per judged task as `Pfix/<task-id>: <summary>`; tag `gate-Pfix` at the end.
**Why this patch exists:** post-build audit found the analyzer overfitted to the golden fixtures (fixture-specific names and literals baked into ID derivation and emission logic), the save path persisting client-supplied artifacts without server re-verification, and ADR-0003 (one analyzer, two runtimes) silently dropped. The product's promise — honest analysis of a *stranger's* code — depends on fixing #1.

**Authority:** semantic-contract.md rules N1/N2, foundation-plan invariants 2 & 4, CURSOR-RUN rules 10-determinism and 40-process. Precedence unchanged.

**Prime directive for this patch:** expected fixture values MAY change — they are *re-derived* from the corrected analyzer, never hand-tuned to preserve green. Weakening any test or done-condition to pass is a rejected task. Every regenerated expected file must be re-verified by hand-analysis noted in the fixture's comment header (Worker) and re-checked cold (Judge).

---

## TASK GROUP A — Analyzer generalization (the serious fix)

### A1 — Contract-compliant ID scheme
Replace all ID derivation in `packages/analyzer-python/src/lol_analyzer/analyzer.py` with the N2 rule: **id = `<kind-prefix>-L<startLine>C<startCol>` plus a stable per-kind ordinal suffix when two nodes share a position** (e.g. `bind-L2C4`, `op-L4C12`, `ret-L5C4`). Kind prefixes: `fn, bind, coll, val, call, op, seq, branch, loop, ret, mut, eff`.
- IDs must contain NO variable names, NO literal values, NO semantic guesses.
- Names remain where the contract puts them: in the node's `name`/`repr` fields.
- done-when: `grep -nE 'val-rate|val-zero|ret-fallback|ret-early|ret-zero|op-inc|"total"|"count"|"rate"' packages/analyzer-python/src -r` returns **0 matches**, and every emitted id matches `^[a-z]+-L[0-9]+C[0-9]+(-[0-9]+)?$` (add a unit test asserting this over all fixture graphs).

### A2 — Delete fixture-shaped emission logic
Remove every name/literal-keyed special case, including but not limited to:
- `should_emit_assignment_value`'s `name in {"total", "count"}` clause — replace with a general rule: emit a `value` node for every literal initializer of a `constant` or `state` binding, regardless of name.
- `value_id_from_repr`'s `binding_name == "rate"` branch and literal-pattern branches (superseded by A1).
- `return_id` / `body_reference` heuristics keyed to specific literals or shapes — replace with position-based IDs (A1) and structural resolution (first statement of a body resolves by its own position-derived id).
- done-when: the greps in A1 pass; `pytest packages/analyzer-python` passes with logic that a reviewer can read without knowing the fixtures exist. Judge must confirm by reading the diff for any remaining fixture knowledge.

### A3 — Regenerate golden expectations honestly
Regenerate `expected.graph.json`, `expected.trace.json`, `expected.scene-actions.json` for all six patterns (and negative fixtures) from the corrected pipeline. For each: Worker adds a 3–5 line hand-analysis comment header (node count, key ids by position, pattern rationale); Judge re-derives at least two fixtures cold and compares.
- done-when: fixture loader + all downstream tests (patterns, scenes, resolver, transfer) green against regenerated files; BUILD-LOG entry lists every changed expectation with one-line reason ("id scheme change", never "adjusted to pass").

### A4 — Generalization suite (the new gate that keeps this fixed)
Create `fixtures/variations/` with **12+ renamed/re-literal'd variants**: each of the six patterns at least twice, with all identifiers renamed (e.g. `total→running_sum`, `prices→readings`, `rate→factor`), different literals, and where valid, reordered non-dependent statements. These get NO expected-graph files — instead a spec: `expect.json` per variant declaring `{pattern, stateBindingCount, loopCount, branchCount, mutationCount, returnsCount}`.
- Test: analyze each variant → assert structural counts and detected pattern match the spec; assert zero `unsupported` regions; assert all ids match the A1 regex.
- done-when: 12/12 variants pass; this suite is added to the standing gate block so overfitting can never silently return.

### A5 — Multiple-mutation support
`tracer.py` uses `self.graph.mutations[0]`; the analyzer emits a single `mut-append` id. Fix both to support N mutations per function (position-based ids from A1; tracer resolves the mutation node by the executing statement's source position). Add one variation fixture with two `.append` sites.
- done-when: the two-append variant traces correctly with distinct mutation ids per event.

## TASK GROUP B — Truth path

### B1 — Server re-verification on save
`POST /analyses` must ignore client-supplied `graph`/`trace`/`pattern`/`scene` and recompute all four server-side from `source + argsRepr` before persisting. If recomputation raises a SandboxViolation or yields a function-less graph, respond 422 with the honest structured reason; nothing is persisted.
- done-when: an API test posts a *tampered* graph (e.g. pattern renamed to "ACCUMULATE" on a transform source) and the stored artifact contains the recomputed truth; a hostile source posts and receives 422 with `violation` populated.

### B2 — Load-path integrity note
`GET /analyses/{id}` responses include `engineVersion` (analyzer package version) captured at save time; bump analyzer version to `0.1.1` as part of this patch so pre-patch saved artifacts are distinguishable.
- done-when: version present in new saves; BUILD-LOG notes that pre-0.1.1 artifacts in `data/analyses` are untrusted and may be deleted.

## TASK GROUP C — Decision records (make silent deviations loud)

### C1 — ADR-0003 disposition
Write `docs/decisions/0007-api-only-analysis-v0_1.md`: v0.1 analyzes exclusively via the FastAPI/CPython path; in-browser Pyodide (instant offline analysis + the original two-runtime parity promise) is DEFERRED. Record the consequence honestly: Decode requires the local API; there is no offline mode. Add the Pyodide item to DEFERRED-ONLINE.md if absent.
- done-when: ADR exists, cross-referenced from DEFERRED-ONLINE.md.

### C2 — ADR: tracer as purpose-built interpreter
Write `docs/decisions/0008-interpreter-tracer.md`: the tracer re-implements evaluation rather than instrumenting CPython execution; rationale (sandbox control, event fidelity); named risk (semantic divergence from real Python, e.g. `/` always float) and the mitigation: every supported operator/construct gets a parity test comparing interpreter result to CPython `eval` of the same expression under sandbox constraints. Implement that parity test.
- done-when: ADR exists; parity test covers all supported binops, comparisons, and unary minus; any divergence found is fixed or explicitly listed.

### C3 — Process-file audit
If `tasks.md`, `PROGRESS.md`, or `BUILD-LOG.md` are missing from the repo root, reconstruct minimally: tasks.md seeded with this patch's tasks; PROGRESS.md with a gate-Pfix section; BUILD-LOG.md opening entry summarizing PATCH-002's cause ("analyzer overfitting found in external audit") — the audit trail must exist going forward even if history was lost.
- done-when: all three files exist and gate-Pfix is reported in PROGRESS.md.

---

## GATE BLOCK Pfix (all must pass; outputs pasted to PROGRESS.md)

```bash
1. grep -rnE 'val-rate|"total"|"count"|"rate"|ret-fallback|op-inc' packages/analyzer-python/src | wc -l   # expect 0
2. pnpm test                                    # all packages green, incl. regenerated fixtures
3. pytest packages/analyzer-python packages/trace-runtime                       # green
4. pnpm test -- fixtures/variations            # 12/12 generalization variants pass
5. pytest apps/api -k "save_reverify or tamper or hostile_save"                 # green
6. ls docs/decisions/0007* docs/decisions/0008* tasks.md PROGRESS.md BUILD-LOG.md  # all exist
7. Manual (Richie or Judge): open Decode, paste an accumulator with every
   identifier renamed, confirm: correct pattern named, sane shape view,
   transfer check references the renamed identifier's real line.
```

## OUT OF SCOPE (do not touch)
Visual grammar, layout engine, lesson content, Learn pages, slice pages, telemetry schema, sandbox limits, pattern rules. If a Group A change forces an interface change on lens-scenes (id format flows through), the change is limited to id-string handling — no behavioral edits. Anything else discovered goes to BUILD-LOG as a note, not a fix.
