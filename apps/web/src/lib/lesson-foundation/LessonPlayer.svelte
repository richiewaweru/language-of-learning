<script lang="ts">
  import { onMount } from 'svelte';
  import type { LessonDefinitionV1 } from '@lol/lens-contracts';
  import LessonProgressRail from './LessonProgressRail.svelte';
  import LessonNarrative from './LessonNarrative.svelte';
  import LessonLensRegion from './LessonLensRegion.svelte';
  import {
    createLessonSessionController,
    type LessonSessionController,
  } from './session.svelte';

  let { definition }: { definition: LessonDefinitionV1 } = $props();
  let controller = $state<LessonSessionController | null>(null);
  let startupError = $state('');

  async function boot(forceNew = false) {
    try {
      controller = await createLessonSessionController(definition, window.localStorage, forceNew);
    } catch (error) {
      startupError = error instanceof Error ? error.message : String(error);
    }
  }

  async function restart() {
    if (!controller) return;
    controller = await controller.actions.restart();
  }

  onMount(() => void boot());
</script>

<div class="lesson-player" data-testid="phase-2-lesson-player">
  {#if startupError}
    <div class="startup-error" role="alert">The lesson could not start. {startupError}</div>
  {:else if !controller}
    <div class="loading" data-testid="lesson-hydrating">Restoring your lesson…</div>
  {:else}
    <header class="lesson-header">
      <p>Python Foundations</p>
      <h1>{definition.title}</h1>
      {#if definition.subtitle}<p>{definition.subtitle}</p>{/if}
      <div><strong>Your goal</strong><span>{definition.goal}</span></div>
      <small data-testid="lesson-attempt-id">{controller.state.attemptId}</small>
    </header>

    {#if controller.state.persistenceWarning || controller.lens.state.persistenceWarning}
      <div class="warning" data-testid="lesson-persistence-warning" role="status">
        {controller.state.persistenceWarning ?? controller.lens.state.persistenceWarning}
      </div>
    {/if}

    <div class="lesson-layout">
      <LessonProgressRail
        {definition}
        activeSectionId={controller.state.activeSectionId}
        completedSectionIds={controller.state.completedSectionIds}
        onSelect={(id) => {
          controller?.actions.setActiveSection(id);
          document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
        }}
        onRestart={() => void restart()}
      />
      <LessonNarrative
        {definition}
        activeSectionId={controller.state.activeSectionId}
        completedSectionIds={controller.state.completedSectionIds}
        predictions={controller.state.predictions}
        onComplete={(id) => controller?.actions.toggleSectionComplete(id)}
        onPrediction={(id, answer) => controller?.actions.setPrediction(id, answer)}
      />
      <div class="sticky-lens"><LessonLensRegion controller={controller.lens} /></div>
    </div>
  {/if}
</div>

<style>
  .lesson-player { min-height: calc(100vh - 64px); padding: 34px clamp(14px, 3vw, 46px) 80px; background: #f5f1e8; color: var(--ink-primary); }
  .lesson-header { max-width: 900px; margin: 0 auto 32px; }
  .lesson-header > p:first-child { color: #9d542e; text-transform: uppercase; letter-spacing: .12em; font-size: var(--text-xs); font-weight: 700; }
  .lesson-header h1 { margin: 8px 0 12px; font-family: var(--font-display); font-size: clamp(44px, 7vw, 78px); line-height: .96; }
  .lesson-header > p:nth-child(3) { color: var(--ink-secondary); font-size: 18px; }
  .lesson-header div { display: flex; gap: 12px; margin-top: 22px; padding: 14px 16px; border-left: 4px solid #d36c37; background: #f4e9dd; }
  .lesson-header small { display: block; margin-top: 8px; color: var(--ink-muted); }
  .lesson-layout { width: min(100%, 1780px); margin: 0 auto; display: grid; grid-template-columns: 220px minmax(360px, .8fr) minmax(620px, 1.3fr); gap: 20px; align-items: start; }
  .sticky-lens { position: sticky; top: 18px; min-width: 0; max-height: calc(100vh - 36px); overflow: auto; }
  .loading, .startup-error, .warning { max-width: 900px; margin: 40px auto; padding: 20px; border-radius: 10px; background: white; }
  .warning { margin-block: 0 20px; background: #fff2db; color: #78521c; }
  @media (max-width: 1250px) {
    .lesson-layout { grid-template-columns: 210px minmax(0, 1fr); }
    .sticky-lens { grid-column: 2; position: static; max-height: none; }
  }
  @media (max-width: 900px) {
    .lesson-layout { grid-template-columns: minmax(0, 1fr); }
    .sticky-lens { grid-column: 1; }
  }
  @media (max-width: 600px) {
    .lesson-player { padding-inline: 10px; }
    .lesson-header div { display: grid; }
  }
</style>
