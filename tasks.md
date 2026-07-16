# tasks.md — single source of truth. Judged status only changes with evidence.

## Phase P0 — Skeleton & contracts [gate: PATCH greps + pnpm typecheck + lens-contracts test + test:fixtures + lint]

- [ ] P0-00 Apply PATCH-001 to 20-doc set; write PATCH-001-REPORT.md
      done-when: PATCH-001 verification greps pass in docs/language-of-learning-foundation-docs/
      status: done-pending-judge
      evidence: applied to 04, 05, 02, 11, 14; PATCH-001-REPORT.md written
      judge:

- [ ] P0-01 Establish docs/ + reference/ authority tree
      done-when: docs/semantic-contract.md, docs/foundation-plan.md, docs/language-of-learning-foundation-docs/ exist
      status: done-pending-judge
      evidence: docs tree created with all authority files
      judge:

- [ ] P0-02 Install .cursor/rules/ (5 files)
      done-when: all five .mdc files exist under .cursor/rules/
      status: done-pending-judge
      evidence: 00-authority, 10-determinism, 20-contract, 30-visuals, 40-process installed
      judge:

- [ ] P0-03 Create PROGRESS.md, BUILD-LOG.md, DEFERRED-ONLINE.md, tasks.md
      done-when: all four files exist; DEFERRED-ONLINE has 10 seeded items
      status: done-pending-judge
      evidence: files created
      judge:

- [ ] P0-04 git init; initial commit of docs/rules/process
      done-when: git rev-parse --is-inside-work-tree → true; at least one commit
      status: todo
      evidence:
      judge:

- [ ] P0-05 pnpm workspace root (package.json, tsconfig, eslint, vitest, scripts)
      done-when: pnpm install && pnpm lint && pnpm typecheck exit 0
      status: todo
      evidence:
      judge:

- [ ] P0-06 Scaffold packages/lens-contracts + stub sibling dirs
      done-when: pnpm --filter @lol/lens-contracts build succeeds
      status: todo
      evidence:
      judge:

- [ ] P0-07 Minimal apps/web SvelteKit shell importing design-tokens.css
      done-when: pnpm --filter web build succeeds
      status: todo
      evidence:
      judge:

- [ ] P0-08 Zod schemas (graph, trace, pattern, scene, selection, lesson)
      done-when: pnpm --filter @lol/lens-contracts test passes; tsc clean
      status: todo
      evidence:
      judge:

- [ ] P0-09 JSON Schema export from Zod
      done-when: export script produces schemas/; Vitest drift check passes
      status: todo
      evidence:
      judge:

- [ ] P0-10 Fixture loader validates fixture shape
      done-when: pnpm test:fixtures fails on missing/invalid fixture
      status: todo
      evidence:
      judge:

- [ ] P0-11a ACCUMULATE fixture scaffold
      done-when: fixtures/accumulate/ validates via pnpm test:fixtures
      status: todo
      evidence:
      judge:

- [ ] P0-11b COUNT fixture scaffold
      done-when: fixtures/count/ validates via pnpm test:fixtures
      status: todo
      evidence:
      judge:

- [ ] P0-11c FILTER fixture scaffold
      done-when: fixtures/filter/ validates via pnpm test:fixtures
      status: todo
      evidence:
      judge:

- [ ] P0-11d TRANSFORM fixture scaffold
      done-when: fixtures/transform/ validates via pnpm test:fixtures
      status: todo
      evidence:
      judge:

- [ ] P0-11e SEARCH fixture scaffold
      done-when: fixtures/search/ validates via pnpm test:fixtures
      status: todo
      evidence:
      judge:

- [ ] P0-11f GUARD fixture scaffold (includes constant binding)
      done-when: fixtures/guard/ validates via pnpm test:fixtures
      status: todo
      evidence:
      judge:

- [ ] P0-12 Fixture index + README; 6/6 shape-valid
      done-when: pnpm test:fixtures reports 6/6 shape-valid
      status: todo
      evidence:
      judge:

## Gate block P0 (run all; paste outputs to PROGRESS.md)

1. PATCH-001 verification greps → expect pass
2. `pnpm typecheck` → expect pass
3. `pnpm --filter @lol/lens-contracts test` → expect pass
4. `pnpm test:fixtures` → expect 6/6 shape-valid
5. `pnpm lint` → expect pass
