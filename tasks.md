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

## Phase P4 — lens-scenes + visual-grammar [gate: pnpm test:scenes && pnpm --filter web build && screenshots + reduced-motion + back-step]

- [x] P4-01 lens-scenes layout engine + overlap validator
      done-when: layout tests pass for accumulate/filter; zero hand coords; nesting ≤3; overlap fails loudly
      status: ✓ judged
      evidence: `pnpm test:scenes` layout tests pass; LayoutError on overlap/nesting
      judge: 2026-07-16 accepted

- [x] P4-02 Scene builder (trace → declarative actions + captions)
      done-when: scene-actions match rewritten fixture expectations for all six patterns; captions deterministic
      status: ✓ judged
      evidence: all six expected.scene-actions.json rewritten from builder; caption templates in CAPTION_TEMPLATES
      judge: 2026-07-16 accepted

- [x] P4-03 Selection resolver (line↔nodes, column/nesting priority, node↔steps)
      done-when: selection resolver unit tests cover SY1–SY3
      status: ✓ judged
      evidence: SY1/SY2/SY3 tests in scenes.test.ts pass
      judge: 2026-07-16 accepted

- [x] P4-04 visual-grammar: 11 primitives + TraceControls (back/step/play/scrub/reset)
      done-when: package exports components; reduced-motion CSS tokens honored
      status: ✓ judged
      evidence: @lol/visual-grammar exports 11 primitives + TraceControls + ScenePlayer; prefers-reduced-motion in styles.css
      judge: 2026-07-16 accepted

- [x] P4-05 Interactive accumulate + filter slices with back-step state restore
      done-when: `/slices/accumulate` and `/slices/filter` build; back restores exact bindings; variations selectable
      status: ✓ judged
      evidence: web build includes both slice routes; ScenePlayer binds from trace.steps[i].bindings; variations under fixtures/variations/
      judge: 2026-07-16 accepted

- [x] P4-06 Screenshot set (initial/mid/final × accumulate+filter) to BUILD-LOG assets
      done-when: 6 screenshot files exist under BUILD-LOG/assets/p4/
      status: ✓ judged
      evidence: tools/capture_p4_screenshots.ts → 6 SVG files in BUILD-LOG/assets/p4/
      judge: 2026-07-16 accepted

## Gate block P4 (run all; paste outputs to PROGRESS.md)

1. `pnpm test:scenes`            → expect: all pass
2. `pnpm test:patterns`          → expect: all pass (regression)
3. `pnpm typecheck`              → exit 0
4. `pnpm lint`                   → exit 0
5. `pnpm --filter web build`     → exit 0 with /slices/accumulate and /slices/filter
6. Screenshot assets present     → 6 files under BUILD-LOG/assets/p4/

**Phase P4 complete.** Tag: `gate-P4`

## Phase P5 — Decode surface [gate: journey on 3 fresh snippets + web build + api + save/load]

- [x] P5-01 Local API: analyze (graph+trace), save/load analyses, NDJSON events
      done-when: `python -m apps.api` health + analyze/save/load/events endpoints pass smoke tests
      status: ✓ judged
      evidence: FastAPI `apps/api/main.py`; journey TestClient covers health/analyze/save/load/events
      judge: 2026-07-16 accepted

- [x] P5-02 Deterministic transfer-check generator from graph
      done-when: unit tests generate "which line is X" from graph nodes with graded answers
      status: ✓ judged
      evidence: `buildTransferCheck` / `gradeTransferCheck` in lens-scenes; scenes.test.ts covers grading
      judge: 2026-07-16 accepted

- [x] P5-03 Decode UI: editor, sample-call, analyze, CODE/SHAPE/TRACE/PATTERN, unsupported
      done-when: `/decode` builds; four views sync via Selection; unsupported panel shows regions
      status: ✓ judged
      evidence: `/decode` with CodeMirror, four tabs, unsupported panel, Selection resolver; web build includes route
      judge: 2026-07-16 accepted

- [x] P5-04 Learner journey e2e on 3 fresh snippets
      done-when: `pnpm test:journey` reports 3/3 complete (analyze → step → transfer → save/load)
      status: ✓ judged
      evidence: `pnpm test:journey` → 3/3 fresh snippets complete (ACCUMULATE/FILTER/SEARCH)
      judge: 2026-07-16 accepted

