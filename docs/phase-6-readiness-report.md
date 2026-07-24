# Phase 6 Pilot Readiness Report

## Verdict

**READY FOR HUMAN PILOT**

Frozen source commit: `61e2b7306c658fe8f2f11c38ab58ffe475daa042`

Release: `phase-6-pilot-v1`

Study: `lens-phase-6-pilot` v`1.0.0`

Condition: `guided-lens-v1`

This verdict covers technical and operational readiness for a controlled 5–10 participant pilot.
It is not an effectiveness claim.

## Evidence-quality patches

- P5.1: each lesson now owns its complete authored definition; the former monolith contains only
  shared V4 construction helpers.
- P5.2–P5.5: response events carry assessment metadata, Build completion is explicit, failed
  criteria retain occurrence counts, and timing summaries use documented two-minute idle capping.
- P5.6–P5.8: persistence failures queue bounded evidence, deletion removes current study identity
  and attempt state, and exports derive complete lesson-version metadata from all events.
- P5.9–P5.11: `/pilot` owns facilitator controls, recording is consent-gated, study metadata is
  frozen, and exports carry deterministic integrity fields.
- P5.12: fixed summary, persistence, consent, deletion, export, validator, and analysis tests are
  part of `test:pilot`.

## Schema changes

- Learning events and exports use schema v2 under `lol:pilot:v2:*`.
- Phase 5 keys remain isolated and require an explicit facilitator deletion action.
- Every event carries study, release, condition, consent, participant, attempt, lesson-version,
  timestamp, and sequence context.
- Response events additionally require assessment ID, assessment type, and pre/lesson/post phase.
- Attempt summaries contain authoritative Build submission counts, failed-criterion frequencies,
  retries, interventions, wall/active/guided timing, prediction timing, and Build-success timing.

## Executed gates

| Gate | Result |
| --- | --- |
| `pnpm test:pilot` | PASS — 16 TypeScript tests and 2 Python engine tests |
| `pnpm test:all` | PASS — all analyzer, trace, module, corpus, pattern, scene, fixture, journey, API, AI, lesson, parity, visual, 60 web, typecheck, and lint checks |
| `pnpm test:e2e` | PASS — 73 Playwright tests |
| `pnpm --filter web build` | PASS |
| Pilot export validator | PASS on `artifacts/phase-6/sample-pilot-export.json` |
| Pilot analyzer | PASS; generated participant, attempt, failed-criterion, and findings outputs |
| Normal dry run | PASS through consent, learner-only launch, assessment, intervention, export, and deletion coverage |
| Adverse dry run | PASS through refresh/restart, write failure/recovery, malformed storage, idle capping, invalidation, and next-participant isolation coverage |

## Limitations

- Evidence remains browser-local. A tab closed while events exist only in the in-memory recovery
  queue can lose those unflushed events.
- A degraded export is intentionally rejected and must not be included in analysis.
- The fixed beginner-Python scenario transforms remain limited to the reviewed lesson shapes.
- Interview and observation notes remain external and must be joined only by anonymous participant
  code.
- Human recruitment, facilitation, outcome analysis, and revision decisions have not occurred.

## Human-pilot gate

Use only the frozen source commit and release metadata above. Validate every participant export,
exclude degraded or invalid evidence, delete local participant data before changeover, and report
counts and participant-level changes without significance or effectiveness claims.
