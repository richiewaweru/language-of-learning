# PROGRESS.md

## Current phase

**UI — Learner UI transformation.** Phase V technical complete; UI-0 through UI-5 shipped.

## Last gate

**gate-UI (technical)** — 2026-07-21

## Gate report — Learner UI transformation

```
1. pnpm test:all — green (incl. test:web 20 tests, audience-routes + projection)
2. pnpm test:lessons — 4/4 machine-checked
3. pnpm --filter web build — exit 0
4. Canonical flagship URL: /learn/python-foundations/loops/accumulate
5. Legacy redirects: how-loops-build-results/* → python-foundations/loops/*
6. Style gallery: /internal/style-gallery
7. ADR 0012 learner UI skin refresh filed
```

### What shipped (UI-0–UI-5)

- Design tokens v0.2: warm `#faf9f6`, brand cobalt, Source Serif 4 + Inter + JetBrains Mono
- `learner-ui/` shell (AppHeader, Breadcrumbs, PageContainer) and lesson workspace
- LessonWorkspace at `/learn/python-foundations/loops/accumulate` (engine-driven, `[3,5,2]`)
- Learner projection: `deriveLearnerProjection` + LearnerFlowView
- Decode restyle: Paste/Upload/Examples, Structure/Flow/State/Explain, pattern sidebar
- Pathway browser, library stub, landing continue-learning panel
- hooks.server.ts legacy route redirects

### Human validation (unchanged)

| Item | Status |
|------|--------|
| Five-person learner protocol | PENDING-HUMAN |
| Teacher/explainer review | PENDING-HUMAN |
| Richie lesson sign-off | PENDING-HUMAN |
| PM7 A/B sign-off | PENDING-HUMAN |

**Overall status: UI TRANSFORMATION TECHNICALLY COMPLETE — HUMAN VALIDATION PENDING**
