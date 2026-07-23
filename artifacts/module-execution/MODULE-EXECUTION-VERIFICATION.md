# Module Execution Verification

## Repository state

- Repository: `richiewaweru/language-of-learning`
- Workspace: `C:\Projects\langauge of learning`
- Branch: `codex/wave-a-hardening`
- Verification base SHA: `e929828092d329c83fb0d0b74a3ce50cd0c52af0`
- Delivery state: committed and published to `main` after verification. The immutable delivery SHA is recorded in the publishing handoff and repository history.
- Package manager: pnpm
- API: FastAPI/Uvicorn
- Web app: SvelteKit
- Browser framework: Playwright

The checkout was clean at the start. Published additions and regenerated evidence are intentional:

- `artifacts/module-execution/`: required API, screenshot, test, and report evidence.
- `tests/corpus/module-execution/`: executable module acceptance contract.
- `tests/e2e/decode-module-execution.spec.ts`: real API/browser acceptance suite.
- `tools/run_module_execution_tests.py`: module corpus runner.
- `WAVE-A-HARDENING-REVIEW/SCREENSHOTS/`: five tracked screenshots refreshed by the existing Wave-A regression runner after the scene changes.

## Outcome

Supported top-level Python now runs through the same verified analyzer, trace, scene, API, and learner UI pipeline used by function execution. It does not require a wrapper function or sample arguments.

The critical program:

```python
price = 100
tax = price * 0.16
total = price + tax
```

produces:

- execution scope `{ "kind": "module", "id": "module:main", "label": "Program" }`;
- stable `frame:module` step identity;
- three learner-visible assignment steps on source lines 1, 2, and 3;
- Flow dependencies `100 → price`, `price × 0.16 → tax`, and `price + tax → total`;
- final State values `price = 100`, `tax = 16.0`, and `total = 116.0`;
- a Program/module container in Graph Inspector;
- no sample-argument input and no function-only wording.

Representative response: [MOD-ASSIGN-002.json](api-responses/MOD-ASSIGN-002.json)

## Architecture and migration decisions

### Canonical execution identity

The trace contract now uses a discriminated `scope`:

- module: `kind`, `id`, and `label`;
- function: `kind`, `id`, `functionId`, `label`, and `argsRepr`.

`trace.call` remains optional only as temporary compatibility for existing function consumers and fixtures. New core readers use `trace.scope`.

### Semantic graph and runtime

- Added a `module` semantic node with stable ID `module:main` and learner label `Program`.
- Top-level semantic nodes are contained by the module root in source order.
- The tracer selects module execution whenever executable top-level statements exist.
- Function-only files retain existing function execution and sample-argument behavior.
- Function definitions in a module are declarations; they do not create execution steps by themselves.
- Module and function modes share statement execution, sandbox checks, limits, events, and value semantics.
- First writes emit initialization events; later writes emit change events.
- Expression assignments associate both the operation and written binding with the step.
- Module steps carry `frame:module`; function steps carry a stable function frame.

### Scene, projections, and UI

- Scene IDs, normalization, layout, transfer, labels, and playback resolve through execution scope rather than an unconditional function call.
- Existing visual grammar is reused; no parallel module renderer was introduced.
- Flow exposes operation inputs and written bindings.
- State uses “Program variables” for module scope.
- Guided Trace keeps source-line synchronization.
- Graph Inspector exposes the Program container without rendering it as `def Program`.
- Decode hides sample arguments for module source, handles comment-only files precisely, and gates visualization on verified meaningful trace steps rather than the presence of a function node.
- Telemetry records scope kind and scope ID.

### API safety

- `/api/analyze` accepts module source with `argsRepr: []`.
- Successful responses are structurally checked for graph root/node kinds, relation references, trace scope, and trace steps before being returned.
- Unsupported execution stops at the exact boundary without fabricating bindings or later state.

## Files changed

The implementation spans these functional groups:

- Contracts: `packages/lens-contracts/src/{graph,trace}.ts`, exported JSON schemas, and schema tests.
- Analyzer/runtime: `packages/analyzer-python/src/lol_analyzer/analyzer.py` and `packages/trace-runtime/src/lol_trace/tracer.py`.
- Scenes: layout, normalization, scene building, labels, transfer, types, and tests under `packages/lens-scenes/src/`.
- Visual grammar: `FunctionBoundary.svelte` and `ScenePlayer.svelte`.
- API: `apps/api/main.py` and API contract tests.
- Learner UI: Decode, Flow, State, Guided Trace, Graph Inspector, and semantic projections.
- Verification: module corpus runner, Playwright suite, configurable isolated test ports, API responses, screenshots, and logs.
- Compatibility migration: existing function trace and Wave-A goldens now include function scope and stable frames; affected visual snapshots were reviewed and refreshed.

## Automated verification

| Layer | Command | Result |
|---|---|---|
| Full repository suite | `pnpm test:all` | PASS |
| Production build | `pnpm build` | PASS |
| Module corpus | `pnpm test:module` | PASS, 15 classified cases |
| Analyzer | `pnpm test:analyzer` | PASS, 9 tests |
| Trace runtime | `pnpm test:trace` | PASS, 13 tests |
| Contracts/fixtures | included in `pnpm test:all` | PASS |
| Wave-A regression | `pnpm test:wave-a` | PASS, 16 tests |
| Semantic scenes | `pnpm test:scenes` | PASS, 71 tests |
| API analyze | `pnpm test:api-analyze` | PASS, 3 contract/rejection tests |
| API save | `pnpm test:api-save` | PASS, 2 tests |
| Web unit tests | `pnpm test:web` | PASS, 25 tests |
| Visual grammar | `pnpm test:visual` | PASS, 14 tests |
| TypeScript | `pnpm typecheck` | PASS |
| Lint | `pnpm lint` | PASS |
| Diff hygiene | `git diff --check` | PASS |

