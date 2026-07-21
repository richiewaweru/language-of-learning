# ADR 0012 — Learner UI skin refresh

## Status

Accepted — 2026-07-21

## Context

Phase V shipped the Living Diagram Notebook shell with warm paper neutrals and neo-brutalist offset shadows. Approved learner mockups call for a calmer editorial textbook aesthetic: warm `#faf9f6` page, cobalt brand chrome, soft layered shadows, Source Serif 4 + Inter + JetBrains Mono, and restrained progress accents.

## Decision

1. **Skin tokens** in `docs/design-tokens.css` are updated to match the approved learner palette and typography. Learner chrome uses `--brand-blue` for primary actions and active nav — not `--data-blue` decoratively on buttons.

2. **Semantic hue roles are unchanged.** Values may nudge toward mockup hex (`--flow-teal` → `#0e9f9a`, `--state-gold` → `#e7a326`, `--data-blue` aligned to `#3157e5` for canvas data). Eight hues remain law per `visual-constitution.md`.

3. **Neo-brutalist shadows** (`--shadow-panel`, `--shadow-offset` hard offsets) are retired from learner surfaces; dev/slice routes may retain legacy styling until migrated.

4. **Learner projection** (UI-3) simplifies presentation without altering graph/trace/scene truth. Technical views remain in TruthDrawer and `/internal/debug/*`.

## Consequences

- Golden SVG captures may shift slightly after semantic hex nudge; re-capture at gate.
- ScenePlayer and primitives continue consuming semantic tokens; no renderer rewrite required for skin phase.
- Product contract routes adopt `python-foundations` URL shape with redirects from `how-loops-build-results`.
