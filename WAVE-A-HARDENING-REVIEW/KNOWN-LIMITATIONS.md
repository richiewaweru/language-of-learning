# Known Limitations

- List-literal support is deliberately limited to assignments containing supported scalar literals, including supported unary-negative numeric literals.
- Expression-containing list items reject atomically; general collection construction is not enabled.
- List-literal returns remain unsupported.
- Three-argument `range` executes in analyzer/tracer but renderer exposure remains experimental.
- Enumerate, tuple unpacking/swaps, membership, `pop`/`insert`/`remove`, nested lists, helper calls, recursion, dictionaries, comprehensions, classes, exceptions, imports, generators, async, and `/=` remain outside Wave A.
- Full positive P01–P09 goldens were not introduced; structural assertions and browser evidence protect the hardening behavior without rewriting existing locks.
- The A06 renderer does not explicitly mark the short-circuited Boolean clause as unevaluated. Step counts and the single comparison event prove execution truth, but the Judge gate requires a learner-visible unevaluated treatment before pilot acceptance.
