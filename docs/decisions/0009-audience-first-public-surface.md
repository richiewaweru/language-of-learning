# ADR 0009 — Audience-first public surface

**Status:** Accepted (V0, 2026-07-21)

## Context

The v0.1 web shell exposed developer routes (Graph Inspector, Slices) in primary navigation and used "v0.1 skeleton" copy on the homepage. The deterministic engine is complete (PM7) but the product value is not visible to first-time visitors.

## Decision

Replace the developer-oriented front door with an audience-oriented product experience:

- Primary nav: Learn · Try Your Code · How It Works · About (≤4 items)
- Developer routes remain accessible via footer secondary links only
- Shared `ProductHeader` / `ProductFooter` in layout
- New routes: `/demo`, `/how-it-works`, `/about`

## Consequences

- Homepage communicates learner benefit in first screen
- No engine behavior changes during V0
- Decode remains "Try Your Code" entry point
- `/slices/*` and `/debug/graph` demoted but not removed
