# Phased Implementation Roadmap

## Phase 0 — Baseline and fixtures

### Work

- Capture current Flow, State, and Trace screenshots.
- Record current graph, trace, and step outputs for accumulation.
- Add deterministic fixtures and visual snapshots.

### Gate

Existing behavior can be reproduced after refactors.

---

## Phase 1 — Freeze responsibilities

- Approve the view ADR.
- Inventory every current element.
- Assign it to Flow, State, Guided Trace, or Graph Inspector.
- Remove ambiguous ownership before redesigning.

### Gate

Every UI element has one primary owner.

---

## Phase 2 — Shared semantic foundation

- Add semantic entities, events, snapshots, confidence, and `SceneStep`.
- Normalize current analyzer and runtime output.
- Preserve stable IDs, object identity, and source mappings.
- Make all views consume one shared step index.

### Gate

The accumulation example runs through the new layer without a meaningful visual regression.

---

## Phase 3 — Flow reference implementation

- Connect the selected cell to the current-item token.
- Animate the token into the loop body.
- Animate accumulator old → new.
- Delay the result until return.
- Reduce inactive contrast.
- Keep the scene inside its container.

### Gate

A learner can understand accumulation from Flow alone.

---

## Phase 4 — Symbol infrastructure

- Add symbol registry, tokens, resolver, fallbacks, and grammar versioning.
- Create isolated modules with Flow, State, and Trace renderers.
- Migrate existing symbols.

### Gate

Adding a dummy symbol requires one module, one registration, and tests—not edits across existing symbols.

---

## Phase 5 — First new symbols

Add in this order:

1. Cursor/index.
2. Comparison.
3. Mutation.
4. Active range.

### Gate

Linear search, simple swap, and binary-search structure can be expressed without new atomic symbols.

---

## Phase 6 — State redesign

- Role badges.
- Current and previous values.
- Change highlighting.
- Frame grouping.
- Alias identity.
- Expandable history.

### Gate

The current item, running state, latest change, and return status are obvious within seconds.

---

## Phase 7 — Guided Trace

- Step headline.
- Active source range.
- Current event explanation.
- Values read and written.
- Compact event glyph.
- Recent event trail.
- Guided and Graph modes.

### Gate

Guided Trace fits the container, avoids horizontal scrolling, and explains one primary event at a time.

---

## Phase 8 — Graph Inspector polish

- Active-neighborhood focus.
- Fade inactive nodes.
- Hide irrelevant edges by default.
- Zoom-to-fit and minimap.
- Expandable frames.

---

## Phase 9 — DSA expansion

Recommended order:

1. Accumulation.
2. Linear search.
3. Mutation and swap.
4. Binary search.
5. Two pointers.
6. Sliding window.
7. Stack and queue.
8. Ordinary function calls.
9. Recursion.
10. Divide and combine.

---

## Phase 10 — Concreteness fading

Pilot concrete and semi-abstract variants, measure comprehension, freeze approved invariants, then add abstract forms.

