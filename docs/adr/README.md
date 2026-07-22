# Lens Thoughtful Implementation Pack

This pack converts the agreed scope into implementation-ready artifacts.

## Files

1. `01-ADR-semantic-contract.md` — architectural decisions and semantic contracts.
2. `02-golden-corpus.md` — algorithm-based positive and negative acceptance corpus.
3. `03-visual-constitution-amendment.md` — visual behavior for new constructs.
4. `04-implementation-runbook.md` — wave sequencing and review gates.
5. `05-cursor-run-brief.md` — bounded execution brief for Wave A.

## Recommended use

Approve the ADR first, then use the corpus and visual amendment as acceptance references. Run only Wave A through the Cursor brief, pilot it, freeze it, and then prepare separate Wave B and C runs.


## Version 2 amendments

This revision:

1. adds indexed tuple targets for sorting swaps;
2. adds an explicit nested-loop readiness audit;
3. centralizes learner-facing unsupported copy in ADR §7.1;
4. moves `/=` from Wave A to Wave B with a float semantic contract;
5. uses structural-invariant assertions during active wave development and freezes full snapshots only at review gates.

