<script lang="ts">
  import type {
    LensPresentation,
    LensSessionController,
    LessonLensCue,
    LessonLensMode,
  } from '@lol/lens-contracts';
  import LensWorkspace from '$lib/lens/LensWorkspace.svelte';

  let {
    controller,
    cue,
    presentation,
    mode,
  }: {
    controller: LensSessionController;
    cue: LessonLensCue;
    presentation: LensPresentation;
    mode: LessonLensMode;
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
  <header>
    <p>{cue.eyebrow ?? 'Learning Lens'}</p>
    <h2>{cue.title ?? 'Follow the program in Lens'}</h2>
    {#if cue.instruction}<span>{cue.instruction}</span>{/if}
  </header>
  {#if presentation === 'quiet'}
    <p class="quiet-note">Lens remains mounted with this attempt. Complete the current prompt to bring execution forward.</p>
  {/if}
  <div class="workspace-shell" aria-hidden={presentation === 'quiet'}>
    <LensWorkspace {controller} />
  </div>
</aside>

<style>
  .lens-region { min-width: 0; padding: 16px; border: 1px solid #a8c0b3; border-radius: 14px; background: #edf2ed; transition: border-color .2s ease, box-shadow .2s ease, background .2s ease; }
  .lens-region.focus { border-color: #d36c37; background: #f5eee6; box-shadow: 0 16px 38px rgba(78, 55, 36, .14); }
  header { margin-bottom: 14px; }
  header p { margin: 0; color: #4f6b5e; text-transform: uppercase; letter-spacing: .1em; font-size: var(--text-xs); }
  header h2 { margin: 5px 0 0; font-family: var(--font-display); font-size: 25px; }
  header span { display: block; margin-top: 7px; color: var(--ink-secondary); line-height: 1.45; }
  .quiet-note { margin: 8px 0 0; color: #52665d; font-size: var(--text-sm); }
  .quiet .workspace-shell { max-height: 0; overflow: hidden; visibility: hidden; }
</style>
