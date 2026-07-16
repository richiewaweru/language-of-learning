# P-motion — Motion Layer Plan

**Status:** active (after `gate-F4`).
**Phase id:** P-motion (PM0–PM7).
**motionVersion:** `0.2`.

**Authority.** This plan is governed, in precedence order, by
`docs/semantic-contract.md`, then `docs/visual-constitution.md` +
`docs/design-tokens.css`, then `docs/foundation-plan.md`, then the 20-doc
foundation set, then the HTML PoCs (look/feel only). P-motion introduces **no
new semantics**: every value it moves, every state it morphs, and every port it
exits already exists in the semantic graph, trace schema, and scene actions.
Motion is a *rendering* of contract truth, never a new source of truth.

---

## 0. Why this phase exists

Phases P0–P7 and the corrective run F0–F4 delivered a deterministic pipeline:
analyzer → trace → pattern → scene, plus a static-first renderer that shows the
correct final state and steps through trace bindings. What the renderer does
**not** yet do is *move* — tokens jump, state cells replace their contents, and
returns simply appear. The visual constitution (§4) defines ten motion laws
precisely because "consistency is part of correctness": a value that teleports
teaches a different (wrong) mental model than a value that travels along a
meaningful path.

P-motion makes the ten motion laws (M1–M10) mechanical and testable **without**
letting animation code leak into scenes, lessons, or the analyzer. All timing
and easing live in one runtime layer; scenes stay declarative (`SC1`).

---

## 1. Scope

**In scope**
- A single runtime token/animation layer that consumes existing `Scene.steps[].actions`.
- Deterministic mapping from each `Action` type to a motion law (M1–M10).
- A `MotionState` machine that is a pure function of `(scene, stepIndex, reducedMotion)`.
- `prefers-reduced-motion` support: instant, two-beat static jumps (M10).
- Back/forward/play/pause/scrub/reset wired through the existing `Selection` pathway (M9).
- The motion-contract (`docs/motion-contract.md`) and this plan.

**Out of scope (see §11 Non-goals)**
- Any change to the analyzer, tracer, pattern detector, or scene builder output shape.
- Any per-lesson or per-scene animation code.
- Any new node kind, event type, action type, or color.

---

## 2. Motion laws (M1–M10)

Verbatim from `visual-constitution.md §4`, each with its P-motion obligation.
These are the **iteration target**: every law maps to at least one action type
and at least one gate check.

| # | Law | P-motion obligation |
|---|---|---|
| M1 | Preserve object identity | A moved value keeps one DOM/token identity across steps; never destroy-and-recreate. Identity is keyed by deterministic `tokenId` (§8). |
| M2 | Transform rather than replace | State cells morph in place (`change_state`); the old repr becomes a translucent ghost, the new repr grows from the same cell. |
| M3 | Move values along meaningful paths | `move_value` animates from `fromNode` anchor to `toNode` anchor along the layout edge, never a straight teleport across unrelated regions. |
| M4 | Show old and new state | `change_state` renders old (ghost, `--dim-opacity`) and new simultaneously for one beat before settling (`T2`: trace carries `oldRepr`+`newRepr`). |
| M5 | Fade skipped paths instead of deleting them | `evaluate` false-branches fade to `--dim-opacity`; they remain on canvas (M6 skeleton stable). |
| M6 | Keep the skeleton spatially stable | Layout is fixed for the whole scene; only tokens/ghosts/focus move. Loop frames, function boundary, and branch forks never reflow between steps. |
| M7 | Reveal progressively | Nodes not yet reached render dim; each step promotes exactly one primary focus (`SceneStep.focus` — one primary per M6). |
| M8 | Avoid decorative motion | Only the six action types animate. No easing flourishes, parallax, or attention-grabbing motion without a semantic cause. |
| M9 | Provide back, forward, play, pause, scrub, reset | The motion layer exposes all six controls; every control resolves to a `stepIndex` on `Selection`. BACK is a true inverse (`T1`). |
| M10 | Respect reduced motion | Under `prefers-reduced-motion: reduce`, transitions are `none`; state changes are instant two-beat static (old→new snap, no travel). |

