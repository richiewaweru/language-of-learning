# Autonomous Build Brief — Language of Learning v0.1
**Purpose:** the complete instruction pack for a long-running agent (e.g. Claude Code) to build the functional app locally, start to finish, without mid-run human input. Richie inspects the product at the end.

---

## 1. Inputs the agent receives (attach ALL of these to the run)

```
docs/  (the governing set — authority order matters)
  1. semantic-contract.md          ← highest authority on data
  2. visual-constitution.md        ← highest authority on rendering
  3. design-tokens.css             ← the palette + skin, ready to import
  4. foundation-plan.md            ← architecture & reuse strategy
  5. language-of-learning-foundation-docs/ (all 20 files: charter, scope,
     ADRs, security, AI boundary, testing, roadmap, WBS)
  6. programming-primitive-map.md  ← atlas (teaching reference only)
reference/
  structural-code-lens-poc.html    ← target look & feel (skin, layout, tabs)
  function-component-poc.html      ← target motion quality (token travel)
```

**Conflict rule for the agent:** if any two documents disagree, precedence is semantic-contract > visual-constitution > foundation-plan > the 20-doc set > PoCs. Three known deltas are pre-resolved: binding roles include `constant` (5 roles); relations include `mutates` but NOT `triggers` (deferred); the semantic palette is the 8-hue set in design-tokens.css, not the PoC's 5.

## 2. Mission statement (paste verbatim into the task)

> Build the v0.1 "Language of Learning" app as a local monorepo per the attached
> governing docs. Deliver: (1) six lens packages passing golden-fixture tests;
> (2) the Decode surface — paste a supported Python function, see synchronized
> CODE/SHAPE/TRACE/PATTERN views with learner-paced stepping, transfer check,
> and honest unsupported panel; (3) the four-lesson "How loops build results"
> pathway as verified JSON content rendered by the same engine; (4) a full test
> suite (contract, golden, hostile-sandbox, visual states) green; (5) BUILD-LOG.md
> and DEFERRED-ONLINE.md. Everything must run locally with `pnpm install && pnpm dev`
> after a single documented setup script. Do not stop at the first working screen;
> stop when the Definition of Done (§7) is fully checked.

## 3. Environment & local-only constraints

- **Monorepo with pnpm workspaces; all internal packages linked via `workspace:*`.**
  No npm publishing, no private registry. (Publishing is a DEFERRED-ONLINE item.)
- **Pyodide vendored locally** (downloaded once into `vendor/pyodide/` by the setup
  script, or npm-installed `pyodide` package) — the app must not depend on a CDN
  at runtime. Record exact version.
- **No hosted database in v0.1-local.** Persistence for saved analyses/lessons =
  SQLite via the FastAPI app (or JSON file store if simpler), behind a repository
  interface so Postgres can swap in later. Alembic-ready models, SQLite dialect.
- **No auth in v0.1-local.** Single implicit local user. Auth is deferred-online.
- **No LLM calls during the build or in the running app.** All captions come from
  the deterministic template system (contract SC3). The AI side-channel is stubbed
  behind an interface (`ExplanationProvider`) with a deterministic fake, so wiring
  a real model later is one adapter. This also makes the whole build reproducible.
- **No telemetry endpoint.** Events write to a local NDJSON file through the same
  event interface the hosted version will use.
- Node 20+, Python 3.12, pnpm 9. Everything else installs via the setup script.

## 4. Build order (phases with hard exit gates — do not proceed on red)

Follows the roadmap docs; engine before platform is non-negotiable.

**P0 — Skeleton & contracts.** Monorepo, TS config, Vitest, lint, `lens-contracts`
(Zod schemas: graph, trace, pattern, scene, selection, lesson), JSON-schema export,
golden fixture *scaffolding* for all six patterns (source + expected graph + trace
+ pattern + scene actions — expected values hand-derived now, committed as files).
*Gate: schemas compile; fixture loader validates fixture shape.*

**P1 — analyzer-python.** Pure Python package: AST → semantic graph per contract
(12 kinds, 5 binding roles, 7 relations, deterministic IDs, unsupported regions).
Runs under CPython (pytest) AND Pyodide (same wheel). Graph inspector debug page.
*Gate: six golden fixtures produce expected graphs byte-identically in both runtimes;
10 additional unseen beginner snippets reviewed against hand expectations in the log.*

**P2 — trace-runtime.** Instrumented execution, full binding snapshots per step,
closed event set, sandbox per contract T4 (no net/fs/eval/introspection; time,
step, and memory caps; literal-only args). Hostile fixture suite (at least:
infinite loop, huge allocation, eval attempt, import attempt, dunder escape).
*Gate: canonical traces match fixtures; every hostile fixture is contained and
reported honestly.*

