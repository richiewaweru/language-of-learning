# ADR 0010 — Shared Connected Truth View

**Status:** Accepted (V3, 2026-07-21)

## Context

Decode already wires code/shape/trace/pattern through one Selection object (F3). Lessons, demo, and homepage hero each need the same bidirectional sync plus a learner-facing detail drawer.

## Decision

- Extend `resolveSelection` with `resolveTruthDetail` in lens-scenes
- Single `TruthDrawer` component used by LearningInstrument, lessons, and Decode
- Technical evidence accordion defaults closed
- No separate selection models per surface

## Consequences

- Selecting code or scene produces equivalent resolved selection
- Stale selection clears or re-resolves on backward step
- Keyboard focus produces same information as pointer selection
