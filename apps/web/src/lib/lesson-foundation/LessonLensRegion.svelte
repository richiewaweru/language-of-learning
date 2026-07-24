<script lang="ts">
  import type {
    LensPresentation,
    LensSessionController,
    LessonLensCue,
    LessonLensMode,
  } from '@lol/lens-contracts';
  import LensWorkspace from '$lib/lens/LensWorkspace.svelte';
  import type { LensDisplayMode } from './lens-display';

  let {
    controller,
    cue,
    presentation,
    mode,
    displayMode,
    contextAvailable = false,
    onClose,
    onToggleFocus,
    onShowContext,
  }: {
    controller: LensSessionController;
    cue: LessonLensCue;
    presentation: LensPresentation;
    mode: LessonLensMode;
    displayMode: LensDisplayMode;
    contextAvailable?: boolean;
    onClose: () => void;
    onToggleFocus: () => void;
    onShowContext: () => void;
  } = $props();
</script>

<aside
  class="lens-region"
  class:quiet={presentation === 'quiet'}
  class:focus={presentation === 'focus'}
  data-testid="lesson-lens-region"
  data-presentation={presentation}
  data-lens-mode={mode}
>
  <header class="lens-header">
    <div>
      <p>{cue.eyebrow ?? 'Learning Lens'}</p>
      <h2 id="lesson-lens-heading" tabindex="-1">{cue.title ?? 'Follow the program in Lens'}</h2>
      {#if cue.instruction}<span>{cue.instruction}</span>{/if}
    </div>
    <div class="lens-actions">
      {#if contextAvailable && displayMode === 'open'}
        <button type="button" class="context-action" onclick={onShowContext}>Lesson context</button>
      {/if}
      <button type="button" onclick={onToggleFocus}>
        {displayMode === 'focus' ? 'Restore layout' : 'Focus Lens'}
      </button>
      <button type="button" aria-label="Close Lens" onclick={onClose}>Close</button>
    </div>
  </header>
  <div class="workspace-shell">
    <LensWorkspace {controller} layout="lesson" />
  </div>
</aside>

<style>
  .lens-region { min-width: 0; min-height: 100%; background: #f7f5ef; transition: background .2s ease; }
  .lens-region.focus { background: #f8f1e9; }
  .lens-header { position: sticky; top: 0; z-index: 6; display: flex; justify-content: space-between; gap: 18px; align-items: start; padding: 14px 18px; border-bottom: 1px solid var(--line-soft); background: color-mix(in srgb, #f7f5ef 94%, transparent); backdrop-filter: blur(10px); }
  header p { margin: 0; color: #4f6b5e; text-transform: uppercase; letter-spacing: .1em; font-size: var(--text-xs); }
  header h2 { margin: 5px 0 0; font-family: var(--font-display); font-size: 25px; }
  header span { display: block; margin-top: 7px; color: var(--ink-secondary); line-height: 1.45; }
  .lens-actions { display: flex; flex-wrap: wrap; justify-content: end; gap: 7px; }
  .lens-actions button { padding: 8px 10px; border: 1px solid var(--line-medium); border-radius: 7px; background: white; color: var(--ink-secondary); font-size: var(--text-xs); font-weight: 700; white-space: nowrap; cursor: pointer; }
  .context-action { display: none; }
  .workspace-shell { padding: 16px; }
  @media (max-width: 1023px) { .context-action { display: inline-flex; } }
  @media (max-width: 600px) {
    .lens-header { align-items: center; padding: 10px 12px; }
    .lens-header h2, .lens-header span, .lens-header p { display: none; }
    .lens-actions { width: 100%; justify-content: space-between; }
    .workspace-shell { padding: 10px; }
  }
  @media (prefers-reduced-motion: reduce) { .lens-region { transition: none; } }
</style>
