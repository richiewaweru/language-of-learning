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

## Phase F0 — Ground truth [gate: visit_stmt=1 · CI · fresh evidence]

- [x] F0-01 Fresh-environment evidence in PROGRESS
      done-when: pasted command outputs for full suite
      status: ✓ judged
      evidence: PROGRESS.md gate-F0 section
      judge: 2026-07-16 accepted

- [x] F0-02 Dedupe visit_stmt + filter mutation unit test
      done-when: grep -c "def visit_stmt" = 1; filter mutation test green
      status: ✓ judged
      evidence: analyzer.py single dispatcher; test_filter_emits_mutation_node_and_mutates_relation
      judge: 2026-07-16 accepted

- [x] F0-03 GitHub Actions CI + README badge
      done-when: .github/workflows/ci.yml exists; badge in README
      status: ✓ judged
      evidence: ci.yml + README badge
      judge: 2026-07-16 accepted

- [x] F0-04 Seed F0–F4 process files / BUILD-LOG cause
      done-when: tasks.md has F0–F4; BUILD-LOG opens corrective cause
      status: ✓ judged
      evidence: tasks.md + BUILD-LOG corrective entry
      judge: 2026-07-16 accepted

## Gate block F0

1. `grep -c "def visit_stmt" packages/analyzer-python/src/lol_analyzer/analyzer.py` → 1
2. `pnpm test:analyzer` green (incl. filter mutation guard)
3. CI workflow present

**Phase F0 complete.** Tag: `gate-F0`

## Phase F1 — Analyzer generalization [gate: position IDs · variations 12+]

- [x] F1-01 Contract-compliant position IDs (N2)
      done-when: fixture-string greps = 0; id-regex unit test green
      status: ✓ judged
      evidence: ids like fn-L1C0; test_all_emitted_ids_match_position_regex
      judge: 2026-07-16 accepted

- [x] F1-02 Delete fixture-shaped emission logic
      done-when: no name/literal special cases remain
      status: ✓ judged
      evidence: analyzer greps clean; general literal→value rule
      judge: 2026-07-16 accepted

- [x] F1-03 Multiple-mutation support (analyzer + tracer)
      done-when: two-append variant traces with distinct mutation ids
      status: ✓ judged
      evidence: fixtures/variations/two_append_gather mutationCount=2
      judge: 2026-07-16 accepted

- [x] F1-04 Regenerate golden expectations honestly
      done-when: full suite green vs regenerated files; BUILD-LOG lists causes
      status: ✓ judged
      evidence: regenerated graph/trace/scene-actions/pattern; HAND-ANALYSIS.md per fixture
      judge: 2026-07-16 accepted

- [x] F1-05 Generalization suite (12+ variations with expect.json)
      done-when: 12/12 (13 w/ two-append) pass; standing gate
      status: ✓ judged
      evidence: pnpm test:variations 13 variants; in test:all
      judge: 2026-07-16 accepted

## Gate block F1

1. greps for fixture strings = 0
2. full suite green
3. variations 100%

**Phase F1 complete.** Tag: `gate-F1`

## Phase F2 — Truth path [gate: re-verify save · content:rebuild]

- [x] F2-01 Server re-verification on save
      done-when: tamper test + hostile 422
      status: ✓ judged
      evidence: pnpm test:api-save 2/2
      judge: 2026-07-16 accepted

- [x] F2-02 Engine version stamping (0.1.1)
      done-when: engineVersion on saves
      status: ✓ judged
      evidence: engineVersion 0.1.1; analyzer package 0.1.1
      judge: 2026-07-16 accepted

- [x] F2-03 pnpm content:rebuild + CI drift check
      done-when: rebuild clean; CI step
      status: ✓ judged
      evidence: content:rebuild + CI git diff --exit-code content/
      judge: 2026-07-16 accepted

## Gate block F2

1. tamper + hostile-save tests
2. content:rebuild drift-free

**Phase F2 complete.** Tag: `gate-F2`

## Phase F3 — One Selection object [gate: controlled ScenePlayer · sync tests]

