# ADR — View Responsibilities and Shared Architecture

**Status:** Proposed

## Problem

The current Trace surface combines source structure, graph edges, values, runtime tokens, and nested boundaries. It demonstrates derivation power but becomes crowded and overlaps with Flow and State.

## Decision

### Flow owns

- spatial computation structure;
- full semantic symbols;
- active movement;
- pattern-level layout;
- relationships among collection, current item, work, state, and result.

### State owns

- current and previous values;
- changed versus unchanged facts;
- variable roles;
- object identity and aliasing;
- grouping by call frame.

### Guided Trace owns

- active source line/range;
- current event type;
- values read and written;
- immediate causal explanation;
- compact recent-event history.

### Graph Inspector owns

- complete semantic graph;
- all edges and runtime structure;
- debugging and expert inspection;
- zoom, pan, minimap, and active-neighborhood focus.

## Shared contract

All views consume the same `SceneStep`. No view may independently reinterpret raw runtime events.

## Consequences

- Symbols have view-specific forms.
- Trace uses event glyphs rather than full Flow symbols.
- The existing graph is retained but moved behind an advanced mode.
- Layout and symbol rendering are separate systems.

