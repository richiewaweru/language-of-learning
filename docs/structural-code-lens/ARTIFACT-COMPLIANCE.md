# Structural Code Lens v1 artifact compliance

This is an evidence register, not a claim register. `Verified` means the named automated check passes in the repository. Human learning outcomes remain pending, and work excluded by the governing brief remains deferred.

## Non-negotiable rules

| Rule | Evidence | Status |
|---|---|---|
| Analyzer/runtime emit facts only | Raw graph/trace schemas; `tools/run_analyzer_tests.py`; `tools/run_trace_tests.py` | Verified |
| All learner views consume one `SceneStep` | `normalize-semantic-scene.ts`; `VisualLearningStage.svelte`; cross-view Playwright test | Verified |
| `Selection.stepIndex` is the sole step controller | `LessonWorkspace.svelte`; `ScenePlayer.svelte`; timeline synchronization test | Verified |
| Symbols are isolated registered modules | Canonical manifest, `symbol-registry.ts`, registry compatibility test | Verified |
| Layout is separate from symbols | `deriveSemanticProjections.ts`; scene layout tests | Verified |
| Generic supported differs from unsupported | Resolver ladder test; Graph Inspector fallback visual snapshot | Verified |
| Algorithms use primitive composition | Manifest excludes algorithm IDs; executable binary-search/two-pointer cases | Verified |
| A new symbol does not require edits to old symbols | Registry test and one-entry/one-module registry seam | Verified |
| Accumulation behavior remains compatible | Six legacy graph/trace fixtures compare structurally and deterministically | Verified |

## Phase gates

| Phase/gate | Evidence | Status |
|---|---|---|
| 0 — deterministic baseline reproducible | Legacy graph/trace tests; desktop/mobile snapshots | Verified |
| 1 — one primary owner per UI element | Accepted view ADR in `GOVERNANCE.md`; separate Flow/State/Guided/Inspector components | Verified |
| 2 — accumulation uses semantic v1 without meaningful regression | Semantic contract/normalizer tests and flagship screenshots | Verified |
| 3 — Flow explains origin, movement, change, repetition, and delayed return | Flow E2E assertions; active and completed snapshots | Verified |
| 4 — dummy symbol uses one registration seam | Manifest validator and symbol resolver tests | Verified |
| 5 — search/swap/binary structure needs no algorithm symbol | Executable acceptance gate and manifest exclusion assertion | Verified |
| 6 — current item/state/change/return are quickly locatable | State structure and browser assertions; speed outcome requires the human pilot | Verified implementation; pending human timing |
| 7 — Guided Trace is bounded and shows one event/source range | Guided Trace test, exact-range assertion, overflow assertion | Verified |
| 8 — Inspector focus and controls | Inactive-node fade, irrelevant-edge hide, zoom, pan viewport, minimap, frames tests | Verified |
| 9 — requested DSA subset | Accumulation, search, mutation/swap, binary search, and two pointers execute; stack/queue/sliding window remain out of scope | Verified scoped subset |
| 10 — concreteness fading | Explicitly excluded by Codex brief | Deferred |

## Canonical symbol manifest

| Symbol | Module/renderer evidence | Status |
|---|---|---|
| value | `ValueToken.svelte`, registry metadata | Verified |
| binding | `BindingTag.svelte`, `SymbolBadge.svelte` | Verified |
| collection | `CollectionFrame.svelte`, Flow collection strip | Verified |
| state | `StateCell.svelte`, Flow and State projections | Verified |
| cursor | `CursorSymbol.svelte`, selected-cell/current-item E2E | Verified |
| range | `RangeSymbol.svelte`, loop-test/range composition fixtures | Verified |
| loop | `LoopFrame.svelte`, repetition projection | Verified |
| comparison | `ComparisonSymbol.svelte`, condition/loop-test fixtures | Verified |
| branch | `BranchFork.svelte`, condition fixtures | Verified |
| mutation | `MutationSymbol.svelte`, indexed update/swap fixtures | Verified |
| call-frame | Registry badge and root-frame State grouping; built-in `len`/`range` facts | Verified scoped v1 |
| reference | Registry badge and deterministic alias `objectIds` | Verified |
| return | `ReturnPort.svelte`, delayed-return test | Verified |
| effect | `EffectPulse.svelte`, existing effect contract | Verified |
| generic-operation | `GenericOperationSymbol.svelte`, resolver and visual fallback evidence | Verified |
| unsupported | `UnsupportedRegion.svelte`, recursion/DictComp fixtures and visual fallback evidence | Verified |

## Required contract and fixture tests

| Requirement | Evidence | Status |
|---|---|---|
| Unique stable IDs, contiguous steps, valid references | Semantic schema refinements and deterministic normalization tests | Verified |
| Valid roles/events/ranges/confidence/snapshots | Contract tests including additive v1 events; exact source-range browser test | Verified |
| Object identity | Alias runtime test and normalization snapshot properties | Verified |
| Fallback resolution | Exact → composition → generic → unsupported registry test | Verified |
| Deterministic double generation | Legacy trace test and every structural-v1 case executed twice | Verified |
| Accumulation, count, maximum, linear search, early return | `fixtures/structural-v1/cases.json`; executable verifier | Verified |
| Array update, swap, binary search, two pointers | Indexed/while/floor-division runtime tests; executable verifier | Verified |
| Ordinary supported calls and bounded ranges | `len`/`range` analyzer/runtime capability tests | Verified |
| Alias mutation and generic supported behavior | Executable verifier and alias identity test | Verified |
| Unsupported behavior and recursion-as-unsupported | Explicit unsupported events/violations and unsupported-region tests | Verified |
| Legacy compatibility on symbol registration | Full prior contract/scene/visual fixture suites in `verify:structural-lens` | Verified |

## UX and visual acceptance

| Criterion | Evidence | Status |
|---|---|---|
| Flow has no default horizontal scrolling | Desktop/mobile document-overflow assertions | Verified |
| Current item visibly originates at selected cell and cursor advances | Stable semantic test IDs and timeline test | Verified |
| State old → new is visible; only changed row highlights | Flow/State assertions and active screenshot | Verified |
| Result is hidden until return | Pre-return and end-step assertions; completed screenshot | Verified |
| State shows role/name/current/previous/status, frame, identity, collapsed history | State component, normalization tests, alias runtime evidence | Verified |
| Guided Trace shows one headline/event, exact source, facts, recent bounded trail | Browser assertions and component structure | Verified |
| Inspector focuses active neighborhood, hides irrelevant edges, supports zoom/pan/minimap/frames | Browser assertions and Inspector CSS/control state | Verified |
| Keyboard and screen-reader semantics | Native controls, labels, tab/Next keyboard test | Verified |
| Reduced-motion equivalence | Emulated reduced-motion browser test with zero transition duration | Verified |
| Idle, active, selected, changing, completed, generic, unsupported, desktop, mobile visual states | Flow active/mobile/completed snapshots and Inspector fallback snapshot | Verified |

## Human evidence and deferred scope

| Item | Evidence/status |
|---|---|
| Prediction accuracy, explanation accuracy, state-location time, confusion, transfer | Manual anonymized worksheet in `LEARNING-PILOT.md` — **Pending human study** |
| Full recursive visualization and concrete/abstract fading | **Deferred** by the governing v1 Codex brief |
| Sliding window, stack/queue, divide-and-combine, user-defined multi-function call frames | **Deferred** beyond the explicitly accepted v1 subset |
