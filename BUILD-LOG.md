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

### DECISION: pattern engine in TypeScript (P3)

`@lol/lens-patterns` is TypeScript (not Python) because rules operate on JSON graphs already produced by the analyzer; the Decode surface can import the same package without a second Pyodide round-trip. Detection remains deterministic and offline.

### DECISION: primary-hit priority order (P3)

When multiple rules could apply, `detectPattern` returns a single primary hit in order: GUARD → SEARCH → FILTER → TRANSFORM → COUNT → ACCUMULATE. COUNT and ACCUMULATE are mutually exclusive by iterator-read vs `+ 1` unread rules from the semantic contract.

## Phase P3 summary (gate-P3, 2026-07-16)

Implemented the six-pattern deterministic rule engine, matched all positive `expected.pattern.json` fixtures, and verified 100% precision on three negative lookalike fixtures with no candidate/LLM path.

### DECISION: canonicalize P0 scene-action scaffolds with scene builder (P4-02)

P0 `expected.scene-actions.json` files were sparse scaffolds. For P4 they were rewritten from `buildSceneActions(graph, trace)` so every trace step has declarative actions. Caption keys use a closed template set in `CAPTION_TEMPLATES` (SC3).

### DECISION: SVG screenshots for P4 gate assets (P4-06)

Gate asks for initial/mid/final × accumulate+filter screenshots. Assets are deterministic SVGs rendered from the layout engine (`tools/capture_p4_screenshots.ts`) into `BUILD-LOG/assets/p4/`. This avoids non-deterministic browser capture while still proving layout + step state.

### DECISION: paste variations are fixture-matched in P4 (P4-05)

Interactive slices accept pasted source and match known variations under `fixtures/` + `fixtures/variations/`. Live analyze-from-paste is deferred to P5 Decode (honest message when unmatched).

## Phase P4 summary (gate-P4, 2026-07-16)

Shipped layout + scene builder + selection resolver, visual-grammar primitives with TraceControls, interactive accumulate/filter slices (back-step restores trace bindings; reduced-motion honored), and 6 screenshot SVGs.

### DECISION: FastAPI JSON file store for P5 persistence

Foundation mentions SQLite behind a repository interface. For v0.1-local Decode, analyses are stored as JSON files under `data/analyses/` and telemetry as `data/events.ndjson`. Same localhost API surface; Postgres remains deferred.

### DECISION: CodeMirror for Decode editor (P5)

Brief allows CodeMirror or Monaco. Chose CodeMirror (lighter) with `@codemirror/lang-python`.

### DECISION: analyze in Python API; pattern/scene in TypeScript client (P5)

`/analyze` returns graph+trace from shared analyzer/tracer packages. Pattern detection and scene build run in the browser from existing TS packages — one analyze round-trip, no duplicate Python ports.

## Phase P5 summary (gate-P5, 2026-07-16)

Decode surface live at `/decode` with local FastAPI, transfer checks, save/load, NDJSON events, and a 3-snippet journey gate.

### DECISION: four-lesson pathway = accumulate/count/filter/transform (P6)

Authoring doc lists accumulate/count/filter/transform plus compare/transfer. Brief requires exactly four lessons. Chose the four pattern lessons; compare/transfer live as in-lesson checks and Decode handoff rather than separate lesson pages.

### DECISION: “Run it yourself” uses ScenePlayer, not in-page Pyodide (P6)

Static-first pages render step-0 layout without JS animation. Interactive stepping uses existing visual-grammar ScenePlayer with precomputed traces. Live re-analyze stays on `/decode` (P5). Full in-page Pyodide remains deferred.

## Phase P6 summary (gate-P6, 2026-07-16)

Authored the “How loops build results” pathway, pre-rendered scenes, Learn routes with static-first lessons, and a machine-check gate reporting 4/4 with PENDING-RICHIE verification placeholders.

### DECISION: root README counts install + verify as one quickstart (P7)

Brief asks ≤10 commands clone→running. README numbers 1–5 for install/run, 6–7 as browser URLs, 8–10 as optional verify (`test:lessons`, `test:journey`, `build`). Running app is available after step 5.

### DECISION: `pnpm test:all` aggregates local gates (P7)

Added a single root script chaining analyzer/trace/patterns/scenes/fixtures/journey/lessons/typecheck/lint so handoff and CI share one command. Pyodide parity scripts remain separate (slower; still run at gate).

## Phase P7 summary (gate-P7, 2026-07-16)

