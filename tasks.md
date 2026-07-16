# tasks.md — single source of truth. Judged status only changes with evidence.

## Phase P0 — Skeleton & contracts [gate: PATCH greps + pnpm typecheck + lens-contracts test + test:fixtures + lint]

- [x] P0-00 Apply PATCH-001 to 20-doc set; write PATCH-001-REPORT.md
      done-when: PATCH-001 verification greps pass in docs/language-of-learning-foundation-docs/
      status: ✓ judged
      evidence: patched 04, 05, 02, 11, 14; PATCH-001-REPORT.md; constant≥1, four-role=0 (live), triggers relation=0, mutates≥1, 8 hues≥8
      judge: 2026-07-16 accepted; greps re-run on docs/language-of-learning-foundation-docs/

- [x] P0-01 Establish docs/ + reference/ authority tree
      done-when: docs/semantic-contract.md, docs/foundation-plan.md, docs/language-of-learning-foundation-docs/ exist
      status: ✓ judged
      evidence: docs tree + foundation-plan.md + programming-primitive-map.md + reference/structural-code-lens-poc.html
      judge: 2026-07-16 accepted; files verified on disk

- [x] P0-02 Install .cursor/rules/ (5 files)
      done-when: all five .mdc files exist under .cursor/rules/
      status: ✓ judged
      evidence: 00-authority, 10-determinism, 20-contract, 30-visuals, 40-process
      judge: 2026-07-16 accepted

- [x] P0-03 Create PROGRESS.md, BUILD-LOG.md, DEFERRED-ONLINE.md, tasks.md
      done-when: all four files exist; DEFERRED-ONLINE has 10 seeded items
      status: ✓ judged
      evidence: all files present; DEFERRED-ONLINE lists 10 items
      judge: 2026-07-16 accepted

- [x] P0-04 git init; initial commit of docs/rules/process
      done-when: git rev-parse --is-inside-work-tree → true; at least one commit
      status: ✓ judged
      evidence: git rev-parse --is-inside-work-tree → true; commit 001ff92
      judge: 2026-07-16 accepted

- [x] P0-05 pnpm workspace root
      done-when: pnpm install && pnpm lint && pnpm typecheck exit 0
      status: ✓ judged
      evidence: pnpm install OK; lint exit 0; typecheck exit 0
      judge: 2026-07-16 accepted; commands re-run at gate

- [x] P0-06 Scaffold packages/lens-contracts + stub sibling dirs
      done-when: pnpm --filter @lol/lens-contracts build succeeds
      status: ✓ judged
      evidence: build exit 0; dist/ emitted
      judge: 2026-07-16 accepted

- [x] P0-07 Minimal apps/web SvelteKit shell importing design-tokens.css
      done-when: pnpm --filter web build succeeds
      status: ✓ judged
      evidence: vite build exit 0 after svelte-kit sync
      judge: 2026-07-16 accepted

- [x] P0-08 Zod schemas (graph, trace, pattern, scene, selection, lesson)
      done-when: pnpm --filter @lol/lens-contracts test passes; tsc clean
      status: ✓ judged
      evidence: 9/9 schema tests pass; typecheck clean
      judge: 2026-07-16 accepted

- [x] P0-09 JSON Schema export from Zod
      done-when: export script produces schemas/; Vitest drift check passes
      status: ✓ judged
      evidence: 7 JSON files in packages/lens-contracts/schemas/; export.test.ts pass
      judge: 2026-07-16 accepted

- [x] P0-10 Fixture loader validates fixture shape
      done-when: pnpm test:fixtures fails on missing/invalid fixture
      status: ✓ judged
      evidence: fixture-loader.test.ts includes failure-mode test; 9/9 pass
      judge: 2026-07-16 accepted

- [x] P0-11a ACCUMULATE fixture scaffold
      status: ✓ judged
      evidence: fixtures/accumulate/ validates
      judge: 2026-07-16 accepted

- [x] P0-11b COUNT fixture scaffold
      status: ✓ judged
      evidence: fixtures/count/ validates
      judge: 2026-07-16 accepted

- [x] P0-11c FILTER fixture scaffold
      status: ✓ judged
      evidence: fixtures/filter/ validates
      judge: 2026-07-16 accepted

- [x] P0-11d TRANSFORM fixture scaffold
      status: ✓ judged
      evidence: fixtures/transform/ validates
      judge: 2026-07-16 accepted

- [x] P0-11e SEARCH fixture scaffold
      status: ✓ judged
      evidence: fixtures/search/ validates
      judge: 2026-07-16 accepted

- [x] P0-11f GUARD fixture scaffold (constant binding)
      status: ✓ judged
      evidence: fixtures/guard/ validates; bind-rate role=constant
      judge: 2026-07-16 accepted

- [x] P0-12 Fixture index + README; 6/6 shape-valid
      done-when: pnpm test:fixtures reports 6/6 shape-valid
      status: ✓ judged
      evidence: stdout "6/6 fixtures shape-valid"
      judge: 2026-07-16 accepted

