# Known Limitations

- A07 uses the corpus-authorized `not len(values) == 0` form; general empty-list truthiness is not declared verified.
- Augmented assignment is limited to simple names and `+=`, `-=`, `*=`, `//=`, `%=`. `/=` remains Wave B.
- `min`, `max`, and `sum` accept one list input; `min`/`max` require a non-empty list. `abs` accepts one non-Boolean numeric input.
- Built-in internals are intentionally collapsed; the trace verifies only input and result and never invents traversal/comparison steps.
- Nested-loop cursor focus and density are not Wave B-ready, as recorded in the audit.
- All Wave B/C constructs remain unsupported, including enumerate, tuple binding, swaps, membership, list-literal returns, list removal/insertion methods, nested lists, helpers, recursion, dictionaries, comprehensions, classes, exceptions, imports, generators, and async.
- Sandbox step, wall-time, and memory limits are unchanged.
