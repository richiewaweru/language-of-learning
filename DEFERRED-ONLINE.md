# DEFERRED-ONLINE.md

**Status: finalized for v0.1-local handoff (gate-P7, 2026-07-16).**  
Items below remain intentionally out of the local monorepo. Do not implement them in-repo without a new phase plan.

Things intentionally left for after local completion:

1. Hosting (web app + API) and domain; static Learn pages on CDN.
2. Postgres (swap JSON file store / future SQLite via the repository interface) + managed backups.
3. Auth (Google OAuth per TBG patterns) + user ownership of saved analyses.
4. Real LLM adapter behind `ExplanationProvider` (+ model routing/telemetry patterns extracted from TBG) for explain-mode and caption leveling.
5. Telemetry sink (NDJSON → real endpoint) + dashboards. *(Local NDJSON file write exists in `apps/api`.)*
6. npm publishing of lens packages (if ever needed externally).
7. Pyodide from CDN with local fallback; bundle-size pass. *(In-page Pyodide for Learn “run it yourself” also deferred; Decode uses the Python API.)*
8. Share links (needs hosting + IDs), SEO for Learn pages.
9. Repository import (explicitly out of v0.1 by ADR/scope docs).
10. Human verification sign-off: Richie replaces every `PENDING-RICHIE` verification record after inspecting each lesson — nothing is "published" until then, per the lifecycle.

## Local notes (not deferred — already shipped)

- Analyses: `data/analyses/*.json`
- Events: `data/events.ndjson`
- Gates: `gate-P0` … `gate-P7`
