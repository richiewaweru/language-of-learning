# CORRECTIVE RUN — Unified Patch (supersedes PATCH-002 & PATCH-003)
**For:** Cursor, dispatched as ONE long run with five phases (F0–F4), same Planner–Worker–Judge discipline and rules as CURSOR-RUN.md. One conversation per phase; commits `F<n>/<task-id>: <summary>`; tag `gate-F<n>` per phase. Do not start a phase until the previous gate is green and reported in PROGRESS.md.

**Why:** two independent audits found (a) the analyzer overfitted to golden fixtures (fixture names/literals baked into IDs and emission logic), (b) a duplicated `visit_stmt` whose silent override makes correctness order-dependent, (c) the global Selection contract not actually wired through the UI, (d) renderer truth defects (hardcoded loop count, phantom return label, first-node fallbacks), (e) save persisting client-supplied artifacts unverified, and (f) gates self-reported without external evidence. Root cause across all: self-verification without independent re-verification. This run fixes the findings AND the root cause.

**Prime directive:** expected fixture values MAY change — they are re-derived from the corrected engine, never hand-tuned to stay green. Weakening any test, gate, or done-condition to pass = rejected task. BUILD-LOG reasons must name the cause ("id scheme change"), never "adjusted to pass."

**Authority:** semantic-contract.md (N1/N2, SY1–SY3, T1) > visual-constitution.md (§5, §6) > foundation-plan invariants (2, 4, 8) > everything else.

---

## PHASE F0 — Ground truth first (nothing else until this is green)

**F0-01 Fresh-environment evidence.** Clean clone, fresh environment: run the entire existing gate suite (`pnpm test`, both pytest suites, fixtures). Paste ACTUAL command outputs into PROGRESS.md — command output, never phase-log prose. Every red becomes an F0 task before proceeding.

**F0-02 Dedupe `visit_stmt`.** `analyzer.py` defines it twice; the later silently wins. Merge into ONE dispatcher handling exactly `Assign, For, If, Return, Expr` → else `add_unsupported`; delete the shadowed definition. Add a unit test asserting filter's source yields its `mutation` node + `mutates` relation, so re-duplication fails loudly.
- done-when: `grep -c "def visit_stmt" packages/analyzer-python/src/lol_analyzer/analyzer.py` = 1; new test green.

**F0-03 CI.** GitHub Actions on push/PR: typecheck, lint, `pnpm test`, both pytest suites. README badge.
- done-when: first run green on default branch (or failures converted to F0 tasks).

**F0-04 Process files.** If `tasks.md` / `PROGRESS.md` / `BUILD-LOG.md` are missing, reconstruct minimally; BUILD-LOG opens with this run's cause ("audit found analyzer overfitting + unsynchronized UI").

**GATE F0:** fresh-run outputs in PROGRESS.md · visit_stmt count = 1 · CI green · process files exist.

---

## PHASE F1 — Analyzer generalization (the serious fix)

**F1-01 Contract-compliant IDs (N2).** id = `<kind-prefix>-L<line>C<col>` (+ ordinal suffix on collision). Prefixes: `fn, bind, coll, val, call, op, seq, branch, loop, ret, mut, eff`. NO names, NO literals, NO semantic guesses in ids; names/reprs stay in their contract fields.
- done-when: `grep -rnE 'val-rate|val-zero|ret-fallback|ret-early|ret-zero|op-inc|"total"|"count"|"rate"' packages/analyzer-python/src` = 0 matches; unit test asserts every emitted id matches `^[a-z]+-L[0-9]+C[0-9]+(-[0-9]+)?$` across all fixture graphs.

**F1-02 Delete fixture-shaped emission logic.** Remove every name/literal-keyed special case: `should_emit_assignment_value`'s `name in {"total","count"}` (→ general rule: emit a value node for every literal initializer of a constant/state binding); `value_id_from_repr`'s name branches; `return_id`/`body_reference` literal heuristics (→ position-based resolution).
- done-when: F1-01 greps hold; Judge reads the diff and confirms no remaining fixture knowledge.

