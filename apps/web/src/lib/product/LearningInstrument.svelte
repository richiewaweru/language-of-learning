<script lang="ts">
  import type { DemoPack } from './loadDemoPack';
  import type { Selection } from '@lol/lens-contracts';
  import {
    resolveSelection,
    resolveTruthDetail,
  } from '@lol/lens-scenes';
  import CodePanel from './CodePanel.svelte';
  import ExplanationPanel from './ExplanationPanel.svelte';
  import StepProgress from './StepProgress.svelte';
  import TruthDrawer from './TruthDrawer.svelte';
  import VisualLearningStage from '$lib/learner-ui/lesson/VisualLearningStage.svelte';
  import { semanticEventHeadline } from '$lib/learner-ui/projection/deriveSemanticProjections';

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

  const stepIndex = $derived(Math.min(Math.max(selection.stepIndex ?? 0, 0), pack.scene.steps.length - 1));
  const sceneStep = $derived(pack.semanticScene.steps[stepIndex]);
  const stepLabel = $derived(
    sceneStep ? semanticEventHeadline(sceneStep, pack.semanticScene.steps.length) : '',
  );
  const learnerCaption = $derived(
    sceneStep
      ? sceneStep.activeEvent.type + ' — ' + Object.values(sceneStep.caption.variables).join(', ')
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

  const callExpression = $derived(
    pack.trace.scope.kind === 'function' && pack.argsRepr.length
      ? `${pack.trace.scope.label}(${pack.argsRepr.join(', ')})`
      : '',
  );
</script>

<section class="instrument" class:compact data-testid="learning-instrument">
  <StepProgress
    {stepLabel}
    stepIndex={stepIndex}
    totalSteps={pack.semanticScene.steps.length}
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
          {callExpression}
        />
      </div>
      <div class="panel visual" class:hidden={compact && mobileTab !== 'visual'}>
        <VisualLearningStage
          scene={pack.scene}
          semanticScene={pack.semanticScene}
          graph={pack.graph}
          trace={pack.trace}
          source={pack.source}
          {selection}
          onselectionchange={handleSelectionChange}
          {reducedMotion}
          technicalMode={showTechnical}
        />
      </div>
      <div class="panel explain" class:hidden={compact && mobileTab !== 'explain'}>
        <ExplanationPanel caption={learnerCaption} />
      </div>
    </div>
  </div>

  {#if reducedMotion}
    <p class="reduced-note">
      Reduced motion: stepping shows the same semantic states without travel animation.
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

</style>
