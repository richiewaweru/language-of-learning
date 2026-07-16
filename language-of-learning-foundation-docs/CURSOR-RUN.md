# CURSOR-RUN — Long-Run Execution Package for Language of Learning v0.1
**How to use this file:** Part A is the kickoff prompt — paste it verbatim into Cursor **Plan Mode** in a fresh workspace containing the docs folder. Parts B–D are materials the agent itself installs during Phase 0 (rules, task file, protocols). You review at phase gates only.

---

## PART A — THE KICKOFF PROMPT (paste into Plan Mode)

You are running a long, phase-gated autonomous build. You will work across multiple sessions over days. Your job is not to produce a first working screen — it is to reach the Definition of Done in `docs/autonomous-build-brief.md` §7 with high quality at every phase. Read this entire prompt, then produce your Phase 0 plan for my approval. After Phase 0, you run without babysitting; I inspect only at phase gates.

### Mission
Build the v0.1 "Language of Learning" app as a local pnpm monorepo per the governing documents in `docs/`. Deliverables: (1) the lens packages passing golden-fixture tests in both CPython and Pyodide; (2) the Decode surface with synchronized CODE/SHAPE/TRACE/PATTERN views, learner-paced stepping, transfer checks, and an honest unsupported panel; (3) the four-lesson "How loops build results" pathway; (4) full test suite green including hostile sandbox fixtures; (5) BUILD-LOG.md and DEFERRED-ONLINE.md maintained throughout.

### Document authority (memorize this order; on any conflict, higher wins)
1. `docs/semantic-contract.md` — data truth
2. `docs/visual-constitution.md` + `docs/design-tokens.css` — rendering truth
3. `docs/foundation-plan.md` — architecture
4. `docs/language-of-learning-foundation-docs/` (20 files, PATCH-001 applied) — detail
5. `reference/*.html` PoCs — look/feel/motion targets only, never architecture
If PATCH-001 has not been applied to the 20-doc set, apply and verify it FIRST.

### Operating architecture: Planner–Worker–Judge, one agent, three hats
You wear all three hats in strict rotation; the external files are the ground truth that survives context loss between and within sessions:
- **PLANNER (once per phase):** read the phase's spec in `docs/autonomous-build-brief.md` §4 + relevant epics in the WBS doc; decompose into tasks in `tasks.md`, each with a TESTABLE done-condition (a command + expected result — never "works well").
- **WORKER (per task):** TDD loop — write the failing test from the done-condition first, confirm it fails, implement until it passes without modifying the test's intent, run the full affected suite, mark the task `done-pending-judge` with evidence (command + output summary) in tasks.md.
- **JUDGE (per task batch, minimum once per phase):** re-read the done-conditions cold. Verify each against the actual repo state by re-running commands — do not trust the Worker's notes. Accept (`✓ judged`) or reject with a written reason; rejected tasks return to the queue. The Judge also checks the guardrails below. You may not judge work in the same breath you wrote it — always re-derive from the file, not from memory.

### Phase discipline
Phases and exit gates are exactly `docs/autonomous-build-brief.md` §4 (P0–P7). Hard rules:
- A phase is complete only when every task in it is `✓ judged` AND the phase gate command block in tasks.md passes AND PROGRESS.md is updated.
- **Never weaken a gate, a test, or a done-condition to pass it.** If a gate cannot be met, shrink scope per the governing docs, log the decision in BUILD-LOG.md with doc citations, and adjust the done-condition transparently.
- **One phase per conversation.** At each gate: commit everything, update PROGRESS.md and BUILD-LOG.md, then END the session with a gate report. The next session starts fresh, reads PROGRESS.md + tasks.md + BUILD-LOG.md first (never rely on chat memory), and re-runs the previous gate's command block before starting new work. If any prior gate fails on re-run, fixing it is the first task.
- Within a session, if you notice yourself looping (same file edited 3+ times for the same failing test), STOP, write the loop's history to BUILD-LOG.md, and re-plan that task from the failing test outward.

### Multi-tasking and parallelism policy
Default is sequential — quality over speed. Parallel subagents/worktrees are permitted ONLY for tasks that are independent by construction and merge-trivial: the 11 visual primitive components in P4 (after ValueToken is judged as the reference implementation), fixture authoring across the six patterns in P0, and hostile-fixture cases in P2. Never parallelize anything touching `lens-contracts`, the layout engine, or the selection resolver — those are single-threaded by design. Every parallel result goes through the Judge before merge.

### Quality bars (the Judge enforces these on every acceptance)
- Zero hand-placed coordinates; zero LLM calls; zero runtime network calls beyond localhost; captions only from templates + trace params.
- Both Python runtimes byte-identical on every fixture.
- Every rendered element's color justified by a design-tokens.css semantic token per node kind; chrome uses skin tokens only.
- Unsupported constructs render the honest panel — tested, not assumed.
- Reduced-motion and full keyboard operation verified per interactive surface.
- Code that a senior reviewer would merge: typed, small modules, no dead code, no TODOs without a DEFERRED-ONLINE or FUTURE.md entry.

### Phase 0 additions (do these before anything else)
1. Apply and verify PATCH-001 if needed.
2. Install the rules files from PART B below into `.cursor/rules/`.
3. Create `tasks.md` (PART C format), `PROGRESS.md`, `BUILD-LOG.md`, `DEFERRED-ONLINE.md` (seed from brief §6).
4. Initialize git; commit convention: `P<phase>/<task-id>: <imperative summary>`; commit after every judged task; tag each gate `gate-P<n>`.
5. Then present your Phase 0 plan (task list with done-conditions) for my one-time approval. After I approve, proceed through all phases without waiting for me except at gates, where you post the gate report and continue unless I intervene within the session.

