# PATCH-003 — Synchronization & Renderer Truth Corrections
**For:** Cursor. Run AFTER PATCH-002 (Group D depends on 002's ID scheme landing first) as phase P-sync, same Planner–Worker–Judge discipline, commits `Psync/<task-id>: <summary>`, tag `gate-Psync`.
**Source:** second external audit (UI/renderer layer). Confirmed findings: duplicated `visit_stmt` definition in the analyzer; `ScenePlayer` owning private playback state outside the global Selection; hardcoded `itemCount={5}`; return-port label reading a binding the trace snapshot never includes; no external CI evidence.
**Authority unchanged.** Out-of-scope fence at bottom applies.

---

## TASK GROUP D — Truth verification & dead code

### D1 — Dedupe `visit_stmt`
`analyzer.py` defines `visit_stmt` twice (later definition silently wins in Python). Merge into ONE dispatcher handling exactly: `Assign, For, If, Return, Expr` → else `add_unsupported`. Delete the shadowed definition entirely.
- done-when: `grep -c "def visit_stmt" packages/analyzer-python/src/lol_analyzer/analyzer.py` returns 1; filter fixture still produces its `mutation` node and `mutates` relation; a new unit test analyzes filter's source and asserts the mutation node exists (so a future re-duplication fails loudly, not silently).

### D2 — Fresh-environment evidence
From a clean clone in a fresh environment: run the full gate block (`pnpm test`, `pytest` suites, fixtures, variations if 002 landed). Paste ACTUAL command outputs into PROGRESS.md under gate-Psync — command output, never phase-log prose.
- done-when: outputs present; any red discovered becomes a task in this phase before anything else proceeds.

### D3 — CI
Add GitHub Actions: on push/PR run typecheck, lint, `pnpm test`, and both pytest suites. Badge in README.
- done-when: workflow file exists and the first run is green on the default branch (or its failures are converted to tasks).

## TASK GROUP E — One Selection object, for real

### E1 — ScenePlayer becomes a controlled component
Remove canonical playback state from `ScenePlayer`. It receives `selection: Selection` and emits `onselectionchange(next: Selection)`; step/back/play/scrub/reset all operate by emitting selection changes (`stepIndex`), never by mutating a private index. Internal state may hold only non-canonical concerns (animation in-flight flags, reduced-motion).
- done-when: `grep -n "stepIndex = \$state" packages/visual-grammar/src` returns 0; ScenePlayer props include selection + onselectionchange; autoplay works by emitting successive selections.

### E2 — Decode wires all four views through the one store
Code line click, shape node click, trace step click, pattern member click, and ScenePlayer controls all read/write the single page `selection`, resolved via `resolveSelection` (SY1–SY3).
- done-when: an integration test (or Playwright spec) asserts: selecting code line N focuses the shape node, moves ScenePlayer to a step whose focus contains that node, and highlights the trace row — and stepping ScenePlayer forward updates the code highlight. Both directions, one test each.

### E3 — Slices and Learn scenes use the same mechanism
Slice pages and lesson SceneBlocks pass/consume selection identically (they may default to an internal store, but it must be THE Selection type flowing through the same resolver — no second synchronization pathway).
- done-when: no component in apps/web maintains its own step/selection representation outside `Selection`.

## TASK GROUP F — Renderer truth defects

### F1 — Derive loop item count
Delete `itemCount={5}`. Item count comes from the traced collection (the loop's `collectionRef` items length in the graph, or the max `itemIndex` + 1 across the loop's `loop_advance`/`advance_item` events — prefer the trace, it is ground truth for the run).
- done-when: accumulator with `[3, 5, 2]` shows 3 positions; a variation with 6 items shows 6; unit test covers both.

### F2 — Return port reads the trace, not a phantom binding
Replace `bindings.__return__` with the `exit_return` action's repr (fallback: trace `result.repr`). Tracer's `__return__` env key: either include it in snapshots officially (contract addition) or remove it — no half-existing keys.
- done-when: return port shows the actual result (e.g. `10`) at the final step for all six fixtures; test asserts non-empty return label at last step.

### F3 — No first-node fallbacks
Sweep ScenePlayer/scene-builder for `[0]`-style resolution (e.g. `mutations[0]` if 002-A5 hasn't already fixed the tracer side; any `loops[0]`, `branches[0]`). Resolution is by node id from the event/action, never by position in a list.
- done-when: `grep -nE "\.(loops|branches|mutations|returns)\[0\]" packages` returns 0; the two-append variation (002-A5) renders both mutations distinctly.

## TASK GROUP G — Honest presentation state

### G1 — Learn preview banner
Until a lesson's verification record has a real verifier, its page renders a visible badge: "Machine-checked · awaiting human verification". Remove automatically when `verified_by` ≠ PENDING-RICHIE.
- done-when: all four lessons show the badge; setting a verifier in one lesson's JSON removes it there.

### G2 — Regenerate lesson scene artifacts from the live engine
If lesson scenes/scene JSONs were generated from expected fixture files, regenerate them from the current engine (post-002, post-D1) so published content can never drift from what Decode produces.
- done-when: a script `pnpm content:rebuild` regenerates lesson scenes from `source.py` + engine and CI fails if committed content differs from regenerated output.

---

## GATE BLOCK Psync
```bash
1. grep -c "def visit_stmt" packages/analyzer-python/src/lol_analyzer/analyzer.py   # expect 1
2. grep -rn "itemCount={5}" apps packages | wc -l                                    # expect 0
3. grep -rn "__return__" apps/web packages/visual-grammar | wc -l                    # expect 0
4. pnpm test && pytest packages/analyzer-python packages/trace-runtime               # green
5. Sync integration tests (E2) green in both directions
6. pnpm content:rebuild && git diff --exit-code content/                             # no drift
7. CI green on default branch
8. Manual (Richie): in Decode, click line 4 of the accumulator — scene, trace row,
   and shape node all move together; press step ▶ in the scene — the code highlight
   follows. Then open the filter slice: 3-item list shows 3 positions, return port
   shows the real result.
```

## DEFERRED TO ITS OWN PHASE (do not start here)
**P-motion — action-driven runtime tokens:** values visibly traveling along edges, parameter binding movement, state morphing, return exit animation, fading paths as coherent routes. This is the 3Blue1Brown completion work; it deserves a dedicated phase with the function-component PoC as its motion-quality reference, and it starts only after gate-Psync is green — motion built on unsynchronized or untruthful state would animate lies beautifully.

## OUT OF SCOPE
Analyzer emission logic beyond D1 (that's PATCH-002), pattern rules, sandbox limits, lesson prose, new content, new primitives, Pyodide.
