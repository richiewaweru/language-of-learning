# ADR-007: Foundational DSA Support Expansion and Semantic Contracts

**Status:** Proposed  
**Decision owner:** Richie  
**Applies to:** Analyzer, tracer, graph model, symbol registry, renderer, `/decode` scope strip, test corpus  
**Target:** First strong Lens proof of concept

## 1. Decision

Lens will expand support in three internal waves rather than treating the entire foundational-DSA feature set as one pilot gate.

- **Wave A — Pilot blockers:** close gaps that compose from the current grammar.
- **Wave B — Small new visuals:** add compact constructs that require limited new semantic and visual rules.
- **Wave C — New collection structure:** add nested collections and two-level selection.

The first learner pilot occurs after Wave A.

A construct is not considered supported unless:

1. the analyzer can represent its structure;
2. the tracer can verify its execution;
3. the renderer has a declared projection;
4. the final state is testable;
5. unsupported behavior does not leak into a partial visualization;
6. paired analyzer and trace tests exist.

## 2. Product principle

Lens is a faithful visual explanation system, not a Python compatibility layer.

Support is determined by representational honesty:

- **Natural support:** the construct maps directly to the existing visual grammar.
- **Collapsed verified support:** Lens verifies input/output behavior but explicitly does not expand internal steps.
- **Unsupported:** Lens cannot yet explain the construct faithfully.

Lens must prefer a clear unsupported state over a polished but misleading diagram.

## 3. Wave boundaries

### Wave A — Pilot blockers

- augmented assignment: `+=`, `-=`, `*=`, `//=`, `%=`;
- `break`;
- `continue`;
- Boolean guards: `and`, `or`, `not`;
- direct indexed returns;
- comparison returns;
- collapsed built-ins: `min`, `max`, `sum`, `abs`;
- exact learner-facing unsupported messages.

No new major teaching symbol is required. Wave A may add control-flow event types and a collapsed-operation treatment.

### Wave B — Small new visuals

- `enumerate`;
- controlled tuple unpacking;
- simple swaps;
- `elif` chaining;
- explicit `range(start, stop, step)`;
- membership checks using collapsed semantics;
- simple list-literal returns;
- `pop`, `insert`, `remove`;
- `/=` with explicit float semantics and stable float display;
- shift animations.

### Wave C — New structure

- nested list reads;
- nested list writes;
- matrix row/column focus;
- two-level selection paths;
- matrix traversal;
- simple DP-table updates.

## 4. Semantic model additions

### 4.1 New node kinds

#### `builtin-call`

Represents a verified built-in operation whose internal process is intentionally collapsed.

Required fields:

```ts
{
  kind: "builtin-call",
  builtin: "min" | "max" | "sum" | "abs",
  inputs: BindingRef[],
  output?: BindingRef,
  expansion: "collapsed",
  label: string
}
```

Rendering contract:

> Result verified. Internal steps not expanded.

#### `membership-check`

Represents `needle in collection` or `needle not in collection`.

```ts
{
  kind: "membership-check",
  operator: "in" | "not-in",
  needle: ValueRef,
  collection: BindingRef,
  result: boolean,
  expansion: "collapsed"
}
```

Lens must not render membership as a visible search loop unless an explicit pedagogical expansion mode is added later.

#### `tuple-binding`

Represents simultaneous binding from a fixed-length tuple-like source.

```ts
type TupleTarget =
  | BindingRef
  | {
      kind: "indexed-target",
      collection: BindingRef,
      index: ValueRef
    }

{
  kind: "tuple-binding",
  targets: TupleTarget[],
  sources: ValueRef[],
  evaluation: "capture-then-bind"
}
```

The right-hand side is captured before any target is updated.

#### `collection-construction`

Represents creation of a simple list literal during execution or return.

```ts
{
  kind: "collection-construction",
  collectionType: "list",
  items: ValueRef[],
  output: ValueRef
}
```

#### `list-mutation`

```ts
{
  kind: "list-mutation",
  mutation: "append" | "pop" | "insert" | "remove",
  collection: BindingRef,
  index?: ValueRef,
  value?: ValueRef,
  removedValue?: ValueRef,
  shift?: {
    direction: "left" | "right",
    fromIndex: number,
    count: number
  }
}
```

#### `nested-selection`

```ts
{
  kind: "nested-selection",
  rootCollection: BindingRef,
  path: ValueRef[],
  selectedValue?: ValueRef,
  mode: "read" | "write"
}
```

Wave C only.

## 5. New trace events

### Wave A

```ts
type LoopExitEvent = {
  type: "loop-exit",
  loopId: string,
  reason: "break",
  iteration: number
}

type LoopSkipEvent = {
  type: "loop-skip",
  loopId: string,
  reason: "continue",
  iteration: number
}

type BuiltinEvaluatedEvent = {
  type: "builtin-evaluated",
  builtin: "min" | "max" | "sum" | "abs",
  inputs: RuntimeValue[],
  result: RuntimeValue,
  expansion: "collapsed"
}
```

### Wave B

