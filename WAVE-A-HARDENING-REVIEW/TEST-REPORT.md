# Test Report

Candidate: `e929828092d329c83fb0d0b74a3ce50cd0c52af0`

| Gate | Result |
| --- | --- |
| `python tools/run_wave_a_corpus.py` | PASS — 16/16 test methods; A01–A15, P01–P09, and N01–N19 |
| `pnpm test:all` | PASS |
| `pnpm build` | PASS |
| `pnpm test:e2e` | PASS — 22/22, rerun from the isolated clean install |
| `pnpm verify:structural-lens` | PASS — 11 pack artifacts, 17 symbols, 14 acceptance cases, 127 TS tests, analyzer 9/9, tracer 13/13, flagship Playwright 8/8 |
| content rebuild and drift checks | PASS — no content/schema drift |
| `git diff --check` | PASS |

A clean isolated worktree initially reproduced a missing-root-executable failure at `test:variations`: `pnpm exec tsx` was invoked by a root script, but `tsx` was declared only in a child workspace. The root development dependency was added and the complete `pnpm test:all` gate then passed from the clean install.

The first GitHub Actions run then exposed a separate Windows-only executable name in two Python subprocess calls (`pnpm.cmd`). Both calls now resolve `pnpm.cmd` or `pnpm` from `PATH`; focused journey and API-save tests pass on Windows, and the follow-up CI run is the Linux verification.

## Atomic rejection evidence

Every new negative path asserts:

- exact canonical code and message;
- `nodes=[]`;
- `relations=[]`;
- `steps=[]`;
- no `result`.

The browser regressions additionally assert that playback controls, visualization tabs, learner flow, and the result port are absent.

The e2e run rewrote existing screenshots as a test side effect. Those generated changes were restored immediately and are not part of this patch.

## Golden policy

Development used structural assertions. Existing frozen A/N locks were not rewritten. The new N11–N19 files are negative contract fixtures, not regenerated positive full-output goldens.
