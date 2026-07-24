<script lang="ts">
  import { onMount, tick } from 'svelte';
  import type { LessonDefinitionV4 } from '@lol/lens-contracts';
  import LessonProgressRail from './LessonProgressRail.svelte';
  import LessonNarrative from './LessonNarrative.svelte';
  import LessonLensRegion from './LessonLensRegion.svelte';
  import LessonContextPanel from './LessonContextPanel.svelte';
  import type { LensDisplayMode } from './lens-display';
  import { browserSafeStorage } from '$lib/storage/safe-storage';
  import {
    createLessonSessionController,
    type LessonSessionController,
  } from './session.svelte';

  let { definition }: { definition: LessonDefinitionV4 } = $props();
  let controller = $state<LessonSessionController | null>(null);
  let startupError = $state('');
  let lensDisplayMode = $state<LensDisplayMode>('closed');
  let contextOpen = $state(false);
  let lessonScrollPosition = 0;
  let lensLauncher = $state<HTMLButtonElement | null>(null);
  let playerElement!: HTMLDivElement;
  let lastCueRevision = -1;
  const activeSection = $derived(
    controller
      ? definition.sections.find((section) => section.id === controller?.state.activeSectionId)
        ?? definition.sections[0]
      : definition.sections[0],
  );
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
        browserSafeStorage(window),
        forceNew,
      );
    } catch (error) {
      startupError = error instanceof Error ? error.message : String(error);
    }
  }

  async function restart() {
    if (!controller) return;
    lastCueRevision = -1;
    controller = await controller.actions.restart();
  }

  function modeForPresentation(presentation: 'quiet' | 'visible' | 'focus'): LensDisplayMode {
    return presentation === 'quiet' ? 'closed' : 'open';
  }

  async function focusLensHeading() {
    await tick();
    document.getElementById('lesson-lens-heading')?.focus({ preventScroll: true });
  }

  async function openLens(event?: MouseEvent) {
    if (!controller || controller.orchestrator.state.presentation === 'quiet') return;
    lessonScrollPosition = window.scrollY;
    if (event?.currentTarget instanceof HTMLButtonElement) {
      lensLauncher = event.currentTarget;
    }
    lensDisplayMode = 'open';
    contextOpen = false;
    await focusLensHeading();
  }

  async function closeLens() {
    lensDisplayMode = 'closed';
    contextOpen = false;
    await tick();
    window.scrollTo({ top: lessonScrollPosition, behavior: 'instant' });
    lensLauncher?.focus({ preventScroll: true });
  }

  async function toggleFocus() {
    lensDisplayMode = lensDisplayMode === 'focus' ? 'open' : 'focus';
    contextOpen = false;
    await focusLensHeading();
  }

  function handleKeydown(event: KeyboardEvent) {
    if (
      event.key === 'Tab'
      && lensDisplayMode !== 'closed'
      && window.innerWidth < 1024
    ) {
      const focusRoot = playerElement.querySelector(
        contextOpen ? '.context-host.context-open' : '.lens-host',
      );
      const focusable = Array.from(
        focusRoot?.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ) ?? [],
      ).filter((element) => element.getClientRects().length > 0);
      if (focusable.length) {
        const first = focusable[0];
        const last = focusable.at(-1)!;
        if (event.shiftKey && (document.activeElement === first || !focusRoot?.contains(document.activeElement))) {
          last.focus();
          event.preventDefault();
        } else if (!event.shiftKey && (document.activeElement === last || !focusRoot?.contains(document.activeElement))) {
          first.focus();
          event.preventDefault();
        }
      }
      return;
    }
    if (event.key !== 'Escape' || lensDisplayMode === 'closed') return;
    event.preventDefault();
    if (contextOpen) {
      contextOpen = false;
    } else if (lensDisplayMode === 'focus') {
      void toggleFocus();
    } else {
      void closeLens();
    }
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

  $effect(() => {
    if (!controller) return;
    const revision = controller.orchestrator.state.transitionRevision;
    const presentation = controller.orchestrator.state.presentation;
    if (revision === lastCueRevision) return;
    lastCueRevision = revision;
    const nextMode = modeForPresentation(presentation);
    if (nextMode !== 'closed' && lensDisplayMode === 'closed') {
      lessonScrollPosition = window.scrollY;
    }
    lensDisplayMode = nextMode;
    contextOpen = false;
    if (nextMode !== 'closed') void focusLensHeading();
  });
