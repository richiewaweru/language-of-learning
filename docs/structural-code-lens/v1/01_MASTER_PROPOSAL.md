# Master Proposal — A Shared Derivable Visual Grammar

## Vision

Structural Code Lens should let a learner paste supported code and see a faithful, pedagogically useful representation of both structure and execution.

The system should not invent a symbol for every algorithm. It should establish a compact alphabet of stable primitives—values, state, collections, cursors, ranges, comparisons, branches, frames, returns, mutations, and references—and compose them into recognizable patterns.

## Product promise

> Paste supported code and Lens reveals its execution structure through one consistent visual language. Important semantic roles receive recognizable symbols, generic supported operations remain understandable, and unsupported behavior is marked honestly rather than guessed.

## One model, three learner projections

### Flow
Answers: **What is the shape and movement of this computation?**

Uses full symbols, spatial layout, motion, and emphasis.

### State
Answers: **What values exist now, what changed, and what shares identity?**

Uses compact badges, exact values, before/after changes, and frame grouping.

### Guided Trace
Answers: **What happened in this step, and which code caused it?**

Uses active source ranges, compact event glyphs, values involved, and recent event history.

### Graph Inspector
Answers: **What complete graph and runtime structure did the engine derive?**

Keeps the advanced node-and-edge view without making it the default learner experience.

## Architecture

```text
Source
  ↓
Parser / static analyzer
  ↓
Runtime trace
  ↓
Semantic normalization
  ↓
Pattern recognition
  ↓
Scene-step generation
  ↓
View projection
  ├─ Flow
  ├─ State
  ├─ Guided Trace
  └─ Graph Inspector
```

## Core grammar

### Persistent entities

- Value
- Binding
- Collection
- State / accumulator
- Cursor / index
- Active range
- Call frame
- Reference / alias
- Result port
- Generic entity
- Unsupported region

### Execution events

- Bind
- Read
- Select
- Move
- Calculate
- Compare
- Branch
- Repeat
- Update
- Insert
- Remove
- Swap
- Call
- Return
- Effect

### Composed patterns

- Accumulation
- Filtering
- Counting
- Linear search
- Binary search
- Two pointers
- Sliding window
- Stack and queue processing
- Recursion
- Divide and combine

Patterns influence layout, emphasis, and captions. They do not become atomic symbols unless composition repeatedly fails.

## Visual neatness rules

- One primary representation per semantic entity.
- Show only the active operation in detail.
- Keep inactive information visible but subdued.
- Avoid horizontal scrolling in default learner views.
- Keep complete graph complexity inside Graph Inspector.
- Use motion to communicate change, not decoration.
- Do not reveal a return result before the return event.

## Definition of success

- Supported code produces correct normalized entities and events.
- Every view is synchronized to the same step.
- The same semantic meaning keeps the same family and color.
- Flow communicates the computation without requiring Trace.
- State answers exact-value questions quickly.
- Guided Trace explains one causal event at a time.
- Generic supported operations remain distinct from unsupported behavior.
- Adding a symbol does not break earlier fixtures.
- The alphabet stays small while pattern coverage expands.

