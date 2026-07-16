# Smoke test — first open (Richie)

Check each item on a fresh machine after following the README quickstart. Mark ✅ / ❌.

| # | Check | Pass? |
|---|---|---|
| 1 | `pnpm install` completes without error | |
| 2 | `pip install -r apps/api/requirements.txt` succeeds | |
| 3 | `pnpm api` serves `GET http://127.0.0.1:8000/health` → `{"status":"ok"}` | |
| 4 | `pnpm --filter web dev` loads home page in the browser | |
| 5 | `/decode`: Analyze default accumulate sample; SHAPE view shows a scene; Step/Back change bindings | |
| 6 | `/decode`: Save analysis, copy id, Load restores source + views | |
| 7 | `/learn/how-loops-build-results`: all four lessons open; prev/next works end-to-end | |
| 8 | A lesson page shows **static** initial scene; “Run it yourself” enables stepping | |
| 9 | `pnpm test:lessons` prints `4/4 lessons machine-checked` | |
| 10 | `pnpm test:journey` prints `3/3 fresh snippets complete` | |

## Notes

- Lesson `verification.verified_by` is still `PENDING-RICHIE` until human sign-off (`DEFERRED-ONLINE.md` §10).
- Prefer reduced-motion OS setting once and confirm TraceControls still step without animation glitches.
- Hostile sandbox cases are covered by `pnpm test:trace` (not required on first open).

Signed off by: _______________  Date: _______________
