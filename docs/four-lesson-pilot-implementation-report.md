# Four-Lesson Lens Pilot — Implementation Report

## Outcome

The active `python-foundations` pathway now contains exactly:

1. Values and Variables
2. Functions and Return Values
3. Conditions and Branches
4. Loops over Lists

Every lesson uses the ordered nine-step sequence and one shared Svelte renderer.
Prediction gates syntax reveal. Watch and directed exploration are separate modes.

## Authoritative lesson and example registry

The source of truth is `apps/web/src/lib/pilot/course.ts`. Lesson steps reference
example IDs. Server-loaded fixtures are checked against the authored source before
rendering, so the lesson and Lens cannot silently display different code.

| Lesson | Canonical example | Directed mutations |
| --- | --- | --- |
| Values and Variables | `values-watch` | `values-price-200`, `values-tax-rate`, `values-total-dependency` |
| Functions and Return Values | `functions-watch` | `functions-arguments`, `functions-renamed`, `functions-no-return`, `functions-two-calls`, `functions-direct-return` |
| Conditions and Branches | `conditions-watch` | `conditions-30`, `conditions-20`, `conditions-gte-30` |
| Loops over Lists | `loops-watch` | `loops-add-score`, `loops-strict-boundary`, `loops-initial-total`, `loops-no-condition`, `loops-replace-list` |

Variation, recognition, and production code also live in the same registry.
Production scaffolds are explicitly non-executable.

## Active-pathway cleanup

- Removed `accumulate`, `count`, `filter`, `transform`, `search`, and
  `array-update` from the active pathway.
- Removed the obsolete `loops` module from active pathway metadata.
- The legacy module route now resolves no active module for this pathway.
- Removed incomplete generated variation artifacts; only canonical and authored
  exploration fixtures are shipped.

## Engine support

- Added deterministic module execution of one authored top-level function call.
- Added function and call nodes under the module root, an `invokes` relation,
  argument-to-parameter trace events, function-frame events, return flow, and
  outer result binding.
- Multiple top-level functions remain atomically unsupported.
- Extended principled scene containment to the four levels needed by
  module → function → loop → branch → operation.
- Verified modulo plus equality for the even-number production exercises.
- Removed the code panel's legacy `calculate_total(...)` fallback. Module packs
  now display only authoritative source; function-only packs derive a sample call
  from their real function name and arguments.

See `docs/pilot-support-audit.md` and `docs/adr/support-matrix.json`.

## Persistence

`localStorage` key `lens:python-foundations:progress:v2` stores current lesson,
completed lessons and steps, prediction answers, explored mutations, and
production attempts. Reset removes the key.

## Tests and results

- Pilot content: 4/4 Vitest assertions passed.
- Pilot engine: 2/2 Python engine tests passed across all 20 executable fixtures.
- Existing module execution: passed.
- Existing API analyze contracts: 3/3 passed.
- Existing Lens scenes: 71/71 passed.
- TypeScript build: passed.
- Svelte check: 0 errors, 0 warnings.
- Production web build: passed.
- Browser pilot suite: 8/8 passed.
- Canonical scene recapture: 4/4 passed.

## Browser evidence

- `output/playwright/four-lesson-pilot/lesson-1-values.png`
- `output/playwright/four-lesson-pilot/lesson-2-functions.png`
- `output/playwright/four-lesson-pilot/lesson-3-conditions.png`
- `output/playwright/four-lesson-pilot/lesson-4-loops.png`
- `output/playwright/four-lesson-pilot/mobile-loops.png`

## Unsupported cases and remaining risks

- Arbitrary Python editing is intentionally not offered. Explore mode exposes only
  authored, engine-verified mutations.
- Helper functions, recursion, imports, classes, comprehensions, exceptions,
  async code, and other constructs already marked unsupported still fail
  atomically with no partial scene.
- Multiple top-level functions remain unsupported.
- The web production build reports the repository's existing adapter-auto notice:
  a deployment adapter has not been selected. The build itself succeeds.

## Run and verify

```powershell
pnpm content:pilot
pnpm test:pilot
pnpm test:module
pnpm test:api-analyze
pnpm test:scenes
pnpm exec tsc --build --pretty false
pnpm --filter web check
pnpm --filter web build
pnpm exec playwright test tests/e2e/four-lesson-pilot.spec.ts
```

For local development:

```powershell
pnpm api
pnpm --filter web dev
```

Open `http://127.0.0.1:5173/learn/python-foundations`.
