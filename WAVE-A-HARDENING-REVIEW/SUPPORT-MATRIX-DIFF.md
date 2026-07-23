# Support Matrix Diff

The matrix now states the full actual pilot boundary instead of listing only newly introduced constructs.

## Verified Wave A boundary

The analyzer, tracer, and renderer are marked `verified` where structural, renderer, corpus, and browser evidence agree. This includes program shape, positional parameters, scalar literals, literal-only list assignment, assignments and reassignment, arithmetic, comparisons, conditionals, named-collection and range loops, while loops, list index reads/writes, append, `len`, `print`, returns, Boolean operators, `break`, `continue`, and collapsed `min`/`max`/`sum`/`abs`.

## Explicit exceptions

- `builtin-shadowing`: `unsupported` in analyzer, tracer, and renderer with the canonical message.
- `range-three-arg`: analyzer and tracer `verified`; renderer `experimental` because explicit start/stop/step exposure remains deferred.

## Deferred boundary

Enumerate, tuple unpacking, swaps, membership, list removal methods, list-literal returns, `/=`, nested lists, helper functions, recursion, dictionaries, comprehensions, classes, exceptions, imports, generators, and async remain unsupported. No deferred feature was activated.