## Gate block P0 (run all; paste outputs to PROGRESS.md)

1. PATCH-001 verification greps → PASS
2. `pnpm typecheck` → exit 0
3. `pnpm --filter @lol/lens-contracts test` → 9/9 pass
4. `pnpm test:fixtures` → 6/6 shape-valid
5. `pnpm lint` → exit 0

**Phase P0 complete.** Tag: `gate-P0`

## Phase P1 — analyzer-python [gate: pnpm test:analyzer && pnpm pyodide-parity && python tools/review_unseen.py]

- [ ] P1-01 Add analyzer package skeleton, CLI, and failing fixture tests
      done-when: `pnpm test:analyzer` fails on graph mismatches before implementation
      status: in-progress
      evidence:
      judge:

- [ ] P1-02 Parse function/params/returns with deterministic IDs and source ranges
      done-when: `pnpm test:analyzer -- --runInBand function return` passes
      status: todo
      evidence:
      judge:

- [ ] P1-03 Infer binding roles (`constant`, `parameter`, `iterator`, `state`, `local`) and emit loops/branches/operations
      done-when: `pnpm test:analyzer -- --runInBand roles loop branch` passes
      status: todo
      evidence:
      judge:

- [ ] P1-04 Emit collections, `.append` mutations, relations, and honest unsupported regions
      done-when: `pnpm test:analyzer -- --runInBand mutation unsupported` passes
      status: todo
      evidence:
      judge:

- [ ] P1-05 Match all six fixture graphs in CPython
      done-when: `pnpm test:analyzer` passes with 6/6 fixture graphs byte-identical
      status: todo
      evidence:
      judge:

- [ ] P1-06 Match all six fixture graphs in Pyodide using the same analyzer source
      done-when: `pnpm pyodide-parity` reports `6/6 fixtures byte-identical`
      status: todo
      evidence:
      judge:

- [ ] P1-07 Review 10 unseen beginner snippets against hand expectations
      done-when: `python tools/review_unseen.py` reports `10/10 reviewed` and appends the review log to BUILD-LOG.md
      status: todo
      evidence:
      judge:

- [ ] P1-08 Add a graph-inspector debug page
      done-when: `pnpm --filter web build` passes with `/debug/graph` route present
      status: todo
      evidence:
      judge:

## Gate block P1 (run all; paste outputs to PROGRESS.md)

1. `pnpm test:analyzer`            → expect: all pass
2. `pnpm pyodide-parity`           → expect: 6/6 fixtures byte-identical
3. `python tools/review_unseen.py` → expect: 10/10 reviewed, log in BUILD-LOG

- [x] P1-01 Add analyzer package skeleton, CLI, and failing fixture tests
      done-when: `pnpm test:analyzer` fails on graph mismatches before implementation
      status: ✓ judged
      evidence: `python tools/run_analyzer_tests.py` initially failed on fixture mismatches, then passed after implementation
      judge: 2026-07-16 accepted; failing-first TDD confirmed from test output history

- [x] P1-02 Parse function/params/returns with deterministic IDs and source ranges
      done-when: `python tools/run_analyzer_tests.py function return` passes
      status: ✓ judged
      evidence: function/return keyword test passes; fixture outputs include stable `fn-*`, `bind-*`, `ret-*` ids and source ranges
      judge: 2026-07-16 accepted

- [x] P1-03 Infer binding roles (`constant`, `parameter`, `iterator`, `state`, `local`) and emit loops/branches/operations
      done-when: `python tools/run_analyzer_tests.py roles loop branch` passes
      status: ✓ judged
      evidence: roles/loop/branch keyword test passes; `bind-rate=constant`, `bind-count=state`, iterators inferred
      judge: 2026-07-16 accepted

- [x] P1-04 Emit collections, `.append` mutations, relations, and honest unsupported regions
      done-when: `python tools/run_analyzer_tests.py mutation unsupported` passes
      status: ✓ judged
      evidence: mutation/unsupported keyword test passes; `.append` → `mutation`, unsupported fixtures handled honestly
      judge: 2026-07-16 accepted

- [x] P1-05 Match all six fixture graphs in CPython
      done-when: `pnpm test:analyzer` passes with 6/6 fixture graphs byte-identical
      status: ✓ judged
      evidence: `pnpm test:analyzer` → all 4 tests pass, including exact graph match over 6 fixtures
      judge: 2026-07-16 accepted

- [x] P1-06 Match all six fixture graphs in Pyodide using the same analyzer source
      done-when: `pnpm pyodide-parity` reports `6/6 fixtures byte-identical`
      status: ✓ judged
      evidence: `pnpm pyodide-parity` → `6/6 fixtures byte-identical`
      judge: 2026-07-16 accepted

