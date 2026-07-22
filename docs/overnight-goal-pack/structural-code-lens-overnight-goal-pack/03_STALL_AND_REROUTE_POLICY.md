# Stall and Reroute Policy

Do not wait indefinitely.

## Time limits
- Missing credential: 20 minutes.
- External provider failure: 30 minutes.
- Browser setup issue: 45 minutes.
- One implementation dead end: 60 minutes.

Then log and reroute.

## Reroute rules

### Missing or invalid AI key
Verify environment loading, finish the integration with the mock provider, test HTTP adapters with mocked responses, record the blocker, and continue.

### Provider outage or quota
Capture safe evidence, verify retry and fallback, switch to mock, continue.

### Browser problem
Run integration/component tests, document the issue, continue other phases, return later.

### Existing unrelated test failure
Establish whether it predates the run, preserve evidence, do not hide it, and continue isolated work.

### Ambiguous design choice
Follow the agreed view responsibilities and choose the least destructive option. Log the choice.

### Unsupported engine behavior
Keep it unsupported. Never fake execution to make a demo pass.

## Priority while rerouted
1. Correctness
2. Tests
3. Hardcoding removal
4. Product polish
5. Mock AI integration
6. Documentation
7. Screenshots and reports

## Never
- commit keys;
- hardcode AI answers;
- hardcode learner results;
- disable correctness checks;
- hide unsupported behavior;
- claim unrun tests passed.
