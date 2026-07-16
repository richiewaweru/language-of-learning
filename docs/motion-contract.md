# Motion Contract — Structural Code Lens

**Status:** governing document for the motion layer (P-motion).
**motionVersion:** `0.2`.

**Authority & alignment.** This contract sits **under**
`docs/visual-constitution.md` (which defines the motion laws) and
`docs/semantic-contract.md` (which defines the graph, trace, actions, and
scenes it renders). It adds **no new semantics**: it only specifies how existing
`Scene` actions are turned into deterministic, law-abiding motion. Where this
document and the two above disagree, they win (document precedence).

The renderer's motion layer may only animate what this contract defines; a scene
that requires motion outside this contract is, by definition, UNSUPPORTED.

---

## 1. Motion laws (M1–M10)

The ten laws are law (constitution §4). Each is paired with the action(s) that
carry it and the mechanical obligation the motion layer must satisfy.

| # | Law | Carried by | Obligation |
|---|---|---|---|
| M1 | Preserve object identity | `move_value`, `exit_return` | One token element per value, keyed by deterministic `tokenId`; never destroy-and-recreate across steps. |
| M2 | Transform rather than replace | `change_state` | State cell morphs in place; contents are never swapped by deletion. |
| M3 | Move values along meaningful paths | `move_value`, `evaluate`, `exit_return` | Travel follows a `LayoutEdge` anchor-to-anchor; never a teleport across unrelated regions. |
| M4 | Show old and new state | `change_state` | Old repr (ghost, `--dim-opacity`) and new repr both visible for one beat. |
| M5 | Fade skipped paths instead of deleting them | `evaluate` | Untaken branch fades to `--dim-opacity`; it stays on canvas. |
| M6 | Keep the skeleton spatially stable | all | Layout is computed once per scene; no reflow between steps; one primary focus per step. |
| M7 | Reveal progressively | all | Not-yet-reached nodes render dim; each step promotes exactly one primary focus. |
| M8 | Avoid decorative motion | `pulse_effect` + all | Only the six actions animate; no motion without a semantic cause. |
| M9 | Provide back, forward, play, pause, scrub, reset | controls | Every control resolves to a `stepIndex`; BACK is a true inverse (`T1`). |
| M10 | Respect reduced motion | all | Under `prefers-reduced-motion`, transitions are `none`; changes are instant two-beat static. |

---

## 2. SceneAction union

The closed set of declarative actions (semantic-contract §5). The motion layer
handles exactly these; any other shape is a contract violation. Scenes carry no
timing or easing (`SC1`).

```ts
type SceneAction =
  | { type: "move_value";   repr: string; fromNode: string; toNode: string }
  | { type: "advance_item"; loop: string; itemIndex: number }
  | { type: "evaluate";     branch: string; result: boolean }
  | { type: "change_state"; cell: string; oldRepr: string; newRepr: string }
  | { type: "exit_return";  repr: string; port: string }
  | { type: "pulse_effect"; node: string };
```

Each variant's motion treatment is fixed in `P-MOTION.md §3` and must not vary
per lesson or per scene.

---

## 3. LayoutEdge

Motion paths (M3) follow computed layout edges, never hand-authored lines
(`SC2`).

```ts
interface LayoutEdge {
  fromNode: string;
  toNode: string;
  fromAnchor: { x: number; y: number };   // computed by the layout engine
  toAnchor:   { x: number; y: number };
  relation: "reads" | "writes" | "feeds" | "returns" | "iterates" | "mutates";
}
```

- **LE1.** Anchors are derived from the scene's computed `layout`; per-scene
  coordinates are forbidden.
- **LE2.** `relation` selects arrow grammar (constitution "Arrow meanings").

---

## 4. MotionState + RuntimeTokenState

`MotionState` is a pure derivation of `(scene, stepIndex, reducedMotion)`. It is
the single description of *what is on screen and where*; the renderer diffs two
`MotionState`s to animate the delta.

```ts
interface MotionState {
  stepIndex: number;
  reducedMotion: boolean;
  tokens: Record<string /* tokenId */, {
    repr: string;
    atNode: string;
    ghost: boolean;         // translucent previous state (M2/M4)
  }>;
  focus: string[];          // node ids; first is primary (M6)
  dimmed: string[];         // faded skipped / not-yet-reached (M5/M7)
  transition: { from: number; actions: SceneAction[] } | null;
  line: number;             // code-view sync
}

interface RuntimeTokenState {
  elements: Record<string /* tokenId */, { el: unknown; lastNode: string }>;
  playing: boolean;
  settled: boolean;
}
```

`RuntimeTokenState` holds only live element handles and playback bookkeeping —
never facts. When it disagrees with `MotionState`, `MotionState` wins.

---

## 5. Rules

- **MC1 — tokenId is deterministic.** `tokenId = `${originNode}:${repr}``. It is a
  pure function of contract data (origin node + repr); no counters, no
  wall-clock, no randomness. Re-analysis of unchanged code yields identical
  token ids (semantic-contract `N2`), so identity (M1) is stable.
- **MC2 — fold over 0..N steps.** `MotionState` for step *n* is a deterministic
  fold over `scene.steps[0..n]`; step *n* is re-derived from scratch, never by
  replaying inverse tweens. This makes BACK a true inverse (`T1`) and scrub a
  jump to any *n*.
- **MC3 — no lesson animation code.** No timing, easing, keyframes, or transition
  values may appear in scenes, lessons, or content. The runtime motion layer
  owns 100% of timing (`SC1`). A gate greps content for motion code and fails on
  any hit.
- **MC4 — layout is stable (M6).** Layout is computed once per scene; there is no
  layout delta between steps. Only tokens, ghosts, and focus/dim change.
- **MC5 — reduced motion is a first-class path (M10).** Under
  `prefers-reduced-motion: reduce`, `transition` collapses to an instant apply:
  old snaps to new as a two-beat static (show old, show new), no travel.
- **MC6 — determinism.** No LLM, network, or external call at build or runtime;
  captions remain deterministic templates (`SC3`). Nothing on screen is invented.

---

## 6. Relationship to the semantic contract

| Semantic contract concept | Motion contract consumer |
|---|---|
| `Scene.steps[].actions` (§5/§7) | drives `MotionState.transition.actions` |
| `Scene.steps[].focus` (one primary, M6) | `MotionState.focus` |
| `Scene.steps[].line` (SY3) | `MotionState.line` |
| trace `oldRepr`/`newRepr` (`T2`) | `change_state` ghost (M4) |
| full `bindings` snapshot per step (`T1`) | BACK re-derivation (MC2) |
| deterministic node ids (`N2`) | `tokenId` stability (MC1) |
| computed `layout` (`SC2`) | `LayoutEdge` anchors (§3) |

The motion contract never expands the semantic contract; it only renders it.