---

## 3. Action → law → motion mapping

The six declarative action types (semantic-contract §7) are the **only** things
that animate. Each maps to a fixed motion treatment. The runtime owns timing;
scenes carry no timing (`SC1`).

| Action | Fields | Motion law(s) | Runtime treatment |
|---|---|---|---|
| `move_value` | `repr, fromNode, toNode` | M1, M3 | One persistent token travels `from → to` along the layout edge; `--move-token` easing. |
| `advance_item` | `loop, itemIndex` | M6, M7 | Loop track advances the highlighted slot; frame stays fixed; new item token enters. |
| `evaluate` | `branch, result` | M3, M5 | Taken path lights in `branch-magenta`; untaken path fades to `--dim-opacity` (kept, not deleted). |
| `change_state` | `cell, oldRepr, newRepr` | M2, M4 | Old repr becomes ghost; new repr morphs in same double-bordered cell; both visible one beat. |
| `exit_return` | `repr, port` | M1, M3 | The result token travels to the `exit-green` return port and settles. |
| `pulse_effect` | `node` | M8 | A single outward pulse on the effect node; no residual motion. |

Timing tokens (from `design-tokens.css`, constitution §4):
`--move-token: transform .7s cubic-bezier(.4,0,.2,1), opacity .35s`;
`--move-line: transform .38s ease`; `--move-focus: opacity .25s, filter .25s`;
autoplay beat `--t-autoplay: 1600ms`; bounds `--t-min: 150ms`, `--t-max: 900ms`.

---

## 4. MotionState

`MotionState` is a **pure derivation** of `(scene, stepIndex, reducedMotion)`.
It is never a second source of truth: given the same inputs it produces the same
output (determinism rule). It describes *what should currently be on screen and
where*, so the renderer can diff between two `MotionState`s and animate the delta.

```ts
interface MotionState {
  stepIndex: number;                 // current step (drives Selection.stepIndex)
  reducedMotion: boolean;            // snapshot of prefers-reduced-motion

  // Per-token placement — one entry per live value token (M1 identity).
  tokens: Record<TokenId, {
    repr: string;
    atNode: string;                  // layout node the token currently rests on
    ghost: boolean;                  // true = translucent previous state (M2/M4)
  }>;

  // Focus + de-emphasis (M5, M6, M7).
  focus: string[];                   // node ids; first is primary (M6)
  dimmed: string[];                  // faded skipped paths / not-yet-reached nodes

  // In-flight transition to render between prev and current step.
  transition: {
    from: number;                    // previous stepIndex (BACK-safe; T1)
    actions: Action[];               // the step's declarative actions
  } | null;

  line: number;                      // code-view sync (SY3)
}
```

Rules:
- **MS1.** `MotionState` derives only from committed contract data (`scene.steps`,
  trace-backed reprs). It invents no reprs, positions, or transitions.
- **MS2.** `reducedMotion === true` ⇒ `transition` collapses to an instant apply
  (old snaps to new, ghost shown as a static two-beat, no travel). (M10)
- **MS3.** BACK to step *n* re-derives `MotionState(scene, n)` from scratch — it
  never "undoes" by replaying inverse tweens. This makes BACK a true inverse (`T1`).
- **MS4.** `tokens` are keyed by deterministic `TokenId` (§8) so identity is
  preserved across steps (M1) and survives re-analysis of unchanged code (`N2`).

---

## 5. RuntimeTokenState (companion, deferred implementation)

`RuntimeTokenLayer` (the DOM/SVG layer that owns real element handles and CSS
transitions) consumes `MotionState` and produces `RuntimeTokenState` — the live,
imperative bookkeeping of on-screen token elements. **PM0 documents its contract
only; PM4 implements it.** It is intentionally *not* built in the contract phase.

