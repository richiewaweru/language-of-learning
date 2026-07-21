# Symbol Grammar and Asset Specification v1

## Construction policy

Use external icon libraries for ordinary UI controls and early prototyping. Freeze final semantic symbols as controlled internal SVG components.

### External icons are suitable for

- play, pause, reset;
- zoom and expand;
- navigation;
- settings;
- ordinary warning and information controls.

### Purpose-built Lens symbols are required for

- accumulator/state;
- cursor/index;
- active range;
- reference/alias;
- call frame;
- mutation;
- collection semantics;
- result port.

Loop, return, effect, comparison, and branch may start from familiar conventions but should be redrawn into the Lens geometry and motion rules.

## Semantic families

- **Data / blue:** value, binding, collection, generic operation.
- **State / gold:** accumulator, cursor, active range.
- **Flow / teal:** loop, traversal, repeat, movement.
- **Decision / magenta:** comparison, branch, path selection.
- **Work / purple:** mutation, frame, reference, nested execution.
- **Exit / green:** return, result, completion.
- **Effect / amber and limit / orange:** external effect and unsupported behavior.

## View-specific renderers

Each symbol may define:

- `flow` — full semantic form and motion;
- `state` — compact badge;
- `trace` — compact event glyph.

A symbol does not need to support every view.

## Required symbol states

- idle;
- active;
- selected;
- changing;
- completed;
- unsupported when relevant.

## Initial grammar

| Symbol | Type | Flow | State | Trace | Priority |
|---|---|---:|---:|---:|---|
| Value | Entity | Full | Badge | Read event | Existing |
| Binding | Entity | Full | Badge | Bind event | Existing |
| Collection | Entity | Full tray | Badge | Context only | Existing |
| State | Entity | Full container | Badge | Update event | Existing |
| Cursor | Entity | Moving caret | Badge | Select event | Next |
| Range | Entity | Bracket/highlight | Bounds | Narrow event | Next |
| Loop | Control | Full repeat structure | — | Repeat event | Existing |
| Comparison | Event | Comparator gate | — | Compare event | Next |
| Branch | Event | Full fork | — | Branch event | Existing |
| Mutation | Event | Visible transformation | Change marker | Update event | Next |
| Call frame | Entity | Workspace/frame | Group | Call event | Later |
| Reference | Entity | Shared target | Identity | Read/write identity | Later |
| Return | Event | Exit port | Result row | Return event | Existing |
| Effect | Event | Outward pulse | — | Effect event | Needs wiring |
| Generic operation | Fallback | Neutral block | — | Neutral event | Required |
| Unsupported | Fallback | Dashed region | Badge | Warning event | Existing |

## Admission test for a new symbol

A new symbol is accepted only when:

1. It appears frequently.
2. Its meaning is stable across contexts.
3. Existing composition is inadequate.
4. It can be derived reliably.
5. It improves learner understanding.
6. It remains visually distinct.
7. It has fixtures, tests, and a fallback.

## Fallback ladder

1. Exact semantic symbol.
2. Compatible composition.
3. Generic supported operation.
4. Unsupported only when the behavior itself cannot be verified.

## Concreteness

Version 1 ships with the current semi-abstract level. Concrete and abstract variants are added after the middle grammar is validated. Topology, color meaning, orientation, and motion meaning remain invariant across levels.

