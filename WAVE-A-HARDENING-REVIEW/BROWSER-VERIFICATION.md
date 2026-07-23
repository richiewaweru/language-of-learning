# Browser Verification

- Browser: Codex in-app browser
- Candidate: `e929828092d329c83fb0d0b74a3ce50cd0c52af0`
- Route: `/decode`
- Isolated local verification origin: `http://127.0.0.1:4173`
- API origin: `http://127.0.0.1:8001`

Each supported case was inspected in Flow, State, Guided Trace, and Graph Inspector before the named evidence view was captured. Console errors for the isolated `4173` origin: none.

| Case | Input | Expected | Observed rendered behavior | Screenshot |
| --- | --- | --- | --- | --- |
| A04 break | `[4, 7, 9], 7` | `True` | 11/11 steps; result `True`; Guided Trace recent events end with loop `Exit` | `SCREENSHOTS/A04-break.png` |
| A05 continue | `[3, -2, 4, -1]` | `7` | 19/19 steps; result `7`; Guided Trace recent events end with `Skip` | `SCREENSHOTS/A05-continue.png` |
| A06 Boolean | `75` | `True` | 4/4 steps and both comparisons rendered | no separate screenshot |
| A06 Boolean | `-1` | `False` | 3/3 steps; only the first comparison rendered, proving the second clause was unevaluated | `SCREENSHOTS/A06-short-circuit-negative.png` |
| A06 Boolean | `120` | `False` | 4/4 steps and both comparisons rendered | no separate screenshot |
| A08 indexed return | `[2, 4, 6, 8, 10]` | `6` | 4/4 steps; result port `6` | `SCREENSHOTS/A08-indexed-return.png` |
| A10 collapsed built-in | `[3, 9, 4]` | `9` | built-in event shows `max`, value `9`, expansion `collapsed` | `SCREENSHOTS/A10-collapsed-builtin.png` |
| A14 Fibonacci | `7` | `13` | 25/25 steps; State shows `previous=8`, `current=13`, `next_value=13`, result `13` | `SCREENSHOTS/A14-fibonacci.png` |
| A15 binary search | `[2, 4, 7, 9, 12], 9` | `3` | 18/18 steps; State shows `left=3`, `right=4`, `middle=3`, result `3` | `SCREENSHOTS/A15-binary-search.png` |
| P01 literal list | no arguments | `[1, 2, 3]` | 2/2 steps; State collection and result both show `[1, 2, 3]` | `SCREENSHOTS/P01-literal-list.png` |
| P06 shadowing | `[1, 2, 3]` | atomic rejection | exact learner message; no playback, tabs, flow, trace, graph, or result | `SCREENSHOTS/P06-builtin-shadowing.png` |
| enumerate | `[1, 2, 3]` | atomic rejection | exact learner message; no playback, tabs, flow, trace, graph, or result | `SCREENSHOTS/N-enumerate.png` |

The screenshots show rendered UI state, not API payloads.

## Judge finding

A06 proves short-circuit execution structurally: input `-1` has three steps and one rendered comparison, while `75` and `120` have four steps and two comparisons. However, the renderer does not explicitly dim or label `score <= 100` as unevaluated. The Judge plan requires that explicit visual distinction, so browser verification is not sufficient for pilot acceptance.

Replacement viewport captures for A08 and A15 show the result port/state evidence without the full-page stitching artifact present in the first captures.
