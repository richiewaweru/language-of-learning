<script lang="ts">
  import type { StudyContext } from '@lol/lens-contracts';
  import { onMount } from 'svelte';
  import {
    createFacilitatorEventStore,
    type LearningEventStore,
  } from '$lib/lesson-foundation/pilot-events';
  import {
    createConsentedStudyContext,
    deleteLegacyPilotData,
    loadStudyContext,
    PILOT_CONDITION_ID,
    PILOT_RELEASE_ID,
    PILOT_STUDY_ID,
    PILOT_STUDY_VERSION,
  } from '$lib/lesson-foundation/pilot-study';
  import { listLessonDefinitions } from '$lib/lesson-foundation/registry';

  const lessons = listLessonDefinitions();
  let selectedLesson = $state(lessons[0]?.slug ?? '');
  let acknowledged = $state(false);
  let study = $state<StudyContext | null>(null);
  let store = $state<LearningEventStore | null>(null);
  let message = $state('');
  let category = $state('navigation');
  let assistanceLevel = $state('prompt');

  function refresh() {
    study = loadStudyContext(window.localStorage);
    store = study ? createFacilitatorEventStore(window.localStorage, study) : null;
  }

  function startSession() {
    if (!acknowledged) return;
    try {
      study = createConsentedStudyContext(window.localStorage);
      store = createFacilitatorEventStore(window.localStorage, study);
      message = 'Study session created. Recording starts when the lesson opens.';
    } catch (error) {
      message = `The study session could not be created: ${
        error instanceof Error ? error.message : String(error)
      }`;
    }
  }

  function launchLesson() {
    if (!study || !selectedLesson) return;
    window.open(`/learn/python-foundations/${selectedLesson}`, '_blank', 'noopener');
    message = 'Learner lesson opened in a new tab.';
  }

  async function exportData() {
    if (!store) return;
    try {
      const data = await store.exportData();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `lens-pilot-v2-${data.participantCode}.json`;
      anchor.click();
      URL.revokeObjectURL(url);
      message = data.integrity.storageDegraded
        ? 'Export created, but storage was degraded. Do not include it until validated.'
        : 'Pilot export created. Validate it before inclusion.';
    } catch (error) {
      message = error instanceof Error ? error.message : String(error);
    }
  }

  function recordIntervention() {
    if (!store || store.list().length === 0) {
      message = 'Open the learner lesson before recording an intervention.';
      return;
    }
    const result = store.append('facilitator_intervention', {
      category,
      assistanceLevel,
    });
    message = result.status === 'persisted'
      ? 'Facilitator intervention recorded.'
      : `Intervention ${result.status}: ${result.reason ?? store.status().warning ?? ''}`;
    refresh();
  }

  function deleteParticipant() {
    if (!store) return;
    store.deleteParticipantData();
    study = null;
    store = null;
    acknowledged = false;
    message = 'Current participant events, identity, consent, attempts, and Lens data were deleted.';
  }

  function deleteLegacy() {
    deleteLegacyPilotData(window.localStorage);
    message = 'Isolated Phase 5 participant and event keys were deleted.';
  }

  onMount(refresh);
</script>

<svelte:head>
  <title>Phase 6 pilot facilitator — Lens</title>
</svelte:head>

