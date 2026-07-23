# Unsupported Message Samples

| Code | Learner message |
| --- | --- |
| `UNSUPPORTED_BUILTIN_SHADOWING` | This pilot does not support shadowing built-in function names. Rename the parameter or local variable. |
| `UNSUPPORTED_ENUMERATE` | Enumerate is not yet supported in this pilot. Use an index-based range(len(values)) loop for now. |
| `UNSUPPORTED_TUPLE_UNPACKING` | Tuple unpacking and swaps are not yet supported. Use separate assignments for the current pilot. |
| `UNSUPPORTED_MEMBERSHIP` | Membership checks are not yet supported in this pilot. Write the search as an explicit loop and comparison. |
| `UNSUPPORTED_LIST_METHOD` | This list method is not yet supported. The current pilot supports indexing, indexed updates, and `append`. |
| `UNSUPPORTED_LIST_LITERAL_RETURN` | Returning a new list literal is not yet supported. Bind the list to a variable before returning it. |
| `UNSUPPORTED_NESTED_LIST` | Nested list access is not yet supported. The current pilot explains one-dimensional lists. |
| `UNSUPPORTED_HELPER_FUNCTION` | Helper-function calls are not yet supported. Lens currently explains one top-level function in a single call frame. |
| `UNSUPPORTED_TRUE_DIVISION_ASSIGNMENT` | True-division assignment (`/=`) is reserved for a later wave because it introduces float-state semantics. |

N11–N19 lock these messages and assert atomic rejection. Specific detection runs before generic fallback.
