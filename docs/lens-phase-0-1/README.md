# Lens Phase 0–1

This directory is the repository-native version of `lens-phase-0-1-artifacts.zip`.
The bundle is treated as an architectural goal, while the checked-in behavior,
contracts, and tests are authoritative when the original scaffolds conflict.

## Locked decisions

- Decode keeps four views: Flow, State, Guided Trace, and Graph Inspector.
- Public view IDs remain `flow`, `state`, `explain`, and `structure` to preserve
  current selectors and compatibility.
- `argsRepr` is part of every engine request because function execution requires it.
- Decode starts from the default pack after refresh or navigation; it uses a no-op
  persistence adapter and gains no Reset control.
- Persistence contracts and versioned keys are available for future controllers.
- Failed analysis clears verified artifacts. This is an approved safety correction,
  not behavior to preserve.
- Lesson progression, new lesson content, and parser/execution changes are excluded.

## Documents

- [Phase 0 baseline and regression matrix](./01-phase-0-baseline.md)
- [State and pipeline audit](./02-state-and-pipeline-audit.md)
- [Architecture and public contracts](./03-architecture-and-contracts.md)
- [Risks and rollback](./04-risks-and-rollback.md)
- [Acceptance gates](./05-acceptance-gates.md)

Baseline: clean commit `97fa2c1` (`Integrate Lens into flowing lessons`).