**F1-03 Multiple-mutation support.** Analyzer emits N mutation nodes (position ids); tracer resolves the mutation by the executing statement's source position, not `mutations[0]`.
- done-when: a two-append variant traces with distinct mutation ids per event.

**F1-04 Regenerate golden expectations honestly.** Regenerate expected graph/trace/scene-actions for all six patterns + negatives from the corrected pipeline. Worker adds a 3–5 line hand-analysis header per fixture (node count, key ids by position, pattern rationale); Judge re-derives ≥2 fixtures cold and compares.
- done-when: full suite green against regenerated files; BUILD-LOG lists every changed expectation with cause.

**F1-05 Generalization suite (the permanent guard).** `fixtures/variations/`: 12+ variants — each pattern ≥2×, ALL identifiers renamed (`total→running_sum`, `prices→readings`…), different literals, reordered non-dependent statements where valid, plus the two-append variant. No expected-graph files; per-variant `expect.json` declares `{pattern, stateBindingCount, loopCount, branchCount, mutationCount, returnsCount}`. Test asserts counts + pattern match, zero unsupported regions, all ids match the F1-01 regex. Joins the standing gate block forever.
- done-when: 12/12 (13 with two-append) pass.

**GATE F1:** greps = 0 · id-regex test green · full suite green vs regenerated fixtures · variations 100% · Judge cold-check logged.

---

## PHASE F2 — Truth path (server & artifacts)

**F2-01 Server re-verification on save.** `POST /analyses` ignores client graph/trace/pattern/scene; recomputes all four from `source + argsRepr` before persisting. SandboxViolation or function-less graph → 422 with honest structured reason, nothing persisted.
- done-when: test posts a tampered graph (transform mislabeled ACCUMULATE) → stored artifact contains recomputed truth; hostile source → 422 with `violation`.

**F2-02 Engine version stamping.** Saves record `engineVersion`; bump analyzer to `0.1.1`. BUILD-LOG notes pre-0.1.1 artifacts in `data/analyses` are untrusted (may delete).

**F2-03 Lesson artifacts from the live engine.** `pnpm content:rebuild` regenerates lesson scenes from `source.py` + current engine; CI fails if committed content differs from regenerated output.
- done-when: `pnpm content:rebuild && git diff --exit-code content/` clean; CI step added.

**GATE F2:** tamper test green · hostile-save 422 green · content rebuild drift-free in CI.

---

## PHASE F3 — One Selection object, for real

**F3-01 ScenePlayer becomes controlled.** Remove canonical playback state; props `selection: Selection` + `onselectionchange(next)`. Step/back/play/scrub/reset emit selection changes; internal state holds only non-canonical concerns (in-flight animation flags, reduced-motion).
- done-when: `grep -n "stepIndex = \$state" packages/visual-grammar/src` = 0; autoplay works by emitting successive selections.

**F3-02 Decode wires all views through the one store.** Code line click, shape node click, trace row click, pattern member click, and ScenePlayer controls all read/write the single page `selection` via `resolveSelection` (SY1–SY3).
- done-when: integration/Playwright tests assert BOTH directions: (a) selecting code line N focuses the shape node, moves ScenePlayer to a step whose focus contains it, highlights the trace row; (b) stepping ScenePlayer updates the code highlight.

**F3-03 Slices and Learn use the same mechanism.** SceneBlocks/slice pages consume the same `Selection` type through the same resolver — no second synchronization pathway anywhere in apps/web.
- done-when: no component maintains its own step/selection representation outside `Selection`.

**GATE F3:** grep = 0 · both-direction sync tests green · manual: click accumulator line 4 → scene, trace row, shape node move together; press step ▶ → code highlight follows.

---

## PHASE F4 — Renderer truth & honest presentation