### When documents are silent
Make the smallest reasonable choice consistent with the authority order, record it in BUILD-LOG.md ("DECISION: … because … per <doc §>"), and continue. Do not stall. Do not gold-plate. If a correction to your behavior is ever needed, encode it as a rule in `.cursor/rules/` — chat corrections do not persist.

Produce the Phase 0 plan now.

---

## PART B — RULES FILES (agent installs these in Phase 0)

### `.cursor/rules/00-authority.mdc`
```
---
description: Document authority and conflict resolution
alwaysApply: true
---
Resolve any design conflict by document precedence: semantic-contract.md,
then visual-constitution.md + design-tokens.css, then foundation-plan.md,
then the 20-doc foundation set, then the HTML PoCs (look/feel only).
Do not invent semantics not present in these docs. When docs are silent,
make the smallest compliant choice and log it in BUILD-LOG.md, because
undocumented improvisation is how the grammar drifts.
```

### `.cursor/rules/10-determinism.mdc`
```
---
description: The determinism boundary
alwaysApply: true
---
Do not call any LLM, external API, or network resource at build time or
runtime; use the deterministic template system for all captions, because
everything on screen must be deterministically true or explicitly labeled.
Do not hand-write traces, graphs, or expected fixture values from
imagination — derive expected values by hand-analysis written into
fixture comments, and generate actual values only from the analyzer and
trace runtime, because fabricated evidence corrupts the golden suite.
```

### `.cursor/rules/20-contract.mdc`
```
---
description: Contract compliance for engine code
globs: ["packages/**"]
---
Emit and consume only the 12 node kinds, 5 binding roles, and 7 relation
types in semantic-contract.md; anything else is an `unsupported` region,
not a new kind, because the closed set is the product's honesty guarantee.
Never place coordinates by hand anywhere; all positions come from the
layout engine, because hand placement breaks artifact reuse (SC2).
Keep node IDs deterministic from kind + source position + ordinal.
```

### `.cursor/rules/30-visuals.mdc`
```
---
description: Visual constitution compliance
globs: ["packages/visual-grammar/**", "apps/web/**"]
---
Use design-tokens.css tokens only: semantic hues per node kind on canvas,
skin tokens on chrome; never introduce a new color or use a semantic hue
decoratively, because one hue must keep one meaning.
Values travel, structures stand still; loops keep a fixed frame with an
advancing marker; untaken branches dim to 0.35 opacity but never vanish;
state changes ghost the old value for one beat, because motion is proof.
Every animated surface ships back/step/play/scrub/reset and honors
prefers-reduced-motion, because the learner controls time.
```

### `.cursor/rules/40-process.mdc`
```
---
description: Long-run process discipline
alwaysApply: true
---
Work only on tasks that exist in tasks.md with a testable done-condition;
write the failing test before the implementation, because tests are the
iteration target that prevents drift.
Never weaken a test, gate, or done-condition to make it pass; shrink scope
per docs and log it instead, because a green lie is worse than a red truth.
At session start, read PROGRESS.md, tasks.md, and BUILD-LOG.md and re-run
the last gate block before new work, because chat memory does not persist.
Commit after every judged task as P<phase>/<task-id>: <summary>.
```

---

## PART C — tasks.md FORMAT (the shared ground truth)

```markdown
# tasks.md — single source of truth. Judged status only changes with evidence.

## Phase P1 — analyzer-python            [gate: pnpm test:analyzer && make pyodide-parity]
- [ ] P1-01 AST→graph for function/params/return
      done-when: `pytest packages/analyzer-python -k function` passes;
      fixture accumulator.graph.json matches byte-identically.
      status: todo | in-progress | done-pending-judge | ✓ judged | rejected(reason)
      evidence: <command + one-line result, filled by Worker>
      judge: <date + verdict + re-run confirmation, filled by Judge>
- [ ] P1-02 ...

## Gate block P1 (run all; paste outputs to PROGRESS.md)
1. pnpm test:analyzer            → expect: all pass
2. make pyodide-parity           → expect: 6/6 fixtures byte-identical
3. python tools/review_unseen.py → expect: 10/10 reviewed, log in BUILD-LOG
```
Rules: tasks are added only by the Planner hat at phase start (plus Judge rejections); done-conditions are commands with expected results; nothing is deleted, only status-changed — the file is also the audit trail.

## PART D — YOUR (RICHIE'S) TOUCHPOINTS

You are not babysitting; you have exactly these interactions:
1. **Once at start:** paste PART A into Plan Mode, approve the Phase 0 plan.
2. **At each gate (8 total):** read the gate report in PROGRESS.md (agent posts: gate commands + outputs, what shipped, decisions logged, next phase preview). Reply "proceed" or intervene. If you're away, the standing instruction in PART A lets it continue; your review is asynchronous.
3. **At P4 and P5 gates specifically:** open the app and *feel* it — these are the two gates where visual/motion quality can't be judged by tests alone. The smoke script in the brief's P7 also exists in miniature at these gates.
4. **At the end:** run the P7 smoke test, then replace the `PENDING-RICHIE` verification records lesson by lesson.
If the agent stalls or loops across sessions: don't debug in chat — add the correction as a rule file and restart the session; chat corrections don't persist, rules do.
```
