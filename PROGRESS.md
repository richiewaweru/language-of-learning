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
4. PLAYWRIGHT_CHANNEL=chrome pnpm test:e2e — 6/6 browser tests green
5. Desktop + mobile flagship screenshot baselines captured at 1680×945 and 390×844
6. Canonical flagship URL: /learn/python-foundations/loops/accumulate
7. Legacy redirects: how-loops-build-results/* → python-foundations/loops/*
8. Style gallery: /internal/style-gallery
9. ADR 0012 learner UI skin refresh filed
```

### What shipped (UI-0–UI-5)

- Design tokens v0.2: warm `#faf9f6`, brand cobalt, Source Serif 4 + Inter + JetBrains Mono
- Responsive `learner-ui/` shell with AppHeader, search placeholder, mobile navigation, breadcrumbs, and page containers
- LessonWorkspace at `/learn/python-foundations/loops/accumulate` (engine-driven, `[2,4,6,8] → 20`)
- Learner projection: `deriveLearnerProjection` + LearnerFlowView
- Coordinated code, flow, timeline, explanation, prediction, and pattern summary through one Selection
- Decode restyle: engine-backed initial example, Paste/Upload/Examples, Structure/Flow/State/Explain, pattern sidebar
- Three-column pathway roadmap and engine-backed landing demo
- Real Playwright screenshot regression for the flagship composition and mobile layout
- hooks.server.ts legacy route redirects

### Human validation (unchanged)

| Item | Status |
|------|--------|
| Five-person learner protocol | PENDING-HUMAN |
| Teacher/explainer review | PENDING-HUMAN |
| Richie lesson sign-off | PENDING-HUMAN |
| PM7 A/B sign-off | PENDING-HUMAN |

**Overall status: UI TRANSFORMATION TECHNICALLY COMPLETE — HUMAN VALIDATION PENDING**