**P3 — lens-patterns.** Rule engine + six deterministic rules. Positive AND
negative fixtures (e.g. a loop that looks like ACCUMULATE but isn't).
*Gate: precision on fixture set = 100%; no candidate/LLM path exists.*

**P4 — lens-scenes + visual-grammar.** Layout engine (one function, ≤3 nesting
levels, zero hand-placed coordinates, overlap validator), scene builder
(trace → declarative actions), Svelte components for all 11 primitives +
controls, implementing visual-constitution motion laws and design-tokens.css.
Selection resolver (line↔nodes one-to-many, column/nesting priority).
*Gate: accumulator AND filter slices fully interactive from pasted variations;
reduced-motion works; back-stepping restores exact prior state; screenshot set
(initial/mid/final × both examples) saved to BUILD-LOG assets.*

**P5 — Decode surface.** Editor (CodeMirror or Monaco), sample-call input,
analyze, four synchronized views, unsupported panel, deterministic transfer
check per analysis (template-generated from the graph: "which line is X"),
save/load via local API, NDJSON events.
*Gate: the §7 learner journey completes end-to-end on 3 fresh snippets.*

**P6 — Content & Learn.** Lesson schema in contracts; the four-lesson
"How loops build results" pathway authored as JSON (blocks reference sceneIds
and canonical examples — no copied markup); static-first lesson pages (scenes
pre-rendered to their initial state; Pyodide loads only on "run it yourself");
machine-check script = the verification checklist (parse, execute, expected
results, nodes validate, scenes reference real nodes, captions verified,
keyboard, reduced motion, static fallback). Human verification recorded as a
signed-off JSON record with `verified_by: "PENDING-RICHIE"` placeholders.
*Gate: all four lessons pass machine checks; pathway navigable start to finish.*

**P7 — Hardening & handoff.** Full test run, `pnpm build` production build,
README quickstart (≤10 commands from clone to running app), BUILD-LOG.md
(what was built, deviations, judgment calls with doc citations),
DEFERRED-ONLINE.md finalized, and a 10-item smoke-test script Richie runs
on first open.

## 5. Guardrails for the agent (the failure modes to refuse)

- **Scope:** v0.1 = 12 node kinds, 6 patterns, the documented Python subset,
  4 lessons. If a capability isn't in scope docs, write it to DEFERRED-ONLINE
  or FUTURE.md — never implement "while I'm here."
- **No LLM in the deterministic path** — including during the build: the agent
  must not hand-write "example traces"; traces come from the runtime or the
  build fails honestly.
- **No hand-placed coordinates** anywhere (contract SC2). If layout fails on a
  fixture, fix the layout engine or shrink the supported shape — log the choice.
- **Unsupported ≠ broken:** hitting subset limits must render the honest panel,
  not throw. Test this path explicitly.
- **When docs are silent,** make the smallest reasonable choice, record it in
  BUILD-LOG with rationale, and continue — do not stall, do not gold-plate.
- **Never weaken a gate to pass it.** A red gate means fix the code or shrink
  scope per docs; both are logged.

## 6. DEFERRED-ONLINE.md (seeded now; agent appends)

Things intentionally left for after local completion:
1. Hosting (web app + API) and domain; static Learn pages on CDN.
2. Postgres (swap SQLite via the repository interface) + managed backups.
3. Auth (Google OAuth per TBG patterns) + user ownership of saved analyses.
4. Real LLM adapter behind `ExplanationProvider` (+ model routing/telemetry
   patterns extracted from TBG) for explain-mode and caption leveling.
5. Telemetry sink (NDJSON → real endpoint) + dashboards.
6. npm publishing of lens packages (if ever needed externally).
7. Pyodide from CDN with local fallback; bundle-size pass.
8. Share links (needs hosting + IDs), SEO for Learn pages.
9. Repository import (explicitly out of v0.1 by ADR/scope docs).
10. Human verification sign-off: Richie replaces every `PENDING-RICHIE`
    verification record after inspecting each lesson — nothing is "published"
    until then, per the lifecycle.

## 7. Definition of Done (the agent checks every box before stopping)

Learner journey, locally: paste supported function → honest analysis →
synchronized code/shape/trace/pattern → step forward AND backward → values,
branches, state changes visible per motion laws → pattern named with relatives
→ transfer check answered with feedback → save and reload the analysis →
open the loops pathway → complete all four lessons → static pages readable
with JS animation off.
Engineering: all gates green · `pnpm test` green including hostile suite ·
both runtimes byte-identical on fixtures · fresh-clone quickstart works ·
BUILD-LOG and DEFERRED-ONLINE complete · zero LLM calls · zero network calls
at runtime beyond localhost.

---

**Estimated shape of the run:** P0–P4 is ~80% of the difficulty (layout engine
is the known hardest part — constrain per docs, don't generalize). If the run
must be split, the only safe split points are the phase gates.
