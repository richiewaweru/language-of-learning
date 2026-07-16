# ADR 0007 — API-only analysis in v0.1-local

**Status:** Accepted (corrective F4, 2026-07-16)

## Context

ADR-0003 / the shared-engine plan promised one analyzer running in both CPython (server) and Pyodide (browser). v0.1-local Decode analyzes exclusively via the FastAPI/CPython path. In-browser Pyodide for interactive analyze was never shipped on the Decode surface.

## Decision

v0.1 analyzes exclusively through the local FastAPI API (`POST /analyze`, `POST /analyses`). Offline / in-browser Pyodide analysis remains deferred (see DEFERRED-ONLINE.md §7).

## Consequences

- Decode **requires** the local API to be running; there is no offline mode.
- Graph/trace parity tests (`pnpm pyodide-parity`, `pnpm trace-pyodide-parity`) still guard the shared Python sources so a future Pyodide path will not drift.
- Learn “Run it yourself” uses precomputed traces + ScenePlayer, not live Pyodide.
