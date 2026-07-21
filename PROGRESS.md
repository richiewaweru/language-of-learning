# PROGRESS.md

## Current phase

**V — Audience Value Proof.** Technical implementation V0–V4 complete; human validation **PENDING-HUMAN**.

## Last gate

**gate-V4 (technical)** — 2026-07-21

## Gate report — Audience Value Proof (technical handoff)

```
1. pnpm test:all — green (incl. test:web, 56 lens-scenes tests)
2. pnpm test:lessons — 4/4 machine-checked (44 checks each, full lesson anatomy)
3. pnpm capture:v1 — 8 SVGs in BUILD-LOG/assets/v1
4. pnpm --filter web build — exit 0
5. Public routes: /, /demo, /learn/*, /decode, /how-it-works, /about
6. docs/audience-value-*.md + ADRs 0009–0011 + learner-validation-v4.md filed
```

### What shipped (V0–V4 technical)

- Living Diagram Notebook shell: ProductHeader/Footer, extended design tokens
- Audience homepage with engine-derived HeroDemo
- `/demo` flagship LearningInstrument (accumulate [3,5,2] → 10)
- Learner step labels + captions (`deriveStepLabel`, `deriveLearnerCaption`)
- Four-lesson pathway with full 9-section anatomy
- Connected Truth View: `resolveTruthDetail` + TruthDrawer (demo, lessons, decode)
- Prediction, comparison, variation, transfer, summary components
- Local lesson progress persistence

### Human validation (not complete)

| Item | Status |
|------|--------|
| Five-person learner protocol | PENDING-HUMAN |
| Teacher/explainer review | PENDING-HUMAN |
| Richie lesson sign-off | PENDING-HUMAN |
| PM7 A/B sign-off | PENDING-HUMAN |

**Overall status: TECHNICALLY COMPLETE — HUMAN VALIDATION PENDING**
