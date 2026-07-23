# Files Changed

Candidate: `e929828092d329c83fb0d0b74a3ce50cd0c52af0`

## Contracts and governance

- `.github/workflows/ci.yml` — adds explicit frozen-install, corpus, full-suite, type-check, lint, and build gates.
- `docs/adr/01-ADR-semantic-contract.md` — records the nine canonical hardening codes and learner messages.
- `docs/adr/02-golden-corpus.md` — restores the corrupted committed document from the intact ADR v2 pack.
- `docs/adr/support-matrix.json` — expands the actual pilot boundary and records verified, experimental, and unsupported layers.
- `docs/structural-code-lens/ARTIFACT-COMPLIANCE.md` and `fixtures/structural-v1/cases.json` — align structural verification with canonical atomic rejection.

## Analyzer, tracer, API, and web

- `packages/analyzer-python/src/lol_analyzer/analyzer.py` — ordered canonical preflight, context-sensitive built-in shadowing, literal-only list assignment validation, and ordinary binding-read preservation.
- `packages/trace-runtime/src/lol_trace/tracer.py` — literal list evaluation, fresh identity, alias preservation, and allocation accounting.
- `apps/api/main.py` — propagates analyzer rejection before function-node checks.
- `apps/web/src/lib/api.ts` — types structured violations.
- `apps/web/src/routes/decode/+page.svelte` — renders canonical rejection without playback, tabs, trace, graph, or result.

## Tests and fixtures

- `tools/run_wave_a_corpus.py` — P01–P09 structural coverage and atomicity assertions.
- `tools/run_api_analyze_tests.py` — API regression coverage for built-in shadowing and enumerate.
- `tools/verify_structural_lens.py` — verifies rejection outcomes without treating empty traces as malformed supported output.
- `tests/corpus/negative/N11-*` through `N19-*` — one canonical atomic fixture per new rejection code.
- `tests/e2e/decode-acceptance.spec.ts` — rendered canonical-message and absent-control assertions.
- `package.json` — includes the API analyze regression in `test:all` and declares the root `tsx` executable used by root-level scripts.
- `pnpm-lock.yaml` — locks the root `tsx` development dependency for clean frozen installs.

No existing A/N golden was regenerated or rewritten to conceal a semantic change.
