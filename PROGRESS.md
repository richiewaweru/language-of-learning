# PROGRESS.md

## Current phase

**P4 — complete.** Next: **P5 — Decode surface**

## Last gate

**gate-P4** — 2026-07-16

## Gate report — P0

### Gate commands + outputs

```
1. PATCH-001 verification → PASS
2. pnpm typecheck → exit 0
3. pnpm --filter @lol/lens-contracts test → 9/9 pass
4. pnpm test:fixtures → 6/6 shape-valid
5. pnpm lint → exit 0
```

## Gate report — P1

### Gate commands + outputs

```
1. pnpm test:analyzer → 4/4 pass
2. pnpm pyodide-parity → 6/6 byte-identical
3. python tools/review_unseen.py → 10/10 reviewed
4. pnpm --filter web build → /debug/graph present
5. pnpm typecheck → exit 0
6. pnpm lint → exit 0
```

## Gate report — P2

### Gate commands + outputs

```
1. pnpm test:trace → 5/5 pass (6 fixtures + 5 hostile)
2. pnpm trace-pyodide-parity → 6/6 fixture traces byte-identical
3. pnpm test:analyzer → 4/4 pass
4. pnpm pyodide-parity → 6/6 byte-identical
5. pnpm typecheck → exit 0
6. pnpm lint → exit 0
```

## Gate report — P3

### Gate commands + outputs

```
1. pnpm test:patterns → 11/11; negative precision 100%
2. pnpm typecheck → exit 0
3. pnpm lint → exit 0
4. pnpm test:trace → 5/5 pass
5. pnpm test:analyzer → 4/4 pass
```

## Gate report — P4

### Gate commands + outputs

```
1. pnpm test:scenes
   - 11/11 tests pass
   - layout / scene-actions / selection / back-step snapshot tests

2. pnpm test:patterns (regression)
   - 11/11 pass

3. pnpm typecheck
   - exit 0

4. pnpm lint
   - exit 0

5. pnpm --filter web build
   - exit 0 with /slices/accumulate and /slices/filter

6. BUILD-LOG/assets/p4/
   - accumulate-{initial,mid,final}.svg
   - filter-{initial,mid,final}.svg
   - 6/6 screenshots present
```

### What shipped

- `packages/lens-scenes/` — layout engine, overlap validator, scene builder, selection resolver, captions
- `packages/visual-grammar/` — 11 primitives + TraceControls + ScenePlayer
- `/slices/accumulate` and `/slices/filter` interactive pages with variations + paste matching
- rewritten `fixtures/*/expected.scene-actions.json` from scene builder
- `fixtures/variations/` for alternate call args
- screenshot set under `BUILD-LOG/assets/p4/`

### Decisions logged

See BUILD-LOG.md (scene-action canonicalization; SVG screenshots; caption template keys).

### Next phase preview — P5

Decode surface: editor, sample-call, analyze, four synchronized views, unsupported panel, transfer check, save/load.
