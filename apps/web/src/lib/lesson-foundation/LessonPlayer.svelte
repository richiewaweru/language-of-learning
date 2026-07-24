<script lang="ts">
  import { onMount, tick } from 'svelte';
  import type { LessonDefinitionV4 } from '@lol/lens-contracts';
  import LessonHeader from './LessonHeader.svelte';
  import LessonPathway from './LessonPathway.svelte';
  import LessonNarrative from './LessonNarrative.svelte';
  import LessonNavigation from './LessonNavigation.svelte';
  import LessonLensRegion from './LessonLensRegion.svelte';
  import type { LessonCheckAction } from './lesson-actions';
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
  let checkAction = $state<LessonCheckAction | null>(null);
  let lessonScrollPosition = 0;
  let lensLauncher = $state<HTMLButtonElement | null>(null);
  let playerElement!: HTMLDivElement;
  let previousBodyOverflow = '';

  const activeSectionIndex = $derived(
    controller
      ? Math.max(
          0,
          definition.sections.findIndex(
            (section) => section.id === controller?.state.activeSectionId,
          ),
        )
      : 0,
  );
  const activeSection = $derived(
    definition.sections[activeSectionIndex] ?? definition.sections[0],
  );
  const activeCue = $derived(
    definition.cues.find((cue) => cue.id === activeSection.lensCueId)
      ?? definition.cues[0],
  );
  const requiredResponse = $derived(
    activeCue.requiresResponseId && controller
      ? controller.state.responses[activeCue.requiresResponseId]
      : undefined,
  );
  const lensAvailable = $derived(
    activeCue.presentation !== 'quiet'
      && (!activeCue.requiresResponseId || Boolean(
        requiredResponse && requiredResponse.status !== 'draft',
      )),
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

  async function boot() {
    try {
      controller = await createLessonSessionController(
        definition,
        browserSafeStorage(window),
      );
    } catch (error) {
      startupError = error instanceof Error ? error.message : String(error);
    }
  }

  async function restart() {
    if (!controller) return;
    if (lensDisplayMode === 'focus') unlockBodyScroll();
    lensDisplayMode = 'closed';
    contextOpen = false;
    checkAction = null;
    controller = await controller.actions.restart();
  }

  async function focusLensHeading() {
    await tick();
    document.getElementById('lesson-lens-heading')?.focus({ preventScroll: true });
  }

  function lockBodyScroll() {
    previousBodyOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
  }

  function unlockBodyScroll() {
    document.body.style.overflow = previousBodyOverflow;
  }

  async function openLens(event?: MouseEvent) {
    if (!controller || !lensAvailable) return;
    lessonScrollPosition = window.scrollY;
    if (event?.currentTarget instanceof HTMLButtonElement) {
      lensLauncher = event.currentTarget;
    }
    lensDisplayMode = 'open';
    contextOpen = false;
    await focusLensHeading();
  }

  async function closeLens() {
    if (lensDisplayMode === 'focus') unlockBodyScroll();
    lensDisplayMode = 'closed';
    contextOpen = false;
    await tick();
    window.scrollTo({ top: lessonScrollPosition, behavior: 'instant' });
    lensLauncher?.focus({ preventScroll: true });
  }

  async function enterFocus() {
    if (lensDisplayMode !== 'open') return;
    lensDisplayMode = 'focus';
    contextOpen = false;
    lockBodyScroll();
    await focusLensHeading();
  }

  async function selectSection(sectionId: string) {
    if (!controller) return;
    await controller.actions.setActiveSection(sectionId);
    const section = definition.sections.find((candidate) => candidate.id === sectionId);
    const cue = definition.cues.find((candidate) => candidate.id === section?.lensCueId);
    const response = cue?.requiresResponseId
      ? controller.state.responses[cue.requiresResponseId]
      : undefined;
    const available = Boolean(
      cue
      && cue.presentation !== 'quiet'
      && (!cue.requiresResponseId || (response && response.status !== 'draft')),
    );
    if (lensDisplayMode !== 'closed' && !available) {
      await closeLens();
    }
    window.scrollTo({ top: 0, behavior: 'instant' });
  }

  function moveSection(offset: number) {
    const next = activeSectionIndex + offset;
    if (next < 0 || next >= definition.sections.length) return;
    void selectSection(definition.sections[next].id);
  }

  function focusableWithin(root: Element | null) {
    return Array.from(
      root?.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])',
      ) ?? [],
    ).filter((element) => element.getClientRects().length > 0);
  }

  function handleKeydown(event: KeyboardEvent) {
    const mobileAttached = lensDisplayMode === 'open' && window.innerWidth <= 900;
    if (event.key === 'Escape' && lensDisplayMode !== 'closed') {
      event.preventDefault();
      if (contextOpen) {
        contextOpen = false;
      } else {
        void closeLens();
      }
      return;
    }
    if (event.key !== 'Tab' || (lensDisplayMode !== 'focus' && !mobileAttached)) return;
    const root = playerElement.querySelector(
      contextOpen ? '.lesson-column' : '.lens-host',
    );
    const focusable = focusableWithin(root);
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable.at(-1)!;
    if (event.shiftKey && (document.activeElement === first || !root?.contains(document.activeElement))) {
      last.focus();
      event.preventDefault();
    } else if (!event.shiftKey && (document.activeElement === last || !root?.contains(document.activeElement))) {
      first.focus();
      event.preventDefault();
    }
  }

  function revealResponse(id: string, correct: boolean, feedback: string) {
    controller?.actions.revealResponse(id, correct, feedback);
  }

  onMount(() => {
    void boot();
    return () => unlockBodyScroll();
  });
