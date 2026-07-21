<script lang="ts">
  import type { DemoPack } from './loadDemoPack';
  import type { Selection } from '@lol/lens-contracts';
  import {
    deriveStepLabel,
    deriveLearnerCaption,
    resolveSelection,
    resolveTruthDetail,
  } from '@lol/lens-scenes';
  import CodePanel from './CodePanel.svelte';
  import StructuralCanvas from './StructuralCanvas.svelte';
  import ExplanationPanel from './ExplanationPanel.svelte';
  import StepProgress from './StepProgress.svelte';
  import StaticSceneFallback from './StaticSceneFallback.svelte';
  import TruthDrawer from './TruthDrawer.svelte';

  let {
    pack,
    compact = false,
    showTruthDrawer = true,
    autoplayAllowed = true,
    initialStep = 0,
  }: {
    pack: DemoPack;
    compact?: boolean;
    showTruthDrawer?: boolean;
    autoplayAllowed?: boolean;
    initialStep?: number;
  } = $props();

  function createInitialSelection(): Selection {
    return { stepIndex: initialStep };
  }

  let selection = $state<Selection>(createInitialSelection());
  let mobileTab = $state<'code' | 'visual' | 'explain'>('visual');
  let drawerOpen = $state(false);
  let showTechnical = $state(false);
  let useStatic = $state(false);

  const stepIndex = $derived(Math.min(Math.max(selection.stepIndex ?? 0, 0), pack.scene.steps.length - 1));
  const currentStep = $derived(pack.trace.steps[stepIndex]);
  const sceneStep = $derived(pack.scene.steps[stepIndex]);
  const stepLabel = $derived(
    currentStep ? deriveStepLabel(pack.graph, currentStep, pack.trace) : '',
  );
  const learnerCaption = $derived(
    currentStep
      ? deriveLearnerCaption(pack.graph, currentStep, pack.trace, sceneStep)
      : '',
  );
  const truthDetail = $derived(
    resolveTruthDetail(selection, pack.graph, pack.trace, pack.scene, stepIndex),
  );

  const reducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function handleLineSelect(line: number) {
    const resolved = resolveSelection({ line, stepIndex }, pack.graph, pack.trace, pack.scene.layout);
    selection = {
      line,
      stepIndex: resolved.stepIndex ?? stepIndex,
      nodeId: resolved.primaryNodeId,
    };
    if (showTruthDrawer) drawerOpen = true;
  }

  function handleSelectionChange(next: Selection) {
    selection = next;
    if (showTruthDrawer && (next.nodeId || next.line)) drawerOpen = true;
  }

  const callDisplay = $derived(pack.argsRepr[0] ?? '[2, 4, 6, 8]');
</script>

<section class="instrument" class:compact data-testid="learning-instrument">
  <StepProgress
    {stepLabel}
    stepIndex={stepIndex}
    totalSteps={pack.scene.steps.length}
  />

  {#if compact}
    <p class="instruction">Press Play to watch values move through the loop.</p>
  {/if}

  <div class="stage" class:mobile-tabs={compact}>
    {#if compact}
      <div class="tabs" role="tablist" aria-label="View mode">
        {#each ['code', 'visual', 'explain'] as tab}
          <button
            type="button"
            role="tab"
            aria-selected={mobileTab === tab}
            class:active={mobileTab === tab}
            onclick={() => (mobileTab = tab as typeof mobileTab)}
          >
            {tab === 'code' ? 'Code' : tab === 'visual' ? 'Visual' : 'Explain'}
          </button>
        {/each}
      </div>
    {/if}

    <div class="panels">
      <div class="panel code" class:hidden={compact && mobileTab !== 'code'}>
        <CodePanel
          source={pack.source}
          graph={pack.graph}
          trace={pack.trace}
          {selection}
          onLineSelect={handleLineSelect}
          callArgs={callDisplay}
        />
      </div>
      <div class="panel visual" class:hidden={compact && mobileTab !== 'visual'}>
        {#if useStatic || (reducedMotion && !autoplayAllowed)}
          <StaticSceneFallback scene={pack.scene} stepIndex={stepIndex} />
        {:else}
          <StructuralCanvas
            scene={pack.scene}
            graph={pack.graph}
            trace={pack.trace}
            {selection}
            onselectionchange={handleSelectionChange}
            {reducedMotion}
          />
        {/if}
      </div>
      <div class="panel explain" class:hidden={compact && mobileTab !== 'explain'}>
        <ExplanationPanel caption={learnerCaption} />
      </div>
    </div>
  </div>

  {#if reducedMotion}
    <p class="reduced-note">
      Reduced motion: stepping shows state changes without travel animation.
      <button type="button" class="link-btn" onclick={() => (useStatic = !useStatic)}>
        {useStatic ? 'Show interactive' : 'Show static fallback'}
      </button>
    </p>
  {/if}

  <TruthDrawer
    detail={truthDetail}
    open={drawerOpen && showTruthDrawer}
    onClose={() => (drawerOpen = false)}
    {showTechnical}
    onToggleTechnical={(v) => (showTechnical = v)}
  />
</section>

<style>
  .instrument {
    background: var(--surface-paper);
    border: var(--border-w) solid var(--line-default);
    border-radius: var(--radius-lg);
    box-shadow: var(--shadow-md);
    padding: var(--space-5);
  }

  .instrument.compact {
    padding: var(--space-4);
  }

  .instruction {
    font-size: var(--text-sm);
    color: var(--ink-muted);
    margin: 0 0 var(--space-4);
  }

  .panels {
    display: grid;
    gap: var(--space-4);
  }

  @media (min-width: 900px) {
    .panels {
      grid-template-columns: 1fr 1.2fr;
      grid-template-rows: auto auto;
    }

    .panel.explain {
      grid-column: 1 / -1;
    }

    .instrument:not(.compact) .panel.explain {
      grid-column: 1 / -1;
    }
  }

  .panel.hidden {
    display: none;
  }

  @media (min-width: 900px) {
    .panel.hidden {
      display: block;
    }
  }

  .tabs {
    display: flex;
    gap: var(--space-2);
    margin-bottom: var(--space-3);
  }

  @media (min-width: 900px) {
    .tabs {
      display: none;
    }
  }

  .tabs button {
    flex: 1;
    padding: var(--space-2);
    border: 1px solid var(--line-default);
    background: var(--surface-raised);
    border-radius: var(--radius-xs);
    font-size: var(--text-sm);
    cursor: pointer;
  }

  .tabs button.active {
    border-color: var(--ink-strong);
    font-weight: 600;
  }

  .reduced-note {
    font-size: var(--text-xs);
    color: var(--ink-muted);
    margin: var(--space-3) 0 0;
  }

  .link-btn {
    background: none;
    border: none;
    color: var(--ink-strong);
    text-decoration: underline;
    cursor: pointer;
    font-size: inherit;
  }
</style>