Hardening complete: full regression green, production `pnpm build` exit 0, root README quickstart, 10-item smoke checklist, DEFERRED-ONLINE finalized. Local v0.1 handoff ready; human lesson verification (`PENDING-RICHIE`) remains Richie’s sign-off.

## Corrective run F0–F4 (cause)

External audit found: analyzer overfitting (fixture names/literals in IDs and emission), duplicated `visit_stmt` (silent override), Selection not wired through UI, renderer truth defects (hardcoded itemCount=5, phantom `__return__`, `[0]` fallbacks), save persisting unverified client artifacts, and gates self-reported without CI. Root cause: self-verification without independent re-verification. This run fixes findings AND the verification root cause per CORRECTIVE-RUN-unified.md.

## Phase F0 summary (gate-F0, 2026-07-16)

Merged `visit_stmt` into a single dispatcher (Assign/For/If/Return/Expr), added filter mutation guard test, and added GitHub Actions CI with README badge. Fresh suite outputs pasted in PROGRESS.md.

### DECISION: position-only node ids (F1)

All graph node ids are `<kind>-L#lineC#col` (+ ordinal on collision). Names/literals stay in contract fields. Cause of fixture churn: id scheme change (not “adjusted to pass”).

### DECISION: variations use expect.json counts (F1)

Anti-overfit suite under `fixtures/variations/` asserts structural counts + pattern, not golden graphs — so renamed identifiers cannot be memorized.

## Phase F1 summary (gate-F1, 2026-07-16)

Analyzer generalized to N2 position ids; fixture-shaped emission removed; tracer resolves nodes by source line (no `mutations[0]`); goldens regenerated; 13 variations (incl. two-append) in standing `pnpm test:variations`.

## Phase F2 summary (gate-F2, 2026-07-16)

`POST /analyses` recomputes graph/trace/pattern/scene from source; stamps `engineVersion: 0.1.1`; `pnpm content:rebuild` + CI drift check. Pre-0.1.1 `data/analyses` untrusted.

## Phase F3 summary (gate-F3, 2026-07-16)

ScenePlayer is controlled via `selection` + `onselectionchange`. Decode/slices/Learn share one Selection pathway; bidirectional resolveSelection tests green.

## Phase F4 summary (gate-F4, 2026-07-16)

Loop item count from trace; return port from `exit_return`/`result.repr`; no `[0]` node fallbacks; Learn preview badge; ADRs 0007/0008 + interpreter operator parity. Corrective run complete — P-motion remains deferred.

### DECISION: server re-verifies every save from source truth (F2-01)

`POST /analyses` now ignores client-supplied `graph/trace/pattern/scene` and recomputes all four from `source + argsRepr` via `tools/build_artifacts.py` (Python `analyze_source` + `run_trace`, then a `tsx` subprocess `tools/build_pattern_scene.ts` for the TS pattern detector + scene builder). A `SandboxViolation` or function-less graph returns HTTP 422 with a structured `{ violation: { construct, message } }` body and persists nothing. Rationale: the audit found saves persisting unverified client artifacts; a green save must be independently re-derived, not trusted. Tests: `tools/run_api_save_tests.py` (`pnpm test:api-save`) — tamper (TRANSFORM source posted as ACCUMULATE → stored TRANSFORM truth) + hostile (`eval` → 422, nothing persisted).

### DECISION: engineVersion 0.1.1 stamped on saves; pre-0.1.1 analyses untrusted (F2-02)

Saves now carry `engineVersion: "0.1.1"` and `packages/analyzer-python` is bumped to `0.1.1`. Any `data/analyses/*.json` written before 0.1.1 (i.e. without `engineVersion`, or from the pre-F1 id scheme) is UNTRUSTED — it may hold client-supplied or stale-id artifacts and must be re-saved through the re-verifying endpoint to be trusted.

### DECISION: content:rebuild regenerates scenes from the live engine (F2-03)

`pnpm content:rebuild` (`tools/rebuild_content_scenes.ts`) regenerates `content/scenes/*.json` from each lesson's `fixtures/<f>/source.py` + `call.json` by running the Python engine (graph + trace) and the TS `buildScene`. CI runs it then `git diff --exit-code content/` so pre-rendered scenes can never silently drift. Running it exposed two pre-existing drifts, now fixed: (1) checked-in scenes still used the pre-F1 id scheme (`bind-total`) instead of position ids (`bind-L2C4`); (2) the `call.enter` caption derived the function name by stripping the `fn-` id prefix, which after F1 produced `L1C0` instead of `calculate_total` — `scene-builder` now reads the real `name` from the graph function node. Rebuild is idempotent; `test:scenes`, `test:lessons`, `test:journey` remain green.