</script>

<svelte:window onkeydown={handleKeydown} />

<div bind:this={playerElement} class="lesson-player" data-testid="phase-2-lesson-player" data-schema-version={definition.schemaVersion}>
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
        {controller.state.persistenceWarning
          ?? controller.lens.state.persistenceWarning
          ?? 'Progress could not be saved to browser storage. You can continue this lesson.'}
      </div>
    {/if}
    {#if controller.state.interactionMessage}
      <div class="guidance" data-testid="lesson-interaction-message" role="status">
        {controller.state.interactionMessage}
      </div>
    {/if}

    <div
      class="lesson-layout"
      class:mode-closed={lensDisplayMode === 'closed'}
      class:mode-open={lensDisplayMode === 'open'}
      class:mode-focus={lensDisplayMode === 'focus'}
      data-testid="lesson-layout"
      data-lens-display-mode={lensDisplayMode}
    >
      <div class="rail-host">
        <LessonProgressRail
          {definition}
          activeSectionId={controller.state.activeSectionId}
          completedSectionIds={controller.state.completedSectionIds}
          collapsed={lensDisplayMode !== 'closed'}
          onReturnToLesson={() => void closeLens()}
          onSelect={(id) => {
            void controller?.actions.setActiveSection(id);
            if (lensDisplayMode === 'closed') {
              document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
            }
          }}
          onRestart={() => void restart()}
        />
      </div>

      <div
        class="lesson-column"
        aria-hidden={lensDisplayMode !== 'closed'}
        inert={lensDisplayMode !== 'closed'}
      >
        <div class="lens-launch">
          <div>
            <strong>{controller.orchestrator.state.presentation === 'quiet' ? 'Lens is waiting' : 'Inspect this step in Lens'}</strong>
            <span>
              {controller.orchestrator.state.presentation === 'quiet'
                ? (controller.orchestrator.state.cue.instruction ?? 'Complete the current lesson prompt to unlock Lens.')
                : 'Keep this lesson context while giving the visualization room to work.'}
            </span>
          </div>
          <button
            bind:this={lensLauncher}
            type="button"
            class="btn-primary"
            disabled={controller.orchestrator.state.presentation === 'quiet'}
            aria-describedby="lens-launch-description"
            onclick={openLens}
            data-testid="open-lesson-lens"
          >Open Lens</button>
          <span id="lens-launch-description" class="sr-only">
            {controller.orchestrator.state.presentation === 'quiet'
              ? 'Lens becomes available after the current lesson prompt.'
              : 'Open the lesson-integrated Lens workspace.'}
          </span>
        </div>
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
      </div>

      {#if lensDisplayMode === 'open'}
        <div class="context-host" class:context-open={contextOpen}>
          <button
            type="button"
            class="context-scrim"
            aria-label="Close lesson context"
            onclick={() => (contextOpen = false)}
          ></button>
          <LessonContextPanel
            {definition}
            activeSectionId={activeSection.id}
            cue={controller.orchestrator.state.cue}
            responses={controller.state.responses}
            onReturn={() => void closeLens()}
          />
        </div>
      {/if}

      <div
        class="lens-host"
        aria-hidden={lensDisplayMode === 'closed'}
        inert={lensDisplayMode === 'closed'}
      >
        <LessonLensRegion
          controller={controller.lens}
          cue={controller.orchestrator.state.cue}
          presentation={controller.orchestrator.state.presentation}
          mode={controller.orchestrator.state.mode}
          displayMode={lensDisplayMode}
          contextAvailable={lensDisplayMode === 'open'}
          onClose={() => void closeLens()}
          onToggleFocus={() => void toggleFocus()}
          onShowContext={() => (contextOpen = true)}
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
  .lesson-layout { width: min(100%, 1780px); margin: 0 auto; display: grid; align-items: start; transition: grid-template-columns .22s ease; }
  .lesson-layout.mode-closed { grid-template-columns: 220px minmax(0, 1fr); gap: 20px; }
  .lesson-layout.mode-open { grid-template-columns: 64px minmax(260px, 24%) minmax(0, 1fr); }
  .lesson-layout.mode-focus { grid-template-columns: 64px minmax(0, 1fr); }
  .rail-host { min-width: 0; }
  .lesson-column { min-width: 0; }
  .mode-open .lesson-column, .mode-focus .lesson-column { display: none; }
  .lens-launch { display: flex; justify-content: space-between; gap: 18px; align-items: center; margin-bottom: 18px; padding: 14px 16px; border: 1px solid var(--line-soft); border-radius: 12px; background: #fffaf2; }
  .lens-launch div { display: grid; gap: 3px; }
  .lens-launch span { color: var(--ink-secondary); font-size: var(--text-sm); }
  .lens-launch button:disabled { cursor: not-allowed; opacity: .52; }
  .context-host, .lens-host { min-width: 0; }
  .lens-host { position: sticky; top: 0; height: 100vh; overflow: auto; opacity: 1; transition: opacity .18s ease, transform .22s ease; }
  .mode-closed .lens-host { position: absolute; width: 1px; height: 1px; overflow: hidden; opacity: 0; pointer-events: none; }
  .mode-focus .lens-host { grid-column: 2; }
  .context-scrim { display: none; }
  .loading, .startup-error, .warning, .guidance { max-width: 900px; margin: 40px auto; padding: 20px; border-radius: 10px; background: white; }
  .warning { margin-block: 0 20px; background: #fff2db; color: #78521c; }
  .guidance { margin-block: 0 20px; background: #e7eff7; color: #274f70; }
  @media (min-width: 1024px) and (max-width: 1279px) {
    .lesson-layout.mode-open { grid-template-columns: 56px minmax(220px, 260px) minmax(0, 1fr); }
    .lesson-layout.mode-focus { grid-template-columns: 56px minmax(0, 1fr); }
  }
  @media (max-width: 1023px) {
    .lesson-layout.mode-closed { grid-template-columns: minmax(0, 1fr); }
    .mode-closed .rail-host { margin-bottom: 16px; }
    .lesson-layout.mode-open, .lesson-layout.mode-focus { grid-template-columns: 56px minmax(0, 1fr); }
    .mode-open .rail-host, .mode-focus .rail-host { position: fixed; inset: 0 auto 0 0; z-index: 111; width: 56px; overflow: auto; background: #fffaf2; }
    .mode-open .lens-host, .mode-focus .lens-host { position: fixed; inset: 0 0 0 56px; z-index: 110; grid-column: 2; height: 100dvh; background: #f7f5ef; }
    .context-host { position: fixed; inset: 0; z-index: 120; pointer-events: none; }
    .context-host :global(.lesson-context) { position: absolute; top: 0; bottom: 0; left: 56px; z-index: 2; width: min(340px, calc(100vw - 56px)); max-height: none; transform: translateX(-110%); transition: transform .22s ease; }
    .context-host.context-open { pointer-events: auto; }
    .context-host.context-open :global(.lesson-context) { transform: translateX(0); }
    .context-scrim { position: absolute; inset: 0; display: block; width: 100%; border: 0; background: rgba(29, 31, 29, .32); opacity: 0; transition: opacity .18s ease; }
    .context-open .context-scrim { opacity: 1; }
  }
  @media (max-width: 767px) {
    .lesson-player { padding-inline: 10px; }
    .lesson-header div { display: grid; }
    .mode-open .rail-host, .mode-focus .rail-host { display: none; }
    .lesson-layout.mode-open, .lesson-layout.mode-focus { grid-template-columns: minmax(0, 1fr); }
    .mode-open .lens-host, .mode-focus .lens-host { position: fixed; inset: 0; z-index: 110; grid-column: 1; height: 100dvh; background: #f7f5ef; }
    .context-host :global(.lesson-context) { left: 0; width: min(340px, 90vw); }
  }
  @media (prefers-reduced-motion: reduce) {
    .lesson-layout, .lens-host, .context-host :global(.lesson-context), .context-scrim { transition: none; }
  }
</style>
