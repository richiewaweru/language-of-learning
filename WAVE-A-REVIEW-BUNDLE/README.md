# Wave A Review Bundle

## Recommendation

**Accept Wave A for human sign-off.** All A01–A15 cases and all N01–N10 cases pass, renderer projection succeeds for every positive run, frozen graph/trace locks replay exactly, and the pre-existing suite is green after canonical snapshot regeneration.

This recommendation does not authorize Wave B. The nested-loop audit still marks Wave B sorting activation unsafe because inner/outer cursor projection and renderer density have not been verified.

## Bundle contents

- `FILES-CHANGED.md` — implementation and generated-artifact summary.
- `support-matrix.json` — machine-readable support status.
- `CORPUS-REPORT.md` — positive, negative, renderer, and regression results.
- `graph-snapshots/` — frozen graphs for A04, A05, A06, A10, A14, and A15.
- `trace-samples/` — frozen traces for the same representative cases.
- `visual-snapshots/` — real `/decode` captures for those cases.
- `UNSUPPORTED-MESSAGE-SAMPLES.md` — all N01–N10 canonical codes and learner copy.
- `NESTED-LOOP-AUDIT.md` — readiness findings and Wave B decision.
- `KNOWN-LIMITATIONS.md` — explicit current boundaries.
- `WAVE-A-CONFLICTS.md` — conflict log.

Full regression locks for all A01–A15 cases remain beside their fixtures under `tests/corpus/wave-a/`.
