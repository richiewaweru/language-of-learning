# PROGRESS.md

## Current phase

**P1 — complete.** Next: **P2 — trace-runtime**

## Last gate

**gate-P1** — 2026-07-16

## Gate report — P0

### Gate commands + outputs

```
1. PATCH-001 verification (docs/language-of-learning-foundation-docs/)
   - constant in 04_semantic_contract.md: 1 (≥1) ✓
   - four-role BindingRole list in live docs: 0 ✓
   - 'triggers' as v0.1 relation type in live docs: 0 ✓
   - mutates in 04_semantic_contract.md: 1 (≥1) ✓
   - 8 hues in 05_visual_constitution.md: 12 (≥8) ✓

2. pnpm typecheck → exit 0 ✓

3. pnpm --filter @lol/lens-contracts test → 9/9 pass ✓

4. pnpm test:fixtures → 6/6 shape-valid ✓

5. pnpm lint → exit 0 ✓
```

### What shipped

- `docs/` authority tree (semantic-contract, visual-constitution, design-tokens, foundation-plan, programming-primitive-map, patched 20-doc set)
- `reference/structural-code-lens-poc.html`
- `.cursor/rules/` (5 process/authority rules)
- pnpm monorepo: `lens-contracts`, stub engine packages, `apps/web` SvelteKit shell
- Zod schemas + 7 exported JSON Schema files
- Fixture loader + 6 golden fixture scaffolds (accumulate, count, filter, transform, search, guard)
- Process files: tasks.md, BUILD-LOG.md, DEFERRED-ONLINE.md

### Decisions logged

See BUILD-LOG.md (docs layout, reference gap, package naming).

## Gate report — P1

### Gate commands + outputs

```
1. pnpm test:analyzer
   - 4/4 tests pass
   - includes exact graph match across 6 fixtures

2. pnpm pyodide-parity
   - 6/6 fixtures byte-identical

3. python tools/review_unseen.py
   - 10/10 reviewed

4. pnpm --filter web build
   - passes with /debug/graph route present

5. pnpm typecheck
   - exit 0

6. pnpm lint
   - exit 0
```

### What shipped

- `packages/analyzer-python/src/lol_analyzer/` shared analyzer package
- `tools/analyze_graph.py` CLI
- `tools/run_analyzer_tests.py` CPython fixture tests
- `tools/run_pyodide_parity.mjs` Pyodide parity runner
- refined `fixtures/*/expected.graph.json` files to canonical analyzer output
- `tools/review_unseen.py` + unseen review log in `BUILD-LOG.md`
- `apps/web/src/routes/debug/graph/` fixture-backed graph inspector

### Decisions logged

See BUILD-LOG.md (fixture canonicalization decision added for P1).

### Next phase preview — P2

Instrumented execution and honest sandboxing: canonical traces, hostile fixtures, caps, and calm failure banners.
