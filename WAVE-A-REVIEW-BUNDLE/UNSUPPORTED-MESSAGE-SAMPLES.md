# Unsupported Message Samples

| Case | Code | Canonical learner message |
|---|---|---|
| N01 | `UNSUPPORTED_MULTIPLE_FUNCTIONS` | Multiple functions are not yet supported. Lens currently explains one top-level function at a time. |
| N02 | `UNSUPPORTED_RECURSION` | Recursion is not yet supported. Lens currently explains single-frame iterative programs. |
| N03 | `UNSUPPORTED_CLASS` | Classes and object fields are not yet supported. Lens currently focuses on variables, lists, loops, branches, and returns. |
| N04 | `UNSUPPORTED_DICTIONARY` | Dictionaries are not yet supported in this pilot. Use lists for the current supported collection model. |
| N05 | `UNSUPPORTED_COMPREHENSION` | Comprehensions are not yet expanded. Rewrite this as an explicit loop, branch, and append sequence. |
| N06 | `UNSUPPORTED_EXCEPTION_FLOW` | Exception control flow is not yet supported. |
| N07 | `UNSUPPORTED_IMPORT` | Imports and external libraries are outside the current deterministic Lens scope. |
| N08 | `UNSUPPORTED_GENERATOR` | Generators are not yet supported because suspended execution frames are not yet visualized. |
| N09 | `UNSUPPORTED_ASYNC` | Async execution is not yet supported. |
| N10 | `UNSUPPORTED_NESTED_FUNCTION` | Nested functions and captured scopes are not yet supported. |

Developer diagnostics are stored separately in analyzer rejection records as AST type plus source line and column. They are not used as learner copy.
