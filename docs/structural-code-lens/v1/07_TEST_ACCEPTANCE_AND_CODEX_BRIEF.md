# Test, Acceptance, and Codex Implementation Brief

## Required tests

### Semantic contract

- stable unique IDs;
- valid roles/events;
- source ranges;
- object identity;
- deterministic normalization;
- explicit confidence;
- valid fallbacks.

### Fixtures

- accumulation;
- count;
- find maximum;
- linear search;
- early return;
- array update;
- swap;
- binary search;
- two pointers;
- ordinary function call;
- alias mutation;
- simple recursion.

### Visual regression

Capture idle, active, selected, changing, completed, generic, unsupported, and responsive states.

### Compatibility

When adding a symbol, all prior fixtures and scene resolutions must still pass.

## UX acceptance

### Flow

- no internal horizontal scrolling;
- current item visibly comes from the collection;
- state transitions animate;
- result appears only at return.

### State

- current and previous values are obvious;
- changed rows are easy to spot;
- aliases are understandable;
- layout remains responsive.

### Guided Trace

- one primary event at a time;
- active source is obvious;
- values involved are readable;
- recent history gives context;
- full graph is not the default.

## Learning pilot

Measure next-step prediction, explanation accuracy, time to locate state, confusion rate, and transfer to unseen but structurally similar code.

---

# Copy-ready Codex brief

Implement the Structural Code Lens visual-language refactor in phases.

## Objective

Create one shared semantic entity/event model powering Flow, State, Guided Trace, and Graph Inspector. Preserve deterministic fidelity. Do not add visual instructions to the analyzer or runtime.

## Rules

1. Analyzer/runtime emit facts only.
2. All views consume the same `SceneStep`.
3. Symbols are isolated registered modules.
4. Layout is separate from symbol rendering.
5. Generic supported and unsupported are distinct.
6. Algorithms are composed patterns, not atomic symbols.
7. Adding a symbol must not require editing existing symbols.
8. Preserve accumulation behavior during the foundation refactor.

## Sequence

1. Add accumulation fixtures and snapshots.
2. Implement semantic entities, events, snapshots, and shared scene steps.
3. Migrate current views to the shared step index.
4. Polish Flow: selected-cell link, item movement, accumulator morph, delayed return, inactive contrast.
5. Add registry, tokens, fallback policy, grammar versioning, and view-specific renderers.
6. Migrate existing symbols.
7. Add cursor, comparison, mutation, and range.
8. Redesign State around roles and before/after values.
9. Add Guided Trace and preserve Graph Inspector.
10. Run contract, fixture, compatibility, and visual tests after every phase.

Do not begin recursion or concreteness fading during this run. Keep the project runnable after every phase.

