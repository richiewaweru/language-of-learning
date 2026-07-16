# reference/

Look-and-feel reference assets. These are **not architecture** and **not
production behavior**. They inform the *visual grammar* and *motion quality*
only. Authority for anything real lives in `docs/semantic-contract.md`,
`docs/visual-constitution.md`, and `docs/design-tokens.css` — reference PoCs are
lowest precedence (look/feel only) and never define semantics.

## Assets

### `structural-code-lens-poc.html`
- **Kind:** structural / layout look reference.
- **Use it for:** the paper/ink neo-brutalist skin, panel + tab chrome, the
  four-view arrangement (code / structural map / execution+state / pattern), and
  overall spatial rhythm.
- **Do NOT use it for:** architecture. It hardcodes two demo examples with a
  fake detector and hand-placed SVG coordinates; the real system computes layout
  and derives everything from the deterministic pipeline. Treat its structure as
  inspiration, not a spec.

### `function-component-poc.html`
- **Kind:** motion quality reference (token travel through a function boundary).
- **Recreated:** 2026-07-16, because the original asset was unavailable
  (see BUILD-LOG "reference gap (P0-01)"). This is a faithful *recreation* of the
  intended motion quality, not the lost original.
- **Use it for:** the *feel* of a value token traveling call entry → parameter →
  operation → state-cell morph (ghost) → return exit, and how
  `prefers-reduced-motion` collapses travel to instant jumps.
- **Do NOT use it for:** production behavior or component architecture. Real
  motion is driven by `MotionState` derived from `Scene` actions per
  `docs/motion-contract.md`; this file fakes the sequence with a single hardcoded
  example and a Step button. It is a motion-quality reference only.
