<script lang="ts">
  import type { LessonSessionController } from './session.svelte';

  let { controller }: { controller: LessonSessionController } = $props();
  let message = $state('');
  let localRevision = $state(0);
  const summary = $derived.by(() => {
    void localRevision;
    void controller.state.responses;
    void controller.state.activeSectionId;
    void controller.lens.state.revision;
    return controller.pilot.summaries().find(
      (item) => item.attemptId === controller.state.attemptId,
    );
  });

  function exportPilotData() {
    const data = controller.pilot.exportData();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `lens-pilot-${data.participantCode}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
    message = 'Pilot data exported as JSON.';
  }

  function deletePilotData() {
    controller.pilot.deleteData();
    localRevision += 1;
    message = 'Local pilot events for this participant were deleted.';
  }
</script>

<aside class="pilot-controls" data-testid="pilot-controls">
  <div>
    <span>Pilot participant</span>
    <strong data-testid="participant-code">{controller.pilot.participantCode}</strong>
  </div>
  <div class="metrics" aria-label="Current attempt summary">
    <span>Build runs <strong>{summary?.buildRunCount ?? 0}</strong></span>
    <span>Views <strong>{summary?.viewsUsed.length ?? 0}</strong></span>
    <span>Variations <strong>{summary?.variationCount ?? 0}</strong></span>
  </div>
  <div class="actions">
    <button type="button" data-testid="export-pilot" onclick={exportPilotData}>Export JSON</button>
    <button type="button" class="delete" data-testid="delete-pilot" onclick={deletePilotData}>Delete pilot data</button>
  </div>
  {#if message}<p role="status">{message}</p>{/if}
</aside>

<style>
  .pilot-controls { max-width: 900px; margin: 0 auto 24px; display: flex; flex-wrap: wrap; gap: 14px 24px; align-items: center; padding: 14px 16px; border: 1px solid #b9cbbf; border-radius: 10px; background: #edf4ef; }
  .pilot-controls > div:first-child { display: grid; gap: 2px; }
  .pilot-controls span { color: var(--ink-secondary); font-size: var(--text-sm); }
  .metrics, .actions { display: flex; flex-wrap: wrap; gap: 10px; }
  .actions { margin-left: auto; }
  button { padding: 8px 11px; border: 1px solid #7c9d8c; border-radius: 7px; background: white; color: #234d3d; font-weight: 700; }
  button.delete { color: #8b4930; }
  p { flex-basis: 100%; margin: 0; color: #32644f; font-size: var(--text-sm); }
</style>
