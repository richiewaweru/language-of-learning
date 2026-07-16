# Golden Fixtures

Six pattern fixtures for v0.1. Each directory contains:

- `source.py` — supported Python source
- `call.json` — literal-only sample arguments
- `expected.graph.json` — hand-analyzed semantic graph (schema-valid in P0)
- `expected.trace.json` — hand-analyzed trace
- `expected.pattern.json` — pattern hit
- `expected.scene-actions.json` — declarative scene actions per step
- `ANALYSIS.md` — derivation notes (not validated by loader)

Expected values are hand-derived for P0 shape validation. Byte-identical runtime matching is gated in P1–P4.

## Patterns

| Directory | Pattern | Notes |
|---|---|---|
| accumulate | ACCUMULATE | Canonical PoC accumulator |
| count | COUNT | +1 update, iterator unread in update |
| filter | FILTER | Loop + branch + append |
| transform | TRANSFORM | Loop appends mapped values |
| search | SEARCH | Early return in loop |
| guard | GUARD | Head guard + `rate` constant binding |
