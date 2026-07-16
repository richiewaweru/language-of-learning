# Language of Learning (v0.1-local)

Deterministic structural code lens for beginner Python: paste a supported function, see graph / trace / pattern / scene, and study the **How loops build results** pathway.

Authority: `docs/semantic-contract.md` → `docs/visual-constitution.md` + `docs/design-tokens.css` → `docs/foundation-plan.md`.

## Quickstart (≤10 commands)

From a fresh clone:

```bash
1.  pnpm install
2.  pip install -r apps/api/requirements.txt
3.  pnpm --filter @lol/lens-contracts build
4.  pnpm api
5.  pnpm --filter web dev
```

Then open:

6.  http://127.0.0.1:5173/decode  
7.  http://127.0.0.1:5173/learn/how-loops-build-results  

Optional checks:

```bash
8.  pnpm test:lessons
9.  pnpm test:journey
10. pnpm build
```

Commands **1–5** get a running app; **6–7** are URLs; **8–10** verify the build.

## What you get

| Surface | Route |
|---|---|
| Decode | `/decode` |
| Learn pathway | `/learn/how-loops-build-results` |
| Accumulate / Filter slices | `/slices/accumulate`, `/slices/filter` |
| Local API | `http://127.0.0.1:8000` (`pnpm api`) |

## Requirements

- Node 20+, pnpm 9+
- Python 3.12+ (3.13 works in this workspace)
- No network calls at runtime beyond localhost

## Tests

```bash
pnpm test:analyzer
pnpm test:trace
pnpm test:patterns
pnpm test:scenes
pnpm test:fixtures
pnpm test:journey
pnpm test:lessons
pnpm typecheck
pnpm lint
```

Or: `pnpm test:all`

## Handoff

- First-open checklist: [`tools/smoke-test.md`](tools/smoke-test.md)
- Build decisions: [`BUILD-LOG.md`](BUILD-LOG.md)
- Deferred online work: [`DEFERRED-ONLINE.md`](DEFERRED-ONLINE.md)
