# Wave A Implementation Map

## Audit scope

This map records the pre-implementation audit required by ADR-007. The repository was clean on `main` when the audit began. The governing pack supplied in `lens-thoughtful-implementation-pack-v2.zip` was read in the required priority order before this file was written.

## Core implementation locations

| Concern | Current location | Finding and Wave A impact |
|---|---|---|
| Statement dispatcher | `packages/analyzer-python/src/lol_analyzer/analyzer.py`, `Analyzer.visit_stmt`; `packages/trace-runtime/src/lol_trace/tracer.py`, `Tracer._exec_stmt` | Both dispatchers currently cover assignments, loops, branches, returns, and expression statements. Neither dispatches `AugAssign`, `Break`, or `Continue`; these must land in both layers together. |
| Expression and return resolution | `Analyzer.return_value_ref`, `Analyzer.ensure_expression_facts`, `Tracer._eval_expr`, `Tracer._eval_condition`, `Tracer._exec_return` | Direct indexed expressions execute in the tracer but return analysis currently rejects them. Comparisons and Boolean expressions are limited to branch conditions and have no decomposed trace. Built-ins are limited to `len` and `range`. |
| Analyzer node model | `packages/lens-contracts/src/graph.ts`; emitted by `analyzer.py` | The graph union has no `builtin-call`. Existing `operation` nodes can compose augmented assignment, Boolean comparisons, indexed selection, and comparison returns. ADR-declared `builtin-call` must be added explicitly. |
| Trace event model | `packages/lens-contracts/src/trace.ts`; emitted by `tracer.py` | Existing events cover loop advance/test, condition evaluation, state change, selection, calls, and return. ADR-declared `loop-exit`, `loop-skip`, and `builtin-evaluated` are absent. Boolean clause evaluation also needs an explicit structural event so short-circuit order and unevaluated clauses are testable. |
| Symbol registry | `packages/visual-grammar/src/symbol-registry.ts` | Unknown verified semantics resolve to `generic-operation`. Wave A constructs must receive declared projections/compositions; collapsed built-ins require an exact collapse treatment and must not silently use the generic fallback. |
| Generic fallback | `packages/visual-grammar/src/symbol-registry.ts`, `resolveSymbol`; `packages/lens-scenes/src/normalize-semantic-scene.ts`, `entityRole` | Graph node kinds other than the existing named roles normalize to generic. Wave A operations may use composition, but `builtin-call` must retain its collapsed marker through semantic-scene metadata and UI labels. |
| Unsupported handling | `Analyzer.add_unsupported`; `Tracer.run`; `tools/build_artifacts.py`; `apps/api/main.py`; `/decode` page | Analyzer messages are ad hoc, unsupported graphs can retain verified nodes, and tracer violations can retain earlier verified steps. The artifact builder does reject violations, but direct analysis still leaks partial output. Wave A needs canonical code/message/diagnostics and atomic rejection output. |
| `/decode` scope copy | `apps/web/src/routes/decode/+page.svelte`, footer `.scope-strip` | Copy is not the exact Cursor brief wording and must be replaced. It should derive from the support matrix where practical. |
| Existing graph/golden infrastructure | `fixtures/*/expected.graph.json`, `tools/run_analyzer_tests.py`, `tools/rewrite_fixture_graphs.py` | Existing tests use byte-exact fixture graph snapshots. Wave A active development must instead use structural fixture assertions, then freeze full graph snapshots only at the review gate. |
| Existing trace/golden infrastructure | `fixtures/*/expected.trace.json`, `tools/run_trace_tests.py`, `tools/rewrite_fixture_traces.py` | Existing tests use full trace goldens. A dedicated Wave A corpus runner is needed for structural development assertions and review-gate freezing. |
| Renderer projection | `packages/lens-scenes/src/normalize-semantic-scene.ts`, `packages/lens-scenes/src/build-scene.ts`, `packages/visual-grammar/src/*` | New node/event variants must be normalized, laid out, and schema-validated. Break/continue should project as exit/skip control flow; built-ins need the required collapsed caption. |

## Nested-loop readiness audit (findings only)

- Analyzer nesting works structurally because child loops are visited with the enclosing loop as `parent_id`.
- Loop IDs are stable and unique for ordinary nested loops: `Analyzer.alloc_id` uses source position and an ordinal collision suffix.
- Tracer loop lookup is by source line (`_loop_for_line`). This is deterministic when loop statements occupy distinct lines, but it is not a full AST-identity lookup.
- Runtime execution recurses through nested loop bodies, so nested `for`/`while` traversal can execute for currently supported statements.
- There is no nearest-enclosing-loop control-transfer model yet. `_exec_stmt` returns only a Boolean "function returned" signal, so `break` and `continue` cannot be resolved safely without a typed control signal or equivalent loop stack.
- Raw loop events identify the active loop correctly by loop ID. Semantic-scene cursor projection does not: `activeEntityIds` selects the first iterator binding in the graph for every `loop_advance`, which can focus the outer cursor during an inner-loop event.
- The renderer has no nested-loop density-specific handling. Inner and outer cursor focus is therefore not yet reliably legible.

**Wave B sorting readiness:** not safe to activate. Unique loop IDs are present, but nearest-loop control transfer, cursor disambiguation, and nested-loop visual legibility require verification before B03/B04 can be enabled. No Wave B fixes are included in this run.

## Baseline test status

- Worktree: clean, `main...origin/main`.
- `pnpm test:all` stops in the pre-existing analyzer suite.
- Failure: `test_all_fixture_graphs_match_expected` for `fixtures/array-update/expected.graph.json`; the semantic content matches, but the checked-in snapshot formats the one-element `params` array inline while `canonical_json` emits it across multiple lines.
- This baseline defect is not caused by Wave A. It must still be resolved or regenerated before the final "all pre-existing tests pass" acceptance check.

## Implementation boundaries

- A07 will use the corpus-authorized `len(values) == 0` guard because empty-list truthiness is not currently a declared verified contract.
- Existing tracer step/time/memory limits remain unchanged.
- No Wave B or Wave C construct will be implemented.