```ts
interface RuntimeTokenState {
  // Live element handle per token id; created lazily, reused across steps (M1).
  elements: Record<TokenId, { el: unknown; lastNode: string }>;
  playing: boolean;                  // autoplay running (M9)
  settled: boolean;                  // all transitions finished for current step
}
```

`RuntimeTokenState` holds no facts — only element identities and playback
bookkeeping. If it disagrees with `MotionState`, `MotionState` wins and the
layer re-syncs.

---

## 6. LayoutEdge

Motion paths (M3) follow **layout edges**, not arbitrary straight lines. A
`LayoutEdge` is derived from the scene's computed `layout` + the graph relation
between the two nodes; it is never hand-authored (`SC2`).

```ts
interface LayoutEdge {
  fromNode: string;
  toNode: string;
  fromAnchor: { x: number; y: number };   // computed anchor on source node
  toAnchor:   { x: number; y: number };    // computed anchor on target node
  relation: "reads" | "writes" | "feeds" | "returns" | "iterates" | "mutates";
}
```

- **LE1.** Anchors come from the layout engine; per-scene coordinates are forbidden.
- **LE2.** `relation` selects the arrow grammar (constitution "Arrow meanings"):
  solid horizontal = data movement, curved = repetition, dashed = dependency, fork = conditional.

---

## 7. Sub-phases (PM0–PM7)

Each sub-phase has a testable done-condition. Write the failing test first; never
weaken a gate to make it pass — shrink scope and log it in `BUILD-LOG.md`.

### PM0 — Contract phase (this phase) *(active, after gate-F4)*
Documentation + reference PoC only. No runtime code.
- **Deliverables:** `docs/P-MOTION.md`, `docs/motion-contract.md`,
  `reference/README.md`, recreated `reference/function-component-poc.html`,
  BUILD-LOG entry.
- **Done-when:** motion-contract fully specifies M1–M10, the `SceneAction` union,
  `LayoutEdge`, `MotionState` + `RuntimeTokenState`, and the determinism rules;
  reference PoC demonstrates token travel through a function boundary and honors
  reduced motion; no `RuntimeTokenLayer`/tween code exists yet.
- **Gate:** docs cross-check against semantic-contract §7 + constitution §4; PoC
  opens and steps with reduced-motion toggling to instant jumps.

### PM1 — MotionState derivation
Pure `deriveMotionState(scene, stepIndex, reducedMotion): MotionState`.
- **Done-when:** unit tests prove MS1–MS4; identical inputs → identical output
  (byte-stable); BACK re-derivation equals forward-then-back.
- **Gate:** `test:motion-state` green; determinism snapshot check.

### PM2 — Deterministic tokenId
Implement `tokenId` derivation (§8) from `(fromNode, toNode, repr, stepIndex-origin)`.
- **Done-when:** re-analysis of unchanged code yields identical token ids; a
  value that reads its own prior state keeps one id across the loop (M1).
- **Gate:** `test:token-id` green; ids stable across two analyzer runs.

### PM3 — LayoutEdge + anchors
Derive `LayoutEdge` anchors from the existing layout engine (no new layout).
- **Done-when:** every `move_value`/`exit_return` in the six fixtures resolves to
  a valid edge with computed anchors; no hand-placed coordinates (`SC2`/`LE1`).
- **Gate:** `test:layout-edges` green over accumulate/count/filter/transform/search/guard.

### PM4 — RuntimeTokenLayer (tween renderer)
Implement the DOM/SVG layer consuming `MotionState` → `RuntimeTokenState`.
- **Done-when:** each action type animates per §3; skeleton stays stable (M6);
  ghosts show old+new (M4); one token identity per value (M1).
- **Gate:** visual regression on fixture scenes; reduced-motion path renders instant.

