# Wave A Corpus Report

## Results

| Gate | Result |
|---|---:|
| Positive corpus | A01–A15: 15/15 pass |
| Positive executions | 19/19 pass |
| Negative corpus | N01–N10: 10/10 pass |
| Renderer projection | 15/15 cases, 19/19 runs |
| Frozen graph locks | 15/15 exact replay |
| Frozen trace locks | 19/19 exact replay |
| Visual capture | A04, A05, A06, A10, A14, A15 captured from `/decode` |

## Judge checks

- A14 returns `13`; A15 returns index `3`.
- A04 emits `loop-exit`; A05 emits `loop-skip`.
- A06 emits two comparison evaluations for `75`, one for short-circuited `-1`, and two for `120`; unevaluated clauses do not emit events.
- A08 emits `indexed_selection` before `return_exit`.
- A10–A13 emit `builtin-evaluated` with `expansion: "collapsed"`; graph nodes carry the same marker and the UI shows the collapsed value.
- Every negative graph has zero nodes and zero relations; every negative trace has zero steps and no result.
- `/=` remains rejected atomically and no Wave B/C construct was added.

## Regression suite

The complete `pnpm test:all` gate covers analyzer, tracer, variations, patterns, scenes, fixture loader, journey, API-save, AI, lessons, interpreter parity, visual grammar, web tests, type checking, and linting. The final run is recorded as green in the branch history/review handoff.
