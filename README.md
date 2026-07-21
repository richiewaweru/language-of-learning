# Language of Learning (v0.1-local)

[![CI](https://github.com/richiewaweru/language-of-learning/actions/workflows/ci.yml/badge.svg)](https://github.com/richiewaweru/language-of-learning/actions/workflows/ci.yml)

Deterministic structural code lens for beginner Python: see how loops build results through synchronized code, visuals, and trace-derived explanations.

Authority: `docs/semantic-contract.md` → `docs/visual-constitution.md` + `docs/design-tokens.css` → `docs/audience-value-product-contract.md`.

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

6.  http://127.0.0.1:5173/ — audience landing + hero demo  
7.  http://127.0.0.1:5173/demo — flagship demonstration  
8.  http://127.0.0.1:5173/learn/how-loops-build-results — four-lesson pathway  
9.  http://127.0.0.1:5173/decode — try your code  

Optional checks:

```bash
pnpm test:all
pnpm build
```

Commands **1–5** get a running app; **6–9** are key URLs; optional checks verify the build.

## What you get

| Surface | Route |
|---|---|
| Landing + hero demo | `/` |
| Flagship demo | `/demo` |
| Learn pathway | `/learn/how-loops-build-results` |
| Try your code | `/decode` |
| How it works | `/how-it-works` |
| Developer slices | `/slices/accumulate`, `/slices/filter` |
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