- [x] F3-01 ScenePlayer controlled (selection + onselectionchange)
      done-when: no stepIndex = $state canonical
      status: ✓ judged
      evidence: grep stepIndex = $state = 0 in visual-grammar
      judge: 2026-07-16 accepted

- [x] F3-02 Decode wires all views through one store
      done-when: bidirectional sync tests green
      status: ✓ judged
      evidence: lens-scenes resolveSelection tests both directions
      judge: 2026-07-16 accepted

- [x] F3-03 Slices and Learn use same Selection mechanism
      done-when: no second selection pathway in apps/web
      status: ✓ judged
      evidence: slices + learn pass Selection to ScenePlayer
      judge: 2026-07-16 accepted

## Gate block F3

1. grep stepIndex = $state = 0
2. sync tests both directions

**Phase F3 complete.** Tag: `gate-F3`

## Phase F4 — Renderer truth & presentation [gate: final corrective]

- [x] F4-01 Derive loop item count from trace
      done-when: itemCount={5} gone; 3 and 6 item cases
      status: ✓ judged
      evidence: loopItemCountFromTrace; test:visual 3/3
      judge: 2026-07-16 accepted

- [x] F4-02 Return port from exit_return / result.repr
      done-when: __return__ gone from web/visual-grammar
      status: ✓ judged
      evidence: returnReprFromScene; tracer no longer sets __return__
      judge: 2026-07-16 accepted

- [x] F4-03 No first-node [0] fallbacks
      done-when: grep packages = 0
      status: ✓ judged
      evidence: no .(loops|branches|mutations|returns)[0] in packages
      judge: 2026-07-16 accepted

- [x] F4-04 Learn preview banner
      done-when: PENDING-RICHIE shows badge
      status: ✓ judged
      evidence: lesson page preview-badge when PENDING-RICHIE
      judge: 2026-07-16 accepted

- [x] F4-05 ADRs 0007/0008 + interpreter parity test
      done-when: docs exist; parity green or listed
      status: ✓ judged
      evidence: docs/decisions/0007 + 0008; pnpm test:parity-ops
      judge: 2026-07-16 accepted

## Gate block F4

See CORRECTIVE-RUN-unified.md final 10-command block.

**Phase F4 complete.** Tag: `gate-F4`

## Phase PM0 — Motion contract and reference recovery [gate: contracts + PoCs, no tween code]

- [x] PM0-01 Commit P-MOTION + motion-contract docs
      done-when: docs/P-MOTION.md and docs/motion-contract.md exist
      status: ✓ judged
      evidence: docs present
      judge: 2026-07-16 accepted

- [x] PM0-02 Recreate function-component-poc + reference README
      done-when: reference/function-component-poc.html + README classify PoCs
      status: ✓ judged
      evidence: recreated PoC; BUILD-LOG notes original unavailable
      judge: 2026-07-16 accepted

- [x] PM0-03 Extend SceneAction + LayoutEdge + MotionState schemas
      done-when: contracts build; schemas export; old fixtures still parse
      status: ✓ judged
      evidence: lens-contracts 33 tests; motionVersion 0.2 support
      judge: 2026-07-16 accepted

- [x] PM0-04 Motion-actions valid/invalid fixtures
      done-when: every action type has valid fixture; invalid fail Zod
      status: ✓ judged
      evidence: fixtures/motion-actions + motion-actions.test.ts
      judge: 2026-07-16 accepted

## Gate block PM0

1. contracts build + export-schemas
2. motion-actions tests green
3. no RuntimeTokenLayer yet
4. PoCs on disk

**Phase PM0 complete.** Tag: `gate-PM0`

## Phase PM1 — Motion state reducer [gate: deriveMotionState fold 0..N]

- [x] PM1-01 reduceSceneActions + deriveMotionState
      done-when: jump/scrub tests green; reducedMotion same semantic state
      status: ✓ judged
      evidence: motion-state.test.ts; deriveMotionState fold 0..N
      judge: 2026-07-16 accepted

