# Lens Implementation Runbook

## 1. Delivery model

Work proceeds by wave, not by isolated syntax feature.

Each wave follows:

```text
contract
→ analyzer
→ tracer
→ renderer
→ corpus
→ product copy
→ review gate
→ freeze
```

No layer may independently mark a construct supported.

## 2. Preparation

### 2.1 Approve ADR

Richie reviews:

- wave boundaries;
- node kinds;
- trace events;
- collapsed built-in contract;
- membership contract;
- unsupported-message contract;
- acceptance rule.

No implementation begins until unresolved semantic questions are marked explicitly.

### 2.2 Create corpus fixtures

Create directories such as:

```text
tests/corpus/wave-a/
tests/corpus/wave-b/
tests/corpus/wave-c/
tests/corpus/negative/
```

Each case contains during active wave development:

```text
source.py
input.json
expected-structure.json
expected-events.json
expected-result.json
```

`expected-structure.json` asserts required node kinds, key relations, and forbidden fallbacks without freezing the entire graph.

At the wave review gate, generate and freeze:

```text
expected-graph.json
expected-trace.json
```

Frozen full snapshots become regression locks for later waves.

### 2.3 Audit nested-loop readiness

Before Wave B, explicitly confirm:

- nested `for` and `while` tracing works end-to-end;
- every loop receives a stable unique `loopId`;
- cursor focus distinguishes inner and outer loops;
- nearest-enclosing-loop resolution is correct for `break` and `continue`;
- trace events cannot accidentally target the wrong loop;
- nested-loop renderer density remains legible.

Add at least one nested-loop audit case before activating sorting corpus cases.

### 2.4 Add a support matrix

Maintain one machine-readable source of truth:

```ts
{
  construct: string,
  wave: "A" | "B" | "C" | "later",
  analyzer: "unsupported" | "experimental" | "verified",
  tracer: "unsupported" | "experimental" | "verified",
  renderer: "unsupported" | "experimental" | "verified",
  corpusCases: string[]
}
```

The UI scope strip should derive from this matrix where practical.

## 3. Wave A implementation order

### Task A1 — Unsupported messaging

Do this first so all subsequent failures are safe and legible.

Deliver:

- stable error codes;
- learner-facing messages;
- developer diagnostics;
- no partial verified graph after rejection;
- negative corpus fixtures.

### Task A2 — Augmented assignment

Implement analyzer and tracer together.

Acceptance:

- `+=`, `-=`, `*=`, `//=`, `%=` on simple names;
- graph shows read → calculate → update;
- final binding verified;
- unsupported for complex targets unless separately declared.

### Task A3 — Boolean guards

Implement:

- `and`;
- `or`;
- `not`;
- short-circuit trace events;
- comparison composition.

Acceptance:

- unevaluated clauses remain distinguishable;
- analyzer graph and runtime order agree.

### Task A4 — Indexed and comparison returns

Implement:

- direct subscript return;
- comparison return;
- no generic fallback hiding selection or comparison.

### Task A5 — Break and continue

Implement nearest-loop semantics.

Acceptance:

- correct behavior in nested branch/loop combinations;
- explicit loop-exit and loop-skip events;
- no events emitted for skipped statements.

### Task A6 — Collapsed built-ins

Implement:

- `min`;
- `max`;
- `sum`;
- `abs`.

Acceptance:

- input and result verified;
- no fake internal steps;
- collapsed label present in graph metadata and UI.

### Task A7 — Wave A integration

Run all Wave A and negative corpus cases.

Review together:

- linear search;
- counting;
- accumulation;
- break;
- continue;
- Boolean guards;
- iterative Fibonacci;
- binary search.

## 4. Wave A pilot gate

Wave A passes only when:

- all assigned positive cases pass;
- exact unsupported copy passes;
- no analyzer/tracer disagreement remains;
- Richie reviews corpus outputs and visuals in one sitting;
- findings are logged as either pilot blockers or post-pilot improvements.

The pilot begins here.

## 5. Wave B implementation order

### Task B1 — Range exposure and elif

Low-risk preparation for richer algorithms.

### Task B2 — Enumerate and tuple binding

Add coordinated paired bindings.

Restrict initially to fixed two-target forms.

### Task B3 — Swap semantics

Implement capture-then-bind.

Test scalar swaps and indexed list swaps separately.

### Task B4 — Membership

Implement as collapsed semantic operation.

Do not desugar into a visible loop in the main trace.

### Task B5 — Collection construction

Support simple list literals in assignments and returns where item expressions are already verified.

### Task B6 — Pop, insert, remove

Implement method-specific mutation events and shifts.

Visual review is mandatory before declaring verified.

### Task B7 — True-division assignment

Add `/=` with the float semantic contract from ADR §6:

- normalized numeric equality;
- stable display formatting;
- explicit float corpus cases.

### Task B8 — Wave B corpus

Activate:

- enumerated search;
- bubble sort;
- selection sort;
- insertion sort;
- membership;
- list mutation examples.

## 6. Wave C implementation order

### Task C1 — Nested path model

Add a generic path representation before renderer work.

### Task C2 — Nested reads

Implement `matrix[row][column]`.

### Task C3 — Nested writes

Implement path-specific mutation.

### Task C4 — Matrix visuals

Add outer-to-inner focus and row/column path.

### Task C5 — Wave C corpus

Activate matrix traversal, grid counting, and controlled DP-table cases.

## 7. Review format

For each wave, produce one review bundle:

```text
support matrix diff
corpus pass report
visual snapshots
trace samples
unsupported-message samples
known limitations
decision log
```

Richie signs off the wave as:

- accepted;
- accepted with post-wave fixes;
- rejected with named blockers.

Once accepted, the wave corpus becomes regression-locked.

## 8. Definition of done

A construct is done only when:

- syntax acceptance is intentional;
- semantic node is declared;
- trace events are declared;
- final values are verified;
- visual projection is readable;
- unsupported neighboring forms fail safely;
- docs and scope strip are current;
- corpus coverage exists;
- no hidden generic fallback remains.