<main class="pilot-page" data-testid="pilot-facilitator">
  <header>
    <p class="eyebrow">Local facilitator controls</p>
    <h1>Phase 6 pilot</h1>
    <p>Study {PILOT_STUDY_ID} · v{PILOT_STUDY_VERSION} · {PILOT_CONDITION_ID} · {PILOT_RELEASE_ID}</p>
  </header>

  {#if !study}
    <section class="card" data-testid="pilot-consent">
      <h2>Participant acknowledgement</h2>
      <p>
        This activity records an anonymous participant code, timestamps, navigation and answer
        events, correctness, and source hashes in this browser. It does not record names, email
        addresses, or the learner's source text. The data can be exported or deleted locally.
      </p>
      <label class="check">
        <input type="checkbox" bind:checked={acknowledged} />
        I understand this local recording and agree to take part.
      </label>
      <button type="button" disabled={!acknowledged} onclick={startSession}>
        Create consented study session
      </button>
    </section>
  {:else}
    <section class="card session" data-testid="pilot-session">
      <h2>Active participant</h2>
      <dl>
        <div><dt>Participant</dt><dd data-testid="participant-code">{study.participantCode}</dd></div>
        <div><dt>Consent time</dt><dd>{study.consentAcknowledgedAt}</dd></div>
        <div><dt>Facilitator session</dt><dd>{study.facilitatorSessionId}</dd></div>
      </dl>
      <label>
        Assigned lesson
        <select bind:value={selectedLesson}>
          {#each lessons as lesson}
            <option value={lesson.slug}>{lesson.title}</option>
          {/each}
        </select>
      </label>
      <button type="button" data-testid="launch-pilot-lesson" onclick={launchLesson}>
        Open learner lesson
      </button>
    </section>

    <section class="card">
      <h2>Evidence controls</h2>
      <p>
        Events: {store?.list().length ?? 0} · Attempts: {store?.summaries().length ?? 0} ·
        Storage: {store?.status().mode ?? 'unknown'}
      </p>
      {#if store?.status().warning}
        <p class="warning" role="alert">{store.status().warning}</p>
      {/if}
      <div class="row">
        <label>
          Intervention
          <select bind:value={category}>
            <option value="technical">Technical</option>
            <option value="navigation">Navigation</option>
            <option value="conceptual">Conceptual</option>
            <option value="direct-answer">Direct answer</option>
          </select>
        </label>
        <label>
          Assistance
          <select bind:value={assistanceLevel}>
            <option value="prompt">Prompt</option>
            <option value="demonstration">Demonstration</option>
            <option value="resolution">Resolution</option>
          </select>
        </label>
        <button type="button" data-testid="record-intervention" onclick={recordIntervention}>
          Record intervention
        </button>
      </div>
      <div class="actions">
        <button type="button" data-testid="export-pilot" onclick={exportData}>Export JSON</button>
        <button type="button" class="danger" data-testid="delete-pilot" onclick={deleteParticipant}>
          Delete participant data
        </button>
      </div>
    </section>
  {/if}

  <details class="legacy">
    <summary>Legacy Phase 5 data</summary>
    <p>Phase 5 keys are isolated and never included in Phase 6 exports.</p>
    <button type="button" class="danger" onclick={deleteLegacy}>Delete legacy Phase 5 keys</button>
  </details>

  {#if message}<p class="status" role="status">{message}</p>{/if}
</main>

<style>
  .pilot-page { width: min(920px, calc(100% - 32px)); margin: 48px auto 80px; color: var(--ink-primary); }
  header { margin-bottom: 28px; }
  h1 { margin: 6px 0; font-family: var(--font-display); font-size: clamp(42px, 7vw, 68px); }
  .eyebrow { color: var(--brand-blue); font-weight: 700; text-transform: uppercase; letter-spacing: .1em; }
  .card { margin: 18px 0; padding: 22px; border: 1px solid var(--line-soft); border-radius: 14px; background: var(--surface-primary); }
  .check { display: flex; gap: 10px; align-items: flex-start; margin: 18px 0; }
  button, select { padding: 9px 12px; border: 1px solid var(--line-strong, #87909a); border-radius: 8px; background: white; color: inherit; }
  button { cursor: pointer; font-weight: 700; }
  button:disabled { opacity: .5; cursor: not-allowed; }
  label { display: grid; gap: 6px; }
  dl { display: grid; gap: 8px; }
  dl div { display: grid; grid-template-columns: 150px 1fr; gap: 12px; }
  dt { color: var(--ink-muted); }
  dd { margin: 0; overflow-wrap: anywhere; }
  .row, .actions { display: flex; flex-wrap: wrap; gap: 12px; align-items: end; margin-top: 16px; }
  .danger { color: #8b2f24; }
  .warning { padding: 10px; background: #fff2db; color: #78521c; }
  .legacy { margin-top: 28px; }
  .status { position: sticky; bottom: 16px; padding: 12px 16px; border-radius: 10px; background: #e7eff7; }
</style>
