# Codex Master Prompt

Work in the `language-of-learning` repository.

Read all artifacts in this pack before editing.

Your mission is to polish the learner product, prove that fresh pasted programs generate correct views through semantic derivation, integrate an environment-driven model-agnostic AI teaching layer, test as a real user in the browser, remove product hardcoding, and leave a complete morning audit.

## Rules
1. Preserve deterministic truth.
2. Never replace derivation with hardcoded output.
3. Never weaken unsupported behavior.
4. AI interprets verified facts; it never creates execution facts.
5. Provider-specific code stays in adapters.
6. Keep the repository runnable after each phase.
7. Use the browser as a real learner.
8. Maintain decision, progress, blocker, and morning-review logs.
9. If blocked, follow the reroute policy and continue.
10. Never print or commit API keys.

## Required log paths
Create from templates:
- `docs/overnight-run/DECISION_LOG.md`
- `docs/overnight-run/PROGRESS_LOG.md`
- `docs/overnight-run/BLOCKERS.md`
- `docs/overnight-run/HARDCODING_AUDIT.csv`
- `docs/overnight-run/MORNING_REVIEW.md`
- `docs/overnight-run/TEST_MATRIX.csv`

## Execution
Follow `02_EXECUTION_ORDER.md`.
Begin by recording the branch and commit, running baseline checks, and completing the hardcoding audit.

## Browser proof
Paste real code, enter arguments, Visualize, move through steps, inspect every view, use Ask Lens, verify synchronization, and capture screenshots.

## AI
Use root `.env` when present. If the DeepSeek call is blocked, complete and test everything through mock and mocked HTTP adapters, record the blocker, and continue.

## End
Run final tests, capture screenshots, complete all logs, record final commit, and separate completed, partial, blocked, and deferred work honestly.
