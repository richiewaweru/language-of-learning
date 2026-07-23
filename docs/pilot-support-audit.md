# Four-Lesson Pilot Engine Support Audit

| Lesson | Required constructs | Previous status | Pilot action |
| --- | --- | --- | --- |
| Values and Variables | module assignment, literals, binary expressions, dependency bindings | Verified | Reused module execution and added canonical fixture assertions. |
| Functions and Return Values | definition, module call, parameters, local binding, return, outer result binding | Partial | Added a single deterministic authored-function call frame inside module execution, including parameter and result bindings. |
| Conditions and Branches | comparison, if/else, selected route, return | Function-only verified; module call partial | Reused branch semantics inside the new authored call frame and verified `>` / `>=` boundary mutations. |
| Loops over Lists | list argument, for-loop, iterator, nested condition, state update, return | Function-only verified; module call partial | Reused loop semantics inside the authored call frame and extended principled scene nesting from three to four levels. |

Modulo, equality, and the combined `number % 2 == 0` condition are covered by the
pilot engine test. Arbitrary helper functions, recursion, imports, classes, and
other constructs still follow the existing atomic unsupported path.