### PM5 — Controls integration (M9)
Wire back/forward/play/pause/scrub/reset through `Selection.stepIndex`.
- **Done-when:** every control resolves to a step; BACK is a true inverse (`T1`);
  scrub jumps to arbitrary step via re-derivation (MS3).
- **Gate:** `test:motion-controls` green; ScenePlayer parity with existing controls.

### PM6 — Reduced-motion + accessibility (M10)
Two-beat static under `prefers-reduced-motion`; keyboard + SR descriptions.
- **Done-when:** transitions become `none`; state changes snap old→new; every
  step has a static final state and a text alternative.
- **Gate:** `test:reduced-motion` green; axe/keyboard smoke pass.

### PM7 — Integration + hardening
Motion layer live across Learn lessons + Decode; full regression.
- **Done-when:** all lessons and Decode render motion from scenes with no
  per-lesson animation code; `pnpm test:all` + motion gates green; build exit 0.
- **Gate:** `gate-P-motion`; screenshots + reduced-motion + back-step evidence in BUILD-LOG.

---

## 8. Deterministic tokenId

`tokenId` must be a pure function of contract data so that identity (M1) is
stable and survives re-analysis (`N2`).

```
tokenId = `${originNode}:${repr}`      // origin = node where the value first appears
```

- The token that carries a value keeps its id as it moves (`move_value`) and as
  it feeds a state change (`change_state`) — the ghost inherits the *old* id, the
  new repr takes a new id derived from the state cell + new repr.
- No random ids, no incrementing counters seeded by wall-clock; determinism rule
  forbids anything non-derivable from source/trace.

---

## 9. Definition of done (phase-level)

P-motion is done when **all** hold:
1. M1–M10 are each satisfied by at least one implemented action treatment and
   verified by at least one standing test.
2. Scenes, lessons, analyzer, tracer, and pattern detector are **byte-unchanged**
   by P-motion (motion is pure rendering; `SC1` holds — no animation code in scenes).
3. `MotionState` is a deterministic pure function (MS1–MS4) with snapshot tests.
4. `tokenId` is deterministic and stable across re-analysis.
5. Reduced-motion renders instant two-beat static everywhere (M10).
6. All six controls work; BACK is a true inverse (M9/`T1`).
7. `pnpm test:all` plus motion gates (`test:motion-state`, `test:token-id`,
   `test:layout-edges`, `test:motion-controls`, `test:reduced-motion`) are green;
   production build exits 0.
8. `gate-P-motion` evidence (screenshots initial/mid/final, reduced-motion,
   back-step) recorded in `BUILD-LOG.md`.

---

## 10. Risks

- **R-M1 Animation code leaking into scenes.** Mitigation: `SC1` enforced by a
  gate that greps scenes/lessons for timing/easing and fails on any hit.
- **R-M2 Non-deterministic token identity.** Mitigation: PM2 tokenId derivation +
  cross-run stability test.
- **R-M3 Skeleton reflow between steps.** Mitigation: layout is computed once per
  scene; PM3/PM4 assert no layout delta across steps (M6).
- **R-M4 Reduced-motion regressions.** Mitigation: PM6 standing test; reduced
  path is the *first* path validated, not an afterthought.

---

## 11. Non-goals

- No new node kinds, event types, action types, relations, or colors — the eight
  semantic hues and six action types are the closed set.
- No LLM/network/external call at build or runtime — captions stay deterministic
  templates (determinism rule; `SC3`).
- No per-lesson or per-scene animation code, ever (`SC1`).
- No changes to analyzer/tracer/pattern/scene output shape or ids.
- No hand-placed coordinates or per-lesson layout tuning (`SC2`/`LE1`).
- No recursion, `while`, multiple functions, or any construct outside the v0.1
  subset — P-motion animates only what already parses and traces.
- The reference PoC is a *motion-quality* reference, not production architecture
  and not a spec for component structure.
