# PROGRESS.md

## Current phase

**P7 — complete.** Local v0.1 handoff ready (`gate-P7`).

## Last gate

**gate-P7** — 2026-07-16

## Gate report — P7

### Gate commands + outputs

```
1. pnpm test:all
   - analyzer: 4 OK
   - trace: 5 OK (incl. hostile)
   - patterns: 11/11
   - scenes: 12/12
   - fixtures: 9/9 (6/6 shape-valid)
   - journey: 3/3 fresh snippets complete
   - lessons: 4/4 lessons machine-checked
   - typecheck: exit 0
   - lint: exit 0

2. pnpm pyodide-parity → 6/6 fixtures byte-identical
3. pnpm trace-pyodide-parity → 6/6 fixture traces byte-identical
4. pnpm build → exit 0 (workspace + web SSR/client)

5. README.md → numbered quickstart ≤10 commands
6. tools/smoke-test.md → 10-item checklist
7. DEFERRED-ONLINE.md → finalized for v0.1-local
```

### What shipped

- Root `README.md` quickstart (clone → Decode/Learn)
- `pnpm test:all` aggregator
- `tools/smoke-test.md` first-open checklist for Richie
- Finalized `DEFERRED-ONLINE.md` + BUILD-LOG P7 summary

### Decisions logged

See BUILD-LOG.md (README command counting; `test:all` aggregation).

### Handoff note

Human verification: replace `PENDING-RICHIE` on lesson records after inspecting each lesson (`DEFERRED-ONLINE.md` §10). Use `tools/smoke-test.md` on a fresh machine.