- [x] PM1-02 Expand action-builder (spawn/bind/tokenIds) + regenerate goldens
      done-when: call_enter/bind_param emit actions; suite green
      status: ✓ judged
      evidence: richer actions; motionVersion 0.2 + edges; goldens regenerated
      judge: 2026-07-16 accepted

## Gate block PM1

1. pnpm test:scenes incl. motion reducer tests
2. No required CSS tweens

**Phase PM1 complete.** Tag: `gate-PM1`

## Phase PM2 — Arg binding motion [gate: call→param visible]

- [x] PM2-01 RuntimeTokenLayer + MotionPath
      done-when: arg travels to parameter; multi-param; reduced-motion
      status: ✓ judged
      evidence: RuntimeTokenLayer + MotionPath in ScenePlayer
      judge: 2026-07-16 accepted

## Gate block PM2 — Tag: `gate-PM2`

## Phase PM3 — Loop + state morph [gate: accumulate 0→3→8→10]

- [x] PM3-01 Loop advance + state morph for accumulate
      done-when: ≥10 variations; canonical totals correct
      status: ✓ judged
      evidence: 10 accumulate_* variations; StateTransition
      judge: 2026-07-16 accepted

## Gate block PM3 — Tag: `gate-PM3`

## Phase PM4 — Branch + append [gate: filter routes]

- [x] PM4-01 Branch fade/activate + append_value
      done-when: mixed true/false visible
      status: ✓ judged
      evidence: BranchRoute + append_value actions
      judge: 2026-07-16 accepted

## Gate block PM4 — Tag: `gate-PM4`

## Phase PM5 — Return exit (+ effect if emitted)

- [x] PM5-01 Return crosses function boundary
      done-when: return visible exit; effect if analyzer emits
      status: ✓ judged
      evidence: ReturnExit; effect_fire not in v0.1 subset
      judge: 2026-07-16 accepted

## Gate block PM5 — Tag: `gate-PM5`

## Phase PM6 — Playback polish + a11y

- [x] PM6-01 Timing tokens, pause/scrub cancel, keyboard, SR
      done-when: keyboard + reduced-motion convey every step
      status: ✓ judged
      evidence: Arrow/Space keys; aria-live; --t-enter..fade tokens
      judge: 2026-07-16 accepted

## Gate block PM6 — Tag: `gate-PM6`

## Phase PM7 — Visual regression + learner protocol

- [x] PM7-01 Screenshots + semantic asserts + learner protocol doc
      done-when: assets under BUILD-LOG/assets/pm7; protocol filed
      status: ✓ judged
      evidence: 8 SVGs; docs/learner-validation-pm7.md
      judge: 2026-07-16 accepted

## Gate block PM7 — Tag: `gate-PM7`

## Phase R1 — Web runtime reliability [gate: fresh dev browser + production preview]

- [x] R1-01 Eliminate hydration-time fallback 500s from repo-root and stale workspace dependency resolution
      done-when: a fresh single-server start renders real UI on `/`, `/decode`, `/learn`, `/slices/accumulate`, `/slices/filter`, and `/debug/graph` in a browser with no page errors; `tests/web/repo-root.test.ts` passes; `pnpm --filter web build` plus preview renders `/slices/accumulate` from the bundled server
      status: ✓ judged
      evidence: 4/4 focused Vitest assertions; cold-cache browser sweep rendered all six routes with zero browser errors and no `@lol_lens-scenes` prebundle; web build exit 0; preview `/slices/accumulate` rendered Accumulator with zero browser errors; full `pnpm test:all` exit 0
      judge: 2026-07-18 accepted from fresh dev + production-preview browser evidence

## Gate block R1

1. `pnpm exec vitest run tests/web/repo-root.test.ts` → all pass
2. Fresh dev browser sweep → six routes show real UI; zero page/console errors
3. `pnpm --filter web build` → exit 0
4. Fresh preview browser check on `/slices/accumulate` → real UI; zero page/console errors

**Phase R1 complete.**
