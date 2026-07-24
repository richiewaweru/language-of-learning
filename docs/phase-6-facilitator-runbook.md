# Phase 6 Facilitator Runbook

## Frozen study

- Study: `lens-phase-6-pilot`
- Study version: `1.0.0`
- Condition: `guided-lens-v1`
- Release: `phase-6-pilot-v1`
- Runtime: `/learn/python-foundations/{lesson}`

Do not change the condition, lesson content, release, or facilitator instructions during the
pilot. Record protocol deviations separately.

## Before each participant

1. Open `/pilot` in a clean facilitator tab.
2. Confirm no participant session is active. If one remains, validate its export and delete it.
3. Explain local recording, export, deletion, and the absence of names, email, and source text.
4. Let the participant read and select the acknowledgement themselves.
5. Create the consented session and record the participant code in the external session notes.
6. Select the assigned lesson and open it in a new tab.
7. Confirm the learner tab contains no participant code, metrics, export, or deletion controls.

No participant code or learning event may exist before acknowledgement.

## Session sequence

1. Brief orientation without showing answers or explaining Lens views in advance.
2. Pre-transfer task.
3. Prediction, reveal, guided inspection, variation, recognition, and Build.
4. Post-transfer task.
5. Short interview using `docs/phase-6-interview-template.md`.
6. Return to `/pilot`, refresh if necessary, and confirm event/attempt counts.

Record interventions immediately using only the structured controls:

- category: technical, navigation, conceptual, or direct answer;
- assistance: prompt, demonstration, or resolution.

Do not put names, quotations, or free-text notes in the application event stream. A completion
requiring conceptual or direct-answer rescue is not independent completion.

## Export and participant changeover

1. Export JSON from `/pilot`.
2. Run `pnpm pilot:validate -- <export-file>`.
3. Do not include an export that is invalid or reports degraded storage.
4. Store the validated file under the approved study retention policy.
5. Use **Delete participant data** and verify the participant code disappears.
6. Start the next participant only after a new acknowledgement creates a different code.

Phase 5 data remains isolated. Use the separate legacy deletion control only when its removal is
intentional.

## Failure handling

- If a learner warning appears, continue only long enough to return to the facilitator tab.
- Attempt an export; queued in-memory events can be included but the export remains degraded.
- Record the technical interruption externally and exclude invalid evidence.
- If browser storage is malformed, do not overwrite or manually edit it. Export what is available,
  delete the affected participant data, and restart with a new acknowledgement.