**F4-01 Derive loop item count.** Delete `itemCount={5}`. Count from the trace (max `itemIndex`+1 across the loop's advance events; fallback: graph collection items length) — trace is ground truth for the run.
- done-when: `[3, 5, 2]` shows 3 positions; a 6-item variant shows 6; unit tests cover both; `grep -rn "itemCount={5}" apps packages` = 0.

**F4-02 Return port reads the trace.** Replace `bindings.__return__` with the `exit_return` action repr (fallback `result.repr`). Tracer's `__return__` env key: officially in snapshots (contract addition) or removed — no half-existing keys.
- done-when: return port shows the real result at the final step for all six fixtures; `grep -rn "__return__" apps/web packages/visual-grammar` = 0.

**F4-03 No first-node fallbacks.** Sweep for positional resolution (`loops[0]`, `branches[0]`, `returns[0]`, residual `mutations[0]`); resolve by node id from the event/action.
- done-when: `grep -rnE "\.(loops|branches|mutations|returns)\[0\]" packages` = 0; two-append variant renders both mutations distinctly.

**F4-04 Learn preview banner.** Until `verified_by` ≠ PENDING-RICHIE, lesson pages show "Machine-checked · awaiting human verification"; badge auto-clears per lesson when a real verifier is set.

**F4-05 Decision records.** `0007-api-only-analysis-v0_1.md` (Pyodide deferred; consequence: Decode requires local API, no offline mode; cross-ref DEFERRED-ONLINE) and `0008-interpreter-tracer.md` (purpose-built interpreter; risk: divergence from real Python; mitigation IMPLEMENTED: parity test comparing every supported binop/comparison/unary against CPython evaluation under sandbox constraints — divergences fixed or explicitly listed).

**GATE F4 (final):**
```bash
1. grep -c "def visit_stmt" packages/analyzer-python/src/lol_analyzer/analyzer.py  # 1
2. grep -rnE 'val-rate|"total"|"count"|"rate"|ret-fallback|op-inc' packages/analyzer-python/src | wc -l  # 0
3. grep -rn "itemCount={5}" apps packages | wc -l                                  # 0
4. grep -rn "__return__" apps/web packages/visual-grammar | wc -l                  # 0
5. grep -rnE "\.(loops|branches|mutations|returns)\[0\]" packages | wc -l          # 0
6. pnpm test && pytest packages/analyzer-python packages/trace-runtime             # green (incl. variations, parity, sync)
7. pnpm content:rebuild && git diff --exit-code content/                           # clean
8. ls docs/decisions/0007* docs/decisions/0008* tasks.md PROGRESS.md BUILD-LOG.md  # exist
9. CI green on default branch
10. Manual (Richie): (a) Decode: paste an accumulator with every identifier renamed —
    correct pattern, sane shape, transfer check on the renamed identifier's real line;
    (b) click line 4 → all views move together; step the scene → code follows;
    (c) filter slice: 3 items = 3 positions; return port shows the real value;
    (d) Learn pages show the preview badge.
```

---

## DEFERRED — P-motion (its own future phase, not part of this run)
Action-driven runtime tokens: values traveling along edges, parameter-binding movement, state morphing, visible return exit, fading paths as coherent routes. Reference for motion quality: function-component-poc.html. Starts only after gate-F4 — motion built on unsynchronized or untruthful state would animate lies beautifully.

## OUT OF SCOPE FOR THE ENTIRE RUN
Pattern rules, sandbox limits, visual palette, lesson prose, new content, new primitives, Pyodide implementation, GitHub import, recursion/DSA. Discoveries go to BUILD-LOG as notes, not fixes.

## SEQUENCING RATIONALE (for the agent's planner)
F0 establishes trustworthy ground before changing anything (you cannot fix what you cannot measure). F1 fixes the deepest truth layer; F2 protects it at the persistence boundary; F3 fixes how truth is *coordinated* in the UI; F4 fixes how truth is *displayed* and recorded. Each phase's outputs are inputs to the next — running them out of order regenerates work (e.g. F1's id change flows into F3's resolver tests and F4's sweeps).
