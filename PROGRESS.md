# PROGRESS.md

## Current phase

**P5 — complete.** Next: **P6 — Content & Learn**

## Last gate

**gate-P5** — 2026-07-16

## Gate report — P4

### Gate commands + outputs

```
1. pnpm test:scenes → 11/11 (now 12 with transfer)
2. pnpm test:patterns → 11/11
3. pnpm typecheck → exit 0
4. pnpm lint → exit 0
5. pnpm --filter web build → /slices/*
6. BUILD-LOG/assets/p4/ → 6 SVGs
```

## Gate report — P5

### Gate commands + outputs

```
1. pnpm test:journey
   - 3/3 fresh snippets complete
   - sum_scores→ACCUMULATE, keep_positive→FILTER, first_match→SEARCH
   - analyze / save / load / transfer / pattern+scene pipeline

2. pnpm test:scenes
   - 12/12 pass (includes transfer-check unit test)

3. pnpm test:patterns
   - 11/11 pass

4. pnpm typecheck
   - exit 0

5. pnpm lint
   - exit 0

6. pnpm --filter web build
   - exit 0 with /decode route
```

### What shipped

- `apps/api/` FastAPI: `/analyze`, `/analyses`, `/events` (SQLite-free JSON store + NDJSON)
- `/decode` CodeMirror editor, sample-call, four synced views, unsupported panel, transfer check, save/load
- `buildTransferCheck` / `gradeTransferCheck` in `@lol/lens-scenes`
- `pnpm test:journey` + `pnpm api` scripts

### Decisions logged

See BUILD-LOG.md (JSON file store; CodeMirror; API analyze in Python / pattern+scene in TS).

### Next phase preview — P6

Lesson schema, four-lesson loops pathway, static-first Learn pages, machine-check verification.
