# Nested-Loop Readiness Audit

## Findings

- Nested loop bodies are analyzed recursively and carry `contains` relations to their enclosing loop.
- Loop IDs are positional, stable, and unique, with ordinal collision suffixes.
- Runtime nesting uses an explicit loop stack after Wave A. `break` and `continue` target the top stack entry, so nearest-enclosing-loop control transfer is correct.
- Raw loop events identify their loop unambiguously.
- Semantic-scene cursor projection still chooses the first iterator binding for `loop_advance`, so inner and outer cursor focus is not guaranteed to be distinct.
- Nested-loop renderer density has no dedicated legibility gate yet.
- Loop lookup remains source-line based rather than AST-identity based, although ordinary multi-line Python loops resolve deterministically.

## Activation decision

**Wave B sorting cases are not safe to activate.** Before B03/B04, add a nested-loop audit fixture, bind cursor focus to the active loop's iterator, verify mixed nested `for`/`while` traces, and perform a density review. No such Wave B work is included here.
