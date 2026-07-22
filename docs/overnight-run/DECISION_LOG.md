# Decision Log

### DEC-001 — Treat supplied pack as the run contract
Date/time: 2026-07-21 22:43 EAT
Status: accepted
Context: The user requested an overnight implementation faithful to the supplied documentation.
Decision: Preserve the pack in the repository and trace implementation, tests, and handoff evidence to its requirements.
Why: The pack explicitly defines sequencing, correctness constraints, acceptance criteria, rerouting, and honest reporting.
Alternatives: Use the pack only as a loose brief; discard it after reading.
Consequences: Work will prioritize deterministic correctness and derivation proof before polish, and incomplete areas will remain visibly partial or deferred.
Files: docs/overnight-goal-pack/; docs/overnight-run/
Tests: Not applicable.
Follow-up: Audit every phase against the definition of done before closing the goal.

### DEC-002 — Keep AI execution facts server-owned
Date/time: 2026-07-21 23:18 EAT
Status: accepted
Context: Ask Lens must explain the current execution without trusting browser-supplied graphs, traces, values, branches, or support status.
Decision: AI endpoints accept source, arguments, learner context, step selection, and optional question only; the server rebuilds deterministic artifacts and constructs TeachingContext.
Why: This preserves the source → analyzer → runtime → semantic truth chain and prevents model-generated execution facts.
Alternatives: Send the current browser scene directly; let the provider analyze source independently.
Consequences: First requests have measurable verification latency, but model answers remain downstream of the verified engine and unsupported execution bypasses providers.
Files: apps/api/ai_runtime.py; apps/api/main.py; apps/web/src/lib/learner-ui/lesson/AskLens.svelte
Tests: tools/run_ai_tests.py; tests/e2e/decode-acceptance.spec.ts
Follow-up: Add caching keyed by source, arguments, and engine version if production latency requires it.

### DEC-003 — Correct early-return truth and its stale golden oracle
Date/time: 2026-07-21 23:30 EAT
Status: accepted
Context: Real-browser linear-search tests showed an inner return was recorded but execution continued to the function fallback.
Decision: Propagate the return signal out of `for` statements and update derived search goldens and the structural acceptance result from `-1` to `4`.
Why: Python returns immediately from the function; preserving the old oracle would preserve a runtime bug.
Alternatives: Special-case search rendering; change the pasted test input.
Consequences: Search traces are shorter and truthful; downstream scene actions were regenerated from the corrected trace.
Files: packages/trace-runtime/src/lol_trace/tracer.py; fixtures/search/; fixtures/structural-v1/cases.json
Tests: tools/run_trace_tests.py; pnpm verify:structural-lens; browser linear-search and early-return cases.
Follow-up: None.

### DEC-004 — Treat schema repair as a provider-neutral retry
Date/time: 2026-07-21 23:36 EAT
Status: accepted
Context: Live DeepSeek returned successful but fenced or type-invalid structured content.
Decision: Parse a single JSON object, validate it strictly, retry once with type-specific schema guidance, and fall back deterministically if validation still fails.
Why: Provider quirks must not leak into learner components or weaken the response contract.
Alternatives: Accept arbitrary prose; add DeepSeek-specific UI behavior.
Consequences: The live configured DeepSeek call now returns a valid grounded TeachingResponse without fallback; malformed prose still fails closed.
Files: apps/api/ai_runtime.py
Tests: tools/run_ai_tests.py; tools/run_ai_live_check.py
Follow-up: Run the full quantitative eval set across each production provider/model combination.
