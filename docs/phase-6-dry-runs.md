# Phase 6 Internal Dry Runs

## Dry run A — normal multi-lesson flow

Automated coverage:

- participant acknowledgement precedes identity and event creation;
- facilitator setup launches the full learner runtime;
- learner UI hides participant identity, metrics, and data controls;
- prediction, variation, Build, export, validation, and structured intervention paths;
- multi-attempt and cross-lesson version aggregation;
- participant deletion and new-code isolation.

Manual operator check:

1. Complete two lessons from one consented session.
2. Export and run `pnpm pilot:validate`.
3. Run `pnpm pilot:analyze -- <export-directory> --out output/phase-6-analysis`.
4. Confirm all three CSV files and the Markdown findings template are created.

## Dry run B — adverse recovery flow

Automated coverage:

- refresh and restart preserve attempt boundaries and sequences;
- quota/write failure queues events and later recovery preserves order;
- malformed JSON is not overwritten and produces degraded evidence;
- two-minute inactivity capping;
- source edits invalidate prior Build evidence;
- deletion removes study, attempt, Lens, and derived state before the next participant.

Manual operator check:

1. Interrupt and refresh during an attempt.
2. simulate blocked browser storage and confirm the learner warning;
3. restore storage, perform another action, and confirm queued events flush;
4. validate the export, delete the participant, and create a new session;
5. confirm the new code differs and the old events are absent.

The release readiness report records the executed gate results. These dry runs do not substitute
for the 5–10 consenting human pilot sessions.