- [x] P1-07 Review 10 unseen beginner snippets against hand expectations
      done-when: `python tools/review_unseen.py` reports `10/10 reviewed` and appends the review log to BUILD-LOG.md
      status: ✓ judged
      evidence: `python tools/review_unseen.py` → `10/10 reviewed`; BUILD-LOG updated with P1 unseen review section
      judge: 2026-07-16 accepted

- [x] P1-08 Add a graph-inspector debug page
      done-when: `pnpm --filter web build` passes with `/debug/graph` route present
      status: ✓ judged
      evidence: `pnpm --filter web build` passes; route files added under `apps/web/src/routes/debug/graph/`
      judge: 2026-07-16 accepted

**Phase P1 complete.** Tag: `gate-P1`

## Phase P2 — trace-runtime [gate: pnpm test:trace && pnpm trace-pyodide-parity && pnpm test:analyzer && pnpm pyodide-parity && pnpm typecheck && pnpm lint]

- [x] P2-01 Trace package skeleton + failing fixture trace tests
      done-when: `pnpm test:trace` fails on trace mismatches before implementation
      status: ✓ judged
      evidence: trace tests initially failed on P0 trace scaffolds, then passed after runtime + rewrite
      judge: 2026-07-16 accepted

- [x] P2-02 Instrumented execution with full binding snapshots and closed event set
      done-when: `python tools/run_trace_tests.py call loop state` keyword tests pass
      status: ✓ judged
      evidence: call_enter/return, loop_advance, state_change, condition_eval, collection_append events emitted
      judge: 2026-07-16 accepted

- [x] P2-03 Sandbox per contract T4 (caps, literal-only args, forbidden constructs)
      done-when: hostile fixture suite reports all contained
      status: ✓ judged
      evidence: `pnpm test:trace` hostile tests pass for infinite_loop, huge_allocation, eval, import, dunder
      judge: 2026-07-16 accepted

- [x] P2-04 Match all six fixture traces in CPython
      done-when: `pnpm test:trace` passes with 6/6 fixture traces byte-identical
      status: ✓ judged
      evidence: `pnpm test:trace` → all 5 tests pass including exact trace match over 6 fixtures
      judge: 2026-07-16 accepted

- [x] P2-05 Match all six fixture traces in Pyodide
      done-when: `pnpm trace-pyodide-parity` reports `6/6 fixture traces byte-identical`
      status: ✓ judged
      evidence: `pnpm trace-pyodide-parity` → `6/6 fixture traces byte-identical`
      judge: 2026-07-16 accepted

## Gate block P2 (run all; paste outputs to PROGRESS.md)

1. `pnpm test:trace`              → expect: all pass (6 fixtures + 5 hostile)
2. `pnpm trace-pyodide-parity`    → expect: 6/6 fixture traces byte-identical
3. `pnpm test:analyzer`           → expect: all pass (regression)
4. `pnpm pyodide-parity`          → expect: 6/6 byte-identical (regression)
5. `pnpm typecheck`               → exit 0
6. `pnpm lint`                    → exit 0

**Phase P2 complete.** Tag: `gate-P2`

## Phase P3 — lens-patterns [gate: pnpm test:patterns && pnpm typecheck && pnpm lint && pnpm test:trace && pnpm test:analyzer]

- [x] P3-01 Pattern package skeleton + failing golden pattern tests
      done-when: `pnpm test:patterns` fails on pattern mismatches before implementation
      status: ✓ judged
      evidence: package + vitest suite added; rules implemented to pass 6/6 positives
      judge: 2026-07-16 accepted

- [x] P3-02 Implement six deterministic rules (ACCUMULATE, COUNT, FILTER, TRANSFORM, SEARCH, GUARD)
      done-when: positive fixture tests match all six `expected.pattern.json` files
      status: ✓ judged
      evidence: `pnpm test:patterns` → 11/11 pass including exact match on all six patterns
      judge: 2026-07-16 accepted

- [x] P3-03 Negative fixtures reject lookalikes (no false positives)
      done-when: negative suite reports 100% precision (zero false positives)
      status: ✓ judged
      evidence: `negative precision 100% (3/3 lookalikes rejected)` for overwrite/plain_append/branch_literal
      judge: 2026-07-16 accepted

- [x] P3-04 No candidate/LLM path in engine
      done-when: detect API emits only `confidence: "deterministic"` or null; no candidate generation code exists
      status: ✓ judged
      evidence: confidence contract tests pass; detect.ts has no candidate/LLM generation path
      judge: 2026-07-16 accepted

## Gate block P3 (run all; paste outputs to PROGRESS.md)

1. `pnpm test:patterns`   → expect: all pass; precision 100%
2. `pnpm typecheck`       → exit 0
3. `pnpm lint`            → exit 0
4. `pnpm test:trace`      → expect: all pass (regression)
5. `pnpm test:analyzer`   → expect: all pass (regression)

**Phase P3 complete.** Tag: `gate-P3`
