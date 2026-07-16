# PROGRESS.md

## Current phase

**P6 — complete.** Next: **P7 — Hardening & handoff**

## Last gate

**gate-P6** — 2026-07-16

## Gate report — P5

### Gate commands + outputs

```
1. pnpm test:journey → 3/3 fresh snippets complete
2. pnpm test:scenes → 12/12 pass
3. pnpm test:patterns → 11/11 pass
4. pnpm typecheck → exit 0
5. pnpm lint → exit 0
6. pnpm --filter web build → /decode present
```

## Gate report — P6

### Gate commands + outputs

```
1. pnpm test:lessons
   - 4/4 lessons machine-checked
   - accumulate / count / filter / transform

2. pnpm test:journey (regression)
   - 3/3 fresh snippets complete

3. pnpm typecheck
   - exit 0

4. pnpm lint
   - exit 0

5. pnpm --filter web build
   - exit 0 with /learn, /learn/how-loops-build-results, and 4 lesson routes
```

### What shipped

- `content/pathways/how-loops-build-results.json` + four lesson JSON files
- `content/scenes/` pre-rendered scenes (static initial state)
- `PathwaySchema` in lens-contracts + JSON Schema export
- Learn routes: index → pathway → lessons with prev/next nav
- Static-first pages + “Run it yourself” interactive ScenePlayer
- `pnpm test:lessons` machine-check script; `verified_by: PENDING-RICHIE`

### Decisions logged

See BUILD-LOG.md (four lessons = accumulate/count/filter/transform; Pyodide on demand deferred to Decode link).

### Next phase preview — P7

Full test run, production build, README quickstart, smoke-test script, finalize DEFERRED-ONLINE.