</script>

<svelte:window onkeydown={handleKeydown} />

<div
  bind:this={playerElement}
  class="lesson-player"
  class:context-open={contextOpen}
  data-testid="phase-2-lesson-player"
  data-schema-version={definition.schemaVersion}
>
  {#if startupError}
    <div class="startup-error" role="alert">The lesson could not start. {startupError}</div>
  {:else if !controller}
    <div class="loading" data-testid="lesson-hydrating">Restoring your lesson…</div>
  {:else}
    <div
      class="lesson-background"
      aria-hidden={lensDisplayMode === 'focus'}
      inert={lensDisplayMode === 'focus'}
    >
      <div class="lesson-chrome">
        <LessonHeader
          courseId={definition.courseId}
          goal={definition.goal}
          activeIndex={activeSectionIndex}
          stepCount={definition.sections.length}
          onRestart={() => void restart()}
        />
        <LessonPathway
          {definition}
          activeSectionId={controller.state.activeSectionId}
          completedSectionIds={controller.state.completedSectionIds}
          onSelect={(id) => void selectSection(id)}
        />
      </div>

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
    </div>

    <div
      class="lesson-layout"
      class:mode-closed={lensDisplayMode === 'closed'}
      class:mode-open={lensDisplayMode === 'open'}
      class:mode-focus={lensDisplayMode === 'focus'}
      data-testid="lesson-layout"
      data-lens-display-mode={lensDisplayMode}
    >
      <main
        class="lesson-column"
        aria-hidden={lensDisplayMode === 'focus'}
        inert={lensDisplayMode === 'focus'}
      >
        <div class="activity-shell">
          {#if definition.subtitle}<p class="lesson-subtitle">{definition.subtitle}</p>{/if}

          {#if activeCue.presentation !== 'quiet'}
            <aside class="lens-launch" data-testid="lesson-lens-invitation">
              <span class="lens-icon" aria-hidden="true">◉</span>
              <div>
                <strong>See it in action</strong>
                <p>
                  {lensAvailable
                    ? 'Open the Lens to visualize the flow of values.'
                    : (activeCue.instruction ?? 'Complete this step to unlock Lens.')}
                </p>
              </div>
              <button
                bind:this={lensLauncher}
                type="button"
                disabled={!lensAvailable}
                onclick={openLens}
                data-testid="open-lesson-lens"
              >Open Lens <span aria-hidden="true">↗</span></button>
            </aside>
          {/if}

          <LessonNarrative
            {definition}
            activeSectionId={controller.state.activeSectionId}
            completedSectionIds={controller.state.completedSectionIds}
            responses={controller.state.responses}
            {bindings}
            comparison={controller.state.comparison}
            onDraft={(id, answer) => controller?.actions.setResponseDraft(id, answer)}
            onCommit={(id, correct, feedback) => controller?.actions.commitResponse(id, correct, feedback)}
            onRevealPrediction={revealResponse}
            onApplyVariation={(id, variationId) => void controller?.actions.applyVariation(id, variationId)}
            onRetry={(id) => controller?.actions.retryResponse(id)}
            onCheckBuild={(id) => controller?.actions.checkBuild(id)}
            onCheckActionChange={(action) => (checkAction = action)}
          />
        </div>

        <div class="navigation-host">
          <LessonNavigation
            {checkAction}
            canGoBack={activeSectionIndex > 0}
            canGoNext={activeSectionIndex < definition.sections.length - 1}
            onBack={() => moveSection(-1)}
            onNext={() => moveSection(1)}
          />
        </div>
      </main>

      {#if lensDisplayMode === 'open'}
        <button
          type="button"
          class="context-scrim"
          aria-label="Close lesson context"
          onclick={() => (contextOpen = false)}
        ></button>
      {/if}

      <div
        class="lens-host"
        aria-hidden={lensDisplayMode === 'closed'}
        inert={lensDisplayMode === 'closed'}
        role={lensDisplayMode === 'focus' ? 'dialog' : undefined}
        aria-modal={lensDisplayMode === 'focus' ? 'true' : undefined}
        aria-labelledby={lensDisplayMode === 'focus' ? 'lesson-lens-heading' : undefined}
      >
        <LessonLensRegion
          controller={controller.lens}
          cue={controller.orchestrator.state.cue}
          presentation={controller.orchestrator.state.presentation}
          mode={controller.orchestrator.state.mode}
          displayMode={lensDisplayMode}
          contextAvailable={lensDisplayMode === 'open'}
          onClose={() => void closeLens()}
          onToggleFocus={() => void enterFocus()}
          onShowContext={() => (contextOpen = true)}
        />
      </div>
    </div>

    {#if lensDisplayMode === 'focus'}
      <button
        class="focus-scrim"
        type="button"
        aria-label="Close Lens"
        onclick={() => void closeLens()}
      ></button>
    {/if}

    <small class="sr-only" data-testid="lesson-attempt-id">{controller.state.attemptId}</small>
  {/if}
</div>

<style>
  .lesson-player { min-height: 100vh; background: #f8f4ec; color: var(--ink-primary); }
  .lesson-chrome { position: sticky; top: 0; z-index: 30; }
  .lesson-layout { position: relative; width: 100%; min-width: 0; }
  .lesson-column { min-width: 0; }
  .activity-shell { display: flex; width: min(100%, 1220px); margin: 0 auto; padding: 42px clamp(18px, 4vw, 64px) 30px; flex-direction: column; }
  .lesson-subtitle { margin: 0 0 18px; color: var(--ink-secondary); font-size: 18px; line-height: 1.55; }
  .lens-launch { display: grid; grid-template-columns: auto 1fr auto; gap: 16px; align-items: center; margin: 0 0 18px; padding: 18px 20px; border: 1px solid var(--line-soft); border-radius: 12px; background: #fffdf8; }
  .lens-icon { display: grid; place-items: center; width: 54px; height: 54px; border-radius: 50%; background: #e8f3ec; color: #236b54; font-size: 24px; }
  .lens-launch strong { display: block; margin-bottom: 4px; }
  .lens-launch p { margin: 0; color: var(--ink-secondary); font-size: var(--text-sm); line-height: 1.45; }
  .lens-launch button { min-height: 42px; padding: 0 16px; border: 1px solid var(--line-medium); border-radius: 8px; background: white; color: var(--ink-primary); font-weight: 700; cursor: pointer; }
  .lens-launch button:disabled { cursor: default; opacity: .48; }
  .navigation-host { position: sticky; bottom: 0; z-index: 15; }
  .lens-host { min-width: 0; }
  .mode-closed .lens-host { position: absolute; width: 1px; height: 1px; overflow: hidden; opacity: 0; pointer-events: none; }

  .mode-open {
    display: grid;
    grid-template-columns: minmax(340px, 30%) minmax(0, 70%);
    gap: 1px;
    min-height: calc(100vh - 182px);
    background: var(--line-soft);
  }
  .mode-open .lesson-column { display: flex; min-height: calc(100vh - 182px); flex-direction: column; background: #f8f4ec; }
  .mode-open .activity-shell { flex: 1; padding: 24px 20px; }
  .mode-open .lesson-subtitle { font-size: var(--text-sm); }
  .mode-open :global(.narrative section) { padding: 24px 18px; }
  .mode-open :global(.narrative h1) { font-size: clamp(28px, 2.3vw, 38px); }
  .mode-open .lens-launch { order: 3; grid-template-columns: auto 1fr; margin: 18px 0 0; padding: 14px; }
  .mode-open .lens-launch button { grid-column: 2; justify-self: start; }
  .mode-open .lens-icon { width: 42px; height: 42px; }
  .mode-open .lens-host { min-height: calc(100vh - 182px); background: #f7f5ef; }

  .focus-scrim { position: fixed; inset: 0; z-index: 80; width: 100%; border: 0; background: rgba(25, 29, 27, .52); backdrop-filter: blur(2px); }
  .mode-focus .lens-host {
    position: fixed;
    inset: 50% auto auto 50%;
    z-index: 90;
    width: min(1180px, calc(100vw - 40px));
    height: min(760px, calc(100dvh - 48px));
    overflow: auto;
    transform: translate(-50%, -50%);
    border-radius: 16px;
    background: #f7f5ef;
    box-shadow: 0 32px 90px rgba(19, 28, 24, .28);
  }

  .context-scrim { display: none; }
  .loading, .startup-error, .warning, .guidance { max-width: 900px; margin: 40px auto; padding: 20px; border-radius: 10px; background: white; }
  .warning { margin-block: 18px; background: #fff2db; color: #78521c; }
  .guidance { margin-block: 18px; background: #e7eff7; color: #274f70; }

  @media (max-width: 900px) {
    .mode-open { display: block; min-height: 0; background: transparent; }
    .mode-open .lens-host {
      position: fixed;
      inset: 0;
      z-index: 60;
      height: 100dvh;
      overflow: auto;
    }
    .mode-open .lesson-column {
      position: fixed;
      inset: 0 auto 0 0;
      z-index: 72;
      width: min(430px, 90vw);
      height: 100dvh;
      overflow: auto;
      transform: translateX(-105%);
      transition: transform .22s ease;
      box-shadow: 18px 0 48px rgba(22, 29, 26, .16);
    }
    .context-open .mode-open .lesson-column { transform: translateX(0); }
    .context-scrim { position: fixed; inset: 0; z-index: 70; display: block; width: 100%; border: 0; background: rgba(24, 29, 27, .4); opacity: 0; pointer-events: none; transition: opacity .18s ease; }
    .context-open .context-scrim { opacity: 1; pointer-events: auto; }
    .mode-open .navigation-host { margin-top: auto; }
  }
  @media (max-width: 640px) {
    .activity-shell { padding: 24px 10px; }
    .lens-launch { grid-template-columns: auto 1fr; padding: 14px; }
    .lens-launch button { grid-column: 2; justify-self: start; }
    .lens-icon { width: 42px; height: 42px; }
    .mode-focus .lens-host { width: calc(100vw - 16px); height: calc(100dvh - 16px); border-radius: 12px; }
  }
  @media (prefers-reduced-motion: reduce) {
    .mode-open .lesson-column, .context-scrim { transition: none; }
  }
</style>
