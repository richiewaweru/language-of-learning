<script lang="ts">
  import { onMount } from 'svelte';
  import type { LessonDefinitionV4 } from '@lol/lens-contracts';
  import LessonProgressRail from './LessonProgressRail.svelte';
  import LessonNarrative from './LessonNarrative.svelte';
  import LessonLensRegion from './LessonLensRegion.svelte';
  import { loadStudyContext } from './pilot-study';
  import {
    createLessonSessionController,
    type LessonSessionController,
  } from './session.svelte';

  let { definition }: { definition: LessonDefinitionV4 } = $props();
  let controller = $state<LessonSessionController | null>(null);
  let startupError = $state('');
  const bindings = $derived.by(() => {
    const trace = controller?.lens.state.artifacts?.trace;
    const values = { ...(trace?.steps.at(-1)?.bindings ?? {}) };
    if (trace) {
      values.iterations = String(
        trace.steps.filter((step) => step.event.type === 'loop_advance').length,
      );
      const branch = trace.steps.find((step) => step.event.type === 'condition_eval');
      if (branch?.event.type === 'condition_eval') {
        values.branch = branch.event.result ? '1' : '0';
      }
    }
    return values;
  });

  async function boot(forceNew = false) {
    try {
      controller = await createLessonSessionController(
        definition,
        window.localStorage,
        forceNew,
        loadStudyContext(window.localStorage),
      );
    } catch (error) {
      startupError = error instanceof Error ? error.message : String(error);
    }
  }

  async function restart() {
    if (!controller) return;
    controller = await controller.actions.restart();
  }

  async function revealResponse(id: string, correct: boolean, feedback: string) {
    if (!controller) return;
    controller.actions.revealResponse(id, correct, feedback);
    const sectionIndex = definition.sections.findIndex((section) =>
      section.blocks.some((block) => 'responseId' in block && block.responseId === id),
    );
    const responseBlock = definition.sections[sectionIndex]?.blocks.find(
      (block) => 'responseId' in block && block.responseId === id,
    );
    const nextSection = definition.sections[sectionIndex + 1];
    if (
      (responseBlock?.type === 'value-prediction' || responseBlock?.type === 'prediction')
      && nextSection
    ) {
      await controller.actions.setActiveSection(nextSection.id);
      document.getElementById(nextSection.id)?.scrollIntoView({ behavior: 'smooth' });
    }
  }

  onMount(() => void boot());
</script>

<div class="lesson-player" data-testid="phase-2-lesson-player" data-schema-version={definition.schemaVersion}>
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
    {#if controller.state.persistenceWarning || controller.lens.state.persistenceWarning || controller.pilot.status().warning}
      <div class="warning" data-testid="lesson-persistence-warning" role="status">
        {controller.state.persistenceWarning
          ?? controller.lens.state.persistenceWarning
          ?? 'Study evidence could not be saved to browser storage. You can continue, but tell the facilitator.'}
      </div>
    {/if}
    {#if controller.state.interactionMessage}
      <div class="guidance" data-testid="lesson-interaction-message" role="status">
        {controller.state.interactionMessage}
      </div>
    {/if}

    <div class="lesson-layout">
      <LessonProgressRail
        {definition}
        activeSectionId={controller.state.activeSectionId}
        completedSectionIds={controller.state.completedSectionIds}
        onSelect={(id) => {
          void controller?.actions.setActiveSection(id);
          document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
        }}
        onRestart={() => void restart()}
      />
      <LessonNarrative
        {definition}
        activeSectionId={controller.state.activeSectionId}
        completedSectionIds={controller.state.completedSectionIds}
        responses={controller.state.responses}
        {bindings}
        comparison={controller.state.comparison}
        onDraft={(id, answer) => controller?.actions.setResponseDraft(id, answer)}
        onCommit={(id, correct, feedback) => controller?.actions.commitResponse(id, correct, feedback)}
        onRevealPrediction={(id, correct, feedback) => void revealResponse(id, correct, feedback)}
        onApplyVariation={(id, variationId) => void controller?.actions.applyVariation(id, variationId)}
        onRetry={(id) => controller?.actions.retryResponse(id)}
        onCheckBuild={(id) => void controller?.actions.checkBuild(id)}
      />
      <div class="sticky-lens">
        <LessonLensRegion
          controller={controller.lens}
          cue={controller.orchestrator.state.cue}
          presentation={controller.orchestrator.state.presentation}
          mode={controller.orchestrator.state.mode}
        />
      </div>
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
  .loading, .startup-error, .warning, .guidance { max-width: 900px; margin: 40px auto; padding: 20px; border-radius: 10px; background: white; }
  .warning { margin-block: 0 20px; background: #fff2db; color: #78521c; }
  .guidance { margin-block: 0 20px; background: #e7eff7; color: #274f70; }
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
