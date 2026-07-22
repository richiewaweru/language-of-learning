# Browser Acceptance Plan

For every case:
1. Open `/decode`.
2. Replace editor source.
3. Enter arguments.
4. Click Visualize.
5. Confirm Flow.
6. Step execution.
7. Inspect State.
8. Inspect Guided Trace.
9. Inspect Graph Inspector.
10. Ask Lens to explain the step.
11. Ask Lens to explain the process.
12. Capture screenshots.
13. Verify no horizontal overflow.

## Programs
- renamed accumulation;
- count with condition;
- linear search;
- early return;
- array update;
- swap;
- binary search;
- generic `double`;
- unsupported dictionary comprehension.

## Assertions
Supported cases: no error, expected result, non-empty trace, all views render, result only after return, views agree, correct symbols, no overflow.

Unsupported case: no fabricated trace, unsupported shown, AI clearly states it cannot verify execution.
