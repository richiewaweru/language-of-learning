# PROGRESS.md

## Current phase

**F0 — complete.** Next: **F1 — Analyzer generalization**

## Last gate

**gate-F0** — 2026-07-16

## Gate report — F0

### Fresh-run outputs (F0-01)

```
visit_stmt count before: 2
visit_stmt count after:  1

pnpm test:analyzer:
  test_all_fixture_graphs_match_expected ... ok
  test_filter_emits_mutation_node_and_mutates_relation ... ok
  test_function_return_shape_keywords ... ok
  test_mutation_unsupported_keywords ... ok
  test_roles_loop_branch_keywords ... ok
  Ran 5 tests — OK

Prior baseline (pre-F0 fix) pnpm test:all: exit 0
  analyzer 4 OK → now 5 OK with mutation guard
  trace 5 OK
  patterns 11/11
  scenes 12/12
  fixtures 9/9
  journey 3/3
  lessons 4/4
  typecheck exit 0
  lint exit 0
```

### What shipped

- Single `visit_stmt` dispatcher
- Filter mutation + visit_stmt count unit test
- `.github/workflows/ci.yml` + README CI badge
- tasks.md seeded F0–F4; BUILD-LOG corrective cause

### Next

F1 position-based IDs, purge fixture emission, regenerate goldens, variations suite.
