# Golden Fixtures

Six pattern fixtures for v0.1. Each directory contains:

- `source.py` — supported Python source
- `call.json` — literal-only sample arguments
- `expected.graph.json` — hand-analyzed semantic graph (schema-valid in P0)
- `expected.trace.json` — hand-analyzed trace
- `expected.pattern.json` — pattern hit
- `expected.scene-actions.json` — declarative scene actions per step
- `ANALYSIS.md` — derivation notes (not validated by loader)

Expected values are hand-derived for P0 shape validation. Graph byte parity gated in P1; trace byte parity gated in P2.

## Hostile fixtures (`fixtures/hostile/`)

Sandbox containment cases (not loaded by the six-pattern shape test):

| Directory | Threat | Expected construct |
|---|---|---|
| infinite_loop | step cap | `step_limit` |
| huge_allocation | oversized literal args | `collection_size` |
| eval_attempt | dynamic eval | `eval` |
| import_attempt | module import | `import` |
| dunder_escape | dunder introspection | `dunder` |

## Patterns

| Directory | Pattern | Notes |
|---|---|---|
| accumulate | ACCUMULATE | Canonical PoC accumulator |
| count | COUNT | +1 update, iterator unread in update |
| filter | FILTER | Loop + branch + append |
| transform | TRANSFORM | Loop appends mapped values |
| search | SEARCH | Early return in loop |
| guard | GUARD | Head guard + `rate` constant binding |