## P-motion starts (after gate-F4)

Recreated function-component-poc.html — original unavailable. PM0 contract phase.

## Phase PM0–PM7 summary (gate-PM7, 2026-07-16)

Action-driven semantic motion landed: contracts (`motionVersion` 0.2), deterministic `deriveMotionState`, token/path/state/branch/return layers in visual-grammar, keyboard + reduced-motion a11y, PM7 SVG regression assets, learner protocol doc. Analyzer still does not emit `effect_fire` for print in the v0.1 subset — return exit is implemented; effect contrast awaits an effect-emitting construct.

### DECISION: RuntimeTokenStatus enum from PM0 contract (PM1)

Brief draft used labels like `entering`/`stored`; committed Zod enum is `idle|moving|bound|consumed|returned|ghost`. Reducer maps onto the enum (document precedence).


## Phase PM1 summary (implemented, pending judge, 2026-07-16)

`deriveMotionState(scene, graph, trace, stepIndex)` is a deterministic pure fold of
`scene.steps[].actions` over `0..stepIndex` (MC2) with the trace binding snapshot
overlaid for that step (T1). Split into `emptyMotionState` + `reduceSceneActions`
(pure, clones its input) + `deriveMotionState`. The action-builder now emits richer
motion actions (spawn/bind/tokenIds) and `buildScene` stamps `motionVersion: '0.2'`
plus straight-line layout edges from graph relations. Goldens regenerated from the
builder (never hand-tuned); `content/scenes/*` refreshed via `content:rebuild`.

### DECISION: MotionState token status mapping (PM1)

`RuntimeTokenState.status` is the closed six-value enum fixed by the motion contract
in PM0 (`idle | moving | bound | consumed | returned | ghost`). The P-motion plan's
action-level semantic labels (entering / stored / returning / complete) are **not**
enum members, so — per 00-authority (smallest compliant choice when the plan and the
committed schema disagree, schema wins) — they map onto the enum:
spawn_value→`idle`, move_value→`moving`, bind_value→`bound`, advance_item→`moving`,
append_value→`bound` (stored), change_state new→`bound` + old→`ghost`,
exit_return→`returned`. No enum was invented/expanded. Status is descriptive only;
the renderer (PM4) derives animation from position deltas between two MotionStates.

### DECISION: ghosts is a string[] of ghost token ids (PM1)

The PM1 brief sketched `ghosts[cell]=oldRepr` (a record), but the committed
`MotionStateSchema.ghosts` (PM0) is `z.array(z.string())`. Schema wins: `change_state`
creates a ghost token `${cell}::ghost` (status `ghost`, repr = oldRepr) and pushes its
id into `ghosts` (deduped). Bindings are authoritative from the trace snapshot, so a
name→repr map is unnecessary in `ghosts`.

### DECISION: bindings overlaid (replaced) from the trace snapshot (PM1)

`deriveMotionState` sets `state.bindings = { ...trace.steps[stepIndex].bindings }`
(name-keyed), so scrubbing to any step yields bindings byte-equal to that trace step
(T1 back-safe). Collections are then parsed from the trace binding of each
`collection` node (`"[3, 5]"` → `["3","5"]`) keyed by collection node id.

### DECISION: layout edges from relations, straight-line, motionVersion 0.2 (PM1)

`buildScene` emits `LayoutEdge[]` from graph relations
(contains→control, reads/writes/mutates→data, iterates→repeat, returns→return) with
`path {x1,y1,x2,y2}` from layout node centres (LE1 — no hand coords). PM3 will refine
anchors/curves; PM1 only needs a non-empty, deterministic edge set.

### FIX: golden fixture loader excludes motion-actions (pre-existing PM0 breakage)

`fixtures/motion-actions/` (committed in PM0, 97e0b9d) is a contract-level action-schema
fixture set, not a pattern fixture, but it sat in the `fixtures/` root and broke
`tests/fixtures/fixture-loader.test.ts` (which expects exactly the six pattern dirs).
`test:fixtures` was already red at HEAD before PM1. Added `motion-actions` to the same
exclusion list as `hostile/negative/variations`; the "exactly six pattern fixtures with
required golden files" guarantee is preserved (not weakened). Canonical motion-action
fixtures used by tests live under `packages/lens-contracts/fixtures/motion-actions/`.

