# Phase 0 Baseline and Regression Matrix

## Classification

`must-preserve` means intentional Decode behavior. `approved-fix` is a safety
change in this extraction. `preserve-absent` means Phase 1 must not add the feature.

| ID | Behavior | Classification | Automated evidence |
|---|---|---|---|
| D01 | Default Decode pack renders | must-preserve | `decode-acceptance.spec.ts` |
| D02 | Module assignments visualize deterministically | must-preserve | `decode-module-execution.spec.ts` |
| D03 | Function source and sample input visualize | must-preserve | `decode-acceptance.spec.ts` |
| D04 | Edit and rerun replaces dependent values | must-preserve | `decode-session-regression.spec.ts` |
| D05 | Flow, State, Guided Trace, Graph Inspector switch in one session | must-preserve | existing Decode suites |
| D06 | Start, Back, Next, and End change the selected frame | must-preserve | existing Decode suites and isolation suite |
| D07 | Unsupported constructs show an atomic unverified state | must-preserve | existing Decode suites |
| D08 | Syntax/API failure removes previous verified output | approved-fix | `decode-session-regression.spec.ts` |
| D09 | Refresh starts from the default pack | preserve-absent | `decode-session-regression.spec.ts` |
| D10 | Leave and return starts from the default pack | preserve-absent | `decode-session-regression.spec.ts` |
| D11 | Decode exposes no Reset control | preserve-absent | capabilities and Decode controller |
| D12 | Mobile/tablet layout has no page overflow | must-preserve | existing visual matrices |
| D13 | Supported journeys have no uncaught console/request failures | must-preserve | existing Decode suites |
| D14 | Ask Lens receives current source, arguments, and step | must-preserve | `decode-acceptance.spec.ts` |

## Manual browser checklist

- Open `/decode` at desktop, tablet, and mobile widths.
- Run a supported module and function, visit all four views, and step both ways.
- Edit source and sample input, rerun, and confirm all visible artifacts change.
- Run unsupported and invalid input and confirm no verified panel survives.
- Refresh, leave, and revisit Decode; confirm the default pack returns.
- Confirm keyboard reachability and labels for editor, input, run, tabs, and playback.
- Confirm no severe console errors or failed product requests.

Screenshots produced by the established suites remain under
`tests/e2e/__screenshots__` and `artifacts/module-execution/screenshots`.