Logs:

- [Full test suite](test-results/test-all.txt)
- [Production build](test-results/build.txt)

## Browser verification

All browser tests used the real FastAPI analysis endpoint and real SvelteKit application. No analyze response was mocked.

| Suite | Result |
|---|---|
| Module execution Playwright suite | PASS, 22 tests in 58.7s |
| Existing function Decode regression | PASS, 12 tests |
| In-app browser manual verification | PASS |

The in-app browser was used to inspect the critical program across Flow, State, Guided Trace, and Graph Inspector, then to verify the unsupported-call boundary. Browser console errors were empty, analyze requests succeeded, source synchronization was correct, sample arguments were absent in module mode, and `def Program` was not displayed.

The Playwright viewport matrix covered:

- desktop: 1440 × 1000;
- tablet: 1024 × 768;
- mobile: 390 × 844.

The critical price case, a top-level loop, and the unsupported-call case were tested at all three sizes. Screenshots were visually inspected for overflow, clipping, label readability, reachable controls, source highlighting, state values, and distinct step presentation.

Logs:

- [Module Playwright results](test-results/playwright-module-execution.txt)
- [Function regression results](test-results/playwright-function-regression.txt)

Representative screenshots:

- [Critical desktop](screenshots/MOD-ASSIGN-002-desktop.png)
- [Critical tablet](screenshots/MOD-ASSIGN-002-tablet.png)
- [Critical mobile](screenshots/MOD-ASSIGN-002-mobile.png)
- [Loop desktop](screenshots/MOD-FOR-001-desktop.png)
- [Loop mobile](screenshots/MOD-FOR-001-mobile.png)
- [Unsupported desktop](screenshots/MOD-UNSUPPORTED-001-desktop.png)
- [Unsupported mobile](screenshots/MOD-UNSUPPORTED-001-mobile.png)

## Acceptance corpus

| ID | Scenario | Status | Evidence/result |
|---|---|---|---|
| MOD-ASSIGN-001 | Single assignment | PASS | `price = 100`; one initialization step |
| MOD-ASSIGN-002 | Dependent arithmetic | PASS | Three lines/steps; exact `100`, `16.0`, `116.0` |
| MOD-ASSIGN-003 | Reassignment | PASS | Initialization then change; `score = 15` |
| MOD-EXPR-001 | Parenthesized expression | PASS | `result = 30` |
| MOD-IF-001 | Top-level if/else | PASS | Correct branch and `status = 'adult'` |
| MOD-FOR-001 | Top-level for loop | PASS | Iteration events; `total = 6`, `number = 3` |
| MOD-WHILE-001 | Top-level while loop | PASS | Verified loop termination; `count = 3` |
| MOD-LIST-001 | List creation/index read | PASS | Exact list and `first = 10` |
| MOD-LIST-002 | List append | PASS | Mutation step; `[1, 2, 3]` |
| MOD-LIST-003 | Indexed mutation | PASS | Mutation step; `[1, 9, 3]` |
| MOD-CALL-001 | Definition plus module call | PARTIAL | Stops exactly at user-defined `call`; no invented result |
| MOD-MIXED-001 | Multiple definitions/module calls | PARTIAL | Stops at first user-defined `call`; no downstream total |
| MOD-EMPTY-001 | Comment-only source | PASS | Precise nothing-to-run state; no generic retry error |
| MOD-UNSUPPORTED-001 | Unknown dependency | PASS | Exact `call` violation; neither `value` nor `result` appears |
| MOD-INVALID-001 | Top-level return | PASS | Exact `return` violation; no fabricated execution |

Per-case API responses are in [api-responses](api-responses/), and the screenshot set is in [screenshots](screenshots/).

## Remaining partial and unsupported behavior

### PARTIAL

- Calls from module scope into user-defined functions are intentionally not represented as successful execution yet. The analyzer builds the module and declarations, but the tracer stops atomically at the call because nested verified call frames are not implemented.

### Unsupported

- Unknown calls and invalid top-level control flow remain unsupported at their exact boundary.
- Existing sandbox restrictions and language-subset exclusions remain unchanged.

No downstream values are invented for either category.

## Conflicts and limitations discovered

- Removing the Decode function gate alone would have been unsound because trace identity, frame fallback, scene IDs, state labels, and runtime entry selection were all function-specific. The migration therefore changed the full pipeline.
- Existing function goldens needed a legitimate contract migration to include function scope and stable frame IDs. Their behavioral regressions remain green.
- A file containing definitions plus executable statements must choose module entry even if a function appears first. This differs from the prior “first function” heuristic and is now explicit.
- Module-to-user-function calls require a future nested-call-frame design before they can be promoted from PARTIAL to PASS.

## Final conclusion

Module-level assignments, expressions, branches, loops, collections, and mutations are verified end to end through the real API and UI. Existing function behavior remains green. Empty and unsupported programs fail safely and precisely. The only acceptance cases not marked PASS are user-defined calls from module scope, which are explicitly PARTIAL and stop without fabricated state.
