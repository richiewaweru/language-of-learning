# Structural Code Lens — Implementation Pack

This pack turns the symbol-grammar direction into an execution-ready program.

## Product structure

- **Flow** — shows the shape and movement of computation.
- **State** — shows exact values, identity, and change.
- **Guided Trace** — shows which source code caused the current event.
- **Graph Inspector** — preserves the full derived graph for advanced inspection.

## Recommended order

1. Freeze view responsibilities.
2. Introduce a shared semantic entity/event model.
3. Migrate and polish the current accumulation Flow.
4. Add a symbol registry and view-specific renderers.
5. Add cursor, comparison, mutation, and range.
6. Redesign State.
7. Build Guided Trace and retain Graph Inspector.
8. Expand DSA pattern by pattern.
9. Add concreteness fading after validation.

## Non-negotiable rules

1. Analyzer and runtime emit facts, never visual instructions.
2. Every view consumes the same normalized `SceneStep`.
3. Symbols are isolated modules registered through one extension seam.
4. Layout and symbol rendering remain separate.
5. Generic supported behavior is different from unsupported behavior.
6. Algorithms are compositions, not new alphabet symbols.
7. Grammar and semantic model versions are explicit.

