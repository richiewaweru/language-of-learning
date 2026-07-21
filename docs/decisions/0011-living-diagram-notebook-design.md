# ADR 0011 — Living Diagram Notebook design direction

**Status:** Accepted (V0, 2026-07-21)

## Context

The audience layer needs a cohesive visual identity distinct from developer tools and generic SaaS marketing. The existing semantic palette and 28px grid are law; skin tokens need extension for a paper-like learning environment.

## Decision

Adopt **Living Diagram Notebook** as the internal design direction:

- Warm paper neutrals with graph-paper background
- Layered surfaces: background → paper frame → code/visual/explanation → semantic objects → runtime values
- Display serif for hero/pathway headings only; UI sans elsewhere
- Editorial shadows replacing uniform neo-brutalist shadow everywhere
- One dominant learning instrument per page (not fragmented cards)

Extend `docs/design-tokens.css` by **aliasing** existing tokens; do not replace semantic law.

## Consequences

- New token families documented in `docs/audience-value-design-system.md`
- `LearningInstrument` is the central UI orchestrator
- Semantic colors never used decoratively in chrome