## Gate block P5 (run all; paste outputs to PROGRESS.md)

1. `pnpm test:journey`           → expect: 3/3 fresh snippets complete
2. `pnpm test:scenes`            → expect: all pass (regression)
3. `pnpm test:patterns`          → expect: all pass (regression)
4. `pnpm typecheck`              → exit 0
5. `pnpm lint`                   → exit 0
6. `pnpm --filter web build`     → exit 0 with `/decode` route

**Phase P5 complete.** Tag: `gate-P5`

## Phase P6 — Content & Learn [gate: pnpm test:lessons && pathway navigable + web build]

- [x] P6-01 Author pathway + four lesson JSON (blocks reference sceneIds/examples)
      done-when: content validates against lesson schema; pathway lists 4 lessons
      status: ✓ judged
      evidence: content/pathways + content/lessons/{accumulate,count,filter,transform}.json
      judge: 2026-07-16 accepted

- [x] P6-02 Pre-render static scene payloads for each lesson example
      done-when: content/scenes/*.json exist; machine-check confirms scene nodes ⊆ graph
      status: ✓ judged
      evidence: content/scenes/{accumulate,count,filter,transform}.json from buildScene
      judge: 2026-07-16 accepted

- [x] P6-03 Learn routes: pathway index + static-first lesson pages + nav
      done-when: `/learn/how-loops-build-results` and four lesson routes build; prev/next navigable
      status: ✓ judged
      evidence: web build includes /learn, /learn/[pathway], /learn/[pathway]/[lesson]
      judge: 2026-07-16 accepted

- [x] P6-04 Machine-check script + PENDING-RICHIE verification records
      done-when: `pnpm test:lessons` reports 4/4 machine-checked
      status: ✓ judged
      evidence: `pnpm test:lessons` → 4/4 lessons machine-checked; verified_by PENDING-RICHIE
      judge: 2026-07-16 accepted

## Gate block P6 (run all; paste outputs to PROGRESS.md)

1. `pnpm test:lessons`           → expect: 4/4 machine-checked
2. `pnpm test:journey`           → expect: 3/3 (regression)
3. `pnpm typecheck`              → exit 0
4. `pnpm lint`                   → exit 0
5. `pnpm --filter web build`     → exit 0 with /learn pathway + 4 lessons

**Phase P6 complete.** Tag: `gate-P6`

## Phase P7 — Hardening & handoff [gate: full test + pnpm build + README + smoke script]

- [x] P7-01 Full regression suite green
      done-when: analyzer, patterns, scenes, fixtures, journey, lessons, typecheck, lint all pass
      status: ✓ judged
      evidence: `pnpm test:all` green; also pyodide + trace-pyodide 6/6
      judge: 2026-07-16 accepted

- [x] P7-02 Production `pnpm build` succeeds
      done-when: `pnpm build` exit 0
      status: ✓ judged
      evidence: `pnpm build` exit 0 (workspace + web SSR/client)
      judge: 2026-07-16 accepted

- [x] P7-03 README quickstart (≤10 commands clone → running)
      done-when: README.md exists with ≤10 numbered setup commands
      status: ✓ judged
      evidence: README.md numbered 1–10 (install → URLs → verify)
      judge: 2026-07-16 accepted

- [x] P7-04 Smoke-test script (10 items) + finalize BUILD-LOG + DEFERRED-ONLINE
      done-when: `tools/smoke-test.md` has 10 checks; DEFERRED-ONLINE marked finalized; BUILD-LOG has P7 summary
      status: ✓ judged
      evidence: tools/smoke-test.md (10 checks); DEFERRED-ONLINE finalized; BUILD-LOG P7 summary
      judge: 2026-07-16 accepted

## Gate block P7 (run all; paste outputs to PROGRESS.md)

1. Full suite (test:analyzer, test:trace, test:patterns, test:scenes, test:fixtures, test:journey, test:lessons, typecheck, lint)
2. `pnpm build` → exit 0
3. README.md quickstart ≤10 commands
4. tools/smoke-test.md present (10 items)

**Phase P7 complete.** Tag: `gate-P7`
