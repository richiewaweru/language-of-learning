# CURSOR-RUN: Lens Foundational DSA Expansion

## Mission

Implement the Lens support expansion in controlled waves while preserving representational honesty.

The first delivery target is **Wave A only**. Do not begin Wave B or Wave C until Wave A passes its review gate.

## Governing documents

Treat these as authoritative, in order:

1. `01-ADR-semantic-contract.md`
2. `03-visual-constitution-amendment.md`
3. `02-golden-corpus.md`
4. `04-implementation-runbook.md`

When code and documents conflict, stop and record the conflict rather than inventing semantics.

## Non-negotiable invariants

- A construct lands in analyzer and tracer together, or in neither.
- No partial verified visualization may appear after unsupported behavior is detected.
- Declared semantic constructs must not silently fall back to `generic-operation`.
- Built-ins and membership are collapsed, with internal steps explicitly marked unexpanded.
- `break` and `continue` are control-flow events, not ordinary branch labels.
- Boolean traces preserve short-circuit behavior.
- Every positive construct gets a graph snapshot and trace golden.
- Every out-of-scope construct gets an exact-message negative test.

## Wave A scope

Implement only:

- learner-facing unsupported messaging;
- augmented assignment on simple names;
- `and`, `or`, `not` in verified guards and returns;
- direct indexed returns;
- comparison returns;
- `break`;
- `continue`;
- collapsed `min`, `max`, `sum`, `abs`.

Do not implement in this run:

- enumerate;
- tuple unpacking;
- swaps;
- membership;
- pop/insert/remove;
- list-literal returns;
- nested lists;
- helper functions;
- recursion;
- dictionaries;
- comprehensions;
- classes;
- exceptions;
- imports;
- generators;
- async.

## Required workflow

### Phase 1 — Repository audit

Locate and summarize:

- statement dispatcher;
- expression resolver;
- analyzer node model;
- trace event model;
- symbol registry;
- generic-operation fallback;
- unsupported-state handling;
- `/decode` scope copy;
- existing snapshot/golden test infrastructure;
- nested-loop tracing behavior;
- loop ID creation and disambiguation;
- nearest-enclosing-loop resolution for `break` and `continue`;
- cursor focus behavior for nested loops.

Produce a short implementation map before editing.

Wave A does not require new nested-loop features, but the audit must record whether Wave B sorting cases are safe to activate.

### Phase 2 — Tests first

Add or scaffold Wave A corpus fixtures.

During active Wave A development, assert structural invariants rather than byte-exact full graph snapshots. Freeze full graph and trace goldens only at the Wave A review gate.

Add negative tests for:

- recursion;
- multiple top-level functions;
- classes;
- dictionaries;
- comprehensions;
- exception handling;
- imports;
- generators;
- async;
- nested functions.

Use ADR §7.1 as the only canonical learner-facing message source and freeze both error codes and exact messages.

### Phase 3 — Unsupported path

Implement stable error codes, learner copy, developer diagnostics, and the no-partial-verified-output guarantee.

### Phase 4 — Wave A constructs

Implement in this order:

1. augmented assignment;
2. Boolean logic and short-circuit tracing;
3. indexed returns;
4. comparison returns;
5. break and continue;
6. collapsed built-ins.

For each item:

- update analyzer;
- update tracer;
- update graph/event types;
- add paired tests;
- update support matrix;
- verify renderer projection;
- run the relevant corpus subset.

### Phase 5 — Integration

Run the complete Wave A corpus.

Generate:

- pass/fail report;
- graph snapshot diff;
- trace golden diff;
- unsupported-message report;
- remaining limitations.

## Judge acceptance criteria

Wave A is accepted only when:

1. every Wave A corpus case passes;
2. every negative case emits the exact expected learner message;
3. binary search and iterative Fibonacci complete with verified final results;
4. break emits `loop-exit`;
5. continue emits `loop-skip`;
6. short-circuited Boolean clauses are not traced as evaluated;
7. built-ins are marked collapsed;
8. indexed returns show selection before return;
9. no Wave A construct is rendered as unsupported or silently generic;
10. existing verified behavior does not regress.

## Scope strip copy

Update `/decode` to say:

> Lens currently explains single-function programs built from variables, arithmetic, comparisons, Boolean guards, loops, lists, state updates, selected built-ins, and returns. It does not yet expand recursion, helper functions, objects, dictionaries, comprehensions, exceptions, imports, generators, or async code.

Keep developer-specific AST details out of this learner-facing strip.

## Final deliverable

Return one review bundle containing:

- files changed;
- support matrix;
- corpus results;
- visual snapshots;
- trace samples;
- unsupported-message samples;
- known limitations;
- recommendation: accept or reject Wave A.

Do not proceed to Wave B automatically.