```ts
type BindingGroupCapturedEvent = {
  type: "binding-group-captured",
  values: RuntimeValue[]
}

type BindingGroupAppliedEvent = {
  type: "binding-group-applied",
  bindings: Array<{ name: string, value: RuntimeValue }>
}

type MembershipEvaluatedEvent = {
  type: "membership-evaluated",
  operator: "in" | "not-in",
  needle: RuntimeValue,
  collection: RuntimeValue[],
  result: boolean,
  expansion: "collapsed"
}

type ItemInsertedEvent = {
  type: "item-inserted",
  collection: string,
  index: number,
  value: RuntimeValue
}

type ItemRemovedEvent = {
  type: "item-removed",
  collection: string,
  index: number,
  value: RuntimeValue,
  cause: "pop" | "remove"
}

type ItemsShiftedEvent = {
  type: "items-shifted",
  collection: string,
  direction: "left" | "right",
  fromIndex: number,
  count: number
}
```

### Wave C

```ts
type NestedItemSelectedEvent = {
  type: "nested-item-selected",
  collection: string,
  path: number[],
  value: RuntimeValue
}

type NestedItemUpdatedEvent = {
  type: "nested-item-updated",
  collection: string,
  path: number[],
  before: RuntimeValue,
  after: RuntimeValue
}
```

## 6. Construct-specific contracts

### Augmented assignment

`x += y` is represented as:

1. read current `x`;
2. evaluate `y`;
3. apply the operator;
4. update `x`.

It is not treated as an opaque assignment.

### `break`

`break` emits a loop-exit event and transfers control to the first statement after the nearest enclosing loop.

It must not appear as an ordinary branch outcome alone.

### `continue`

`continue` emits a loop-skip event and transfers control to the next iteration of the nearest enclosing loop.

### Boolean expressions

Boolean expressions are decomposed into their comparisons and logical connectors.

Short-circuit behavior must be preserved in the trace.

### Indexed return

`return values[index]` performs:

1. index evaluation;
2. item selection;
3. return of the selected value.

### Comparison return

`return value > 0` performs comparison evaluation before return.

### Collapsed built-ins

`min`, `max`, `sum`, and `abs` may be executed and verified without visualizing their internal algorithm.

The UI must state that internal steps are collapsed.

### Membership

`target in values` is a collapsed semantic operation in the initial contract.

Lens must not imply that a learner has seen the internal search procedure.

### Swap

Both name swaps and controlled indexed swaps use capture-then-bind semantics.

Supported Wave B target forms:

```python
left, right = right, left
values[left], values[right] = values[right], values[left]
```

The analyzer must reject mixed or deeper target shapes that are not declared by `TupleTarget`.

A visual swap must show all right-hand values being captured before any name or indexed target is updated.

### List mutations

- `pop(index)` removes by index and may return the removed item.
- `remove(value)` removes the first matching value.
- `insert(index, value)` inserts and shifts subsequent values right.
- all shifts must be explicit in the trace and animation.

### True-division augmented assignment

`/=` is not a Wave A requirement.

When enabled in Wave B:

1. integer operands may produce a float result;
2. value nodes must use one stable float-display policy;
3. trace and snapshot equality must compare normalized numeric values rather than incidental string formatting;
4. corpus cases must declare expected float results explicitly.

### Exponentiation

`**` is not a pilot requirement.

If later enabled, the golden corpus is restricted initially to non-negative integer exponent cases.

## 7. Unsupported contract

Unsupported constructs must:

1. stop before producing a partial “verified” visualization;
2. identify the learner-facing concept, not only the AST node;
3. explain the current boundary;
4. suggest the nearest supported equivalent when safe and useful.

### 7.1 Canonical learner-facing message table

These strings are the single source of truth for negative-corpus assertions and product copy. Other documents must reference this table rather than restating variants.

| Code | Construct | Canonical message |
|---|---|---|
| `UNSUPPORTED_MULTIPLE_FUNCTIONS` | Multiple top-level functions | Multiple functions are not yet supported. Lens currently explains one top-level function at a time. |
| `UNSUPPORTED_RECURSION` | Recursion | Recursion is not yet supported. Lens currently explains single-frame iterative programs. |
| `UNSUPPORTED_CLASS` | Classes and object fields | Classes and object fields are not yet supported. Lens currently focuses on variables, lists, loops, branches, and returns. |
| `UNSUPPORTED_DICTIONARY` | Dictionaries | Dictionaries are not yet supported in this pilot. Use lists for the current supported collection model. |
| `UNSUPPORTED_COMPREHENSION` | Comprehensions | Comprehensions are not yet expanded. Rewrite this as an explicit loop, branch, and append sequence. |
| `UNSUPPORTED_EXCEPTION_FLOW` | Exception handling | Exception control flow is not yet supported. |
| `UNSUPPORTED_IMPORT` | Imports and external libraries | Imports and external libraries are outside the current deterministic Lens scope. |
| `UNSUPPORTED_GENERATOR` | Generators | Generators are not yet supported because suspended execution frames are not yet visualized. |
| `UNSUPPORTED_ASYNC` | Async execution | Async execution is not yet supported. |
| `UNSUPPORTED_NESTED_FUNCTION` | Nested functions | Nested functions and captured scopes are not yet supported. |

Example:

> Recursion is not yet supported. Lens currently explains single-frame iterative programs. Try an iterative version for this pilot.

Developer diagnostics may include AST details separately.


## 8. Acceptance rule

A wave is complete only when:

- every positive corpus example assigned to that wave passes;
- every negative corpus example returns the exact expected unsupported message;
- analyzer snapshots and trace goldens are paired;
- no new fallback to `generic-operation` hides a construct covered by this ADR;
- Richie reviews the wave as one bundle and signs it off;
- the wave is frozen before the next wave begins.

