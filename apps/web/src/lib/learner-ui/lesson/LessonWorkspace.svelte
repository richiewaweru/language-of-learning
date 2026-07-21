<script lang="ts">
  import type { DemoPack } from '$lib/product/loadDemoPack';
  import type { Selection } from '@lol/lens-contracts';
  import {
    resolveSelection,
    resolveTruthDetail,
  } from '@lol/lens-scenes';
  import LessonStepHeader from './LessonStepHeader.svelte';
  import CodeLearningPanel from './CodeLearningPanel.svelte';
  import VisualLearningStage from './VisualLearningStage.svelte';
  import ExplanationSidebar from './ExplanationSidebar.svelte';
  import PlaybackTimeline from './PlaybackTimeline.svelte';
  import PatternSummaryBand from './PatternSummaryBand.svelte';
  import PredictionPrompt from '$lib/product/PredictionPrompt.svelte';
  import TruthDrawer from '$lib/product/TruthDrawer.svelte';

  let {
    pack,
    breadcrumbs = [],
    title,
    subtitle = '',
    explainSteps = [],
    patternSummary,
    prediction,
    progressPercent = 0,
    showTruthDrawer = false,
    autoplayAllowed = true,
    initialStep = 0,
  }: {
    pack: DemoPack;
    breadcrumbs?: Array<{ label: string; href?: string }>;
    title: string;
    subtitle?: string;
    explainSteps?: string[];
    patternSummary?: {
      pattern: string;
      description: string;
      whenToUse: string;
      examples: string[];
      related: string[];
    };
    prediction?: {
      prompt: string;
      options: Array<{ id: string; label: string }>;
      correctId: string;
      onAnswer?: (id: string, correct: boolean) => void;
      feedback?: string;
    };
    progressPercent?: number;
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

  const stepIndex = $derived(
    Math.min(Math.max(selection.stepIndex ?? 0, 0), pack.scene.steps.length - 1),
  );
  const sceneStep = $derived(pack.semanticScene.steps[stepIndex]);
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

  const callDisplay = $derived(pack.argsRepr[0] ?? '[]');

  const activeExplainStep = $derived(
    Math.min(
      Math.floor((stepIndex / Math.max(pack.scene.steps.length - 1, 1)) * explainSteps.length),
      explainSteps.length - 1,
    ),
  );
  const effectiveProgress = $derived(
    Math.max(progressPercent, Math.round(((stepIndex + 1) / pack.scene.steps.length) * 100)),
  );

  function handleLineSelect(line: number) {
    const resolved = resolveSelection(
      { line, stepIndex },
      pack.graph,
      pack.trace,
      pack.scene.layout,
    );
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
</script>

<section class="lesson-workspace" data-testid="lesson-workspace">
  <LessonStepHeader
    {breadcrumbs}
    {title}
    {subtitle}
    progressPercent={effectiveProgress}
  />

  {#if explainSteps.length === 0}
    <p class="sr-only">Interactive lesson workspace</p>
  {/if}

  <div class="mobile-tabs" role="tablist" aria-label="Workspace panels">
    {#each ['code', 'visual', 'explain'] as tab}
      <button
        type="button"
        role="tab"
        class:active={mobileTab === tab}
        onclick={() => (mobileTab = tab as typeof mobileTab)}
      >
        {tab === 'code' ? 'Code' : tab === 'visual' ? 'Visual' : 'Explain'}
      </button>
    {/each}
  </div>

  <div class="workspace-grid">
    <div class="col code" class:hidden={mobileTab !== 'code'}>
      <CodeLearningPanel
        source={pack.source}
        graph={pack.graph}
        trace={pack.trace}
        {selection}
        onLineSelect={handleLineSelect}
        callArgs={callDisplay}
      />
    </div>

    <div class="col visual" class:hidden={mobileTab !== 'visual'}>
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
      <PlaybackTimeline
        {stepIndex}
        totalSteps={pack.semanticScene.steps.length}
        {selection}
        onselectionchange={handleSelectionChange}
        {autoplayAllowed}
      />
    </div>

    <div class="col explain" class:hidden={mobileTab !== 'explain'}>
      <ExplanationSidebar
        steps={explainSteps.length ? explainSteps : ['Follow the execution step by step.']}
        activeStepIndex={activeExplainStep}
        caption={learnerCaption}
      />
      {#if prediction}
        <div class="prediction-wrap">
          <PredictionPrompt
            prompt={prediction.prompt}
            options={prediction.options}
            correctId={prediction.correctId}
            onAnswer={prediction.onAnswer}
            feedback={prediction.feedback ?? ''}
          />
        </div>
      {/if}
    </div>
  </div>

  {#if patternSummary}
    <PatternSummaryBand
      pattern={patternSummary.pattern}
      description={patternSummary.description}
      whenToUse={patternSummary.whenToUse}
      examples={patternSummary.examples}
      related={patternSummary.related}
    />
  {/if}

  <details class="technical-toggle">
    <summary>Technical details</summary>
    <p class="tech-hint">Raw graph, bindings, and trace events for advanced learners.</p>
    <button type="button" class="btn-secondary" onclick={() => (showTechnical = !showTechnical)}>
      {showTechnical ? 'Hide technical graph' : 'Show technical graph'}
    </button>
  </details>

  {#if showTruthDrawer}
    <TruthDrawer
      detail={truthDetail}
      open={drawerOpen}
      onClose={() => (drawerOpen = false)}
      {showTechnical}
      onToggleTechnical={(v) => (showTechnical = v)}
    />
  {/if}
</section>

<style>
  .lesson-workspace {
    display: flex;
    flex-direction: column;
    gap: var(--space-4);
  }

  .mobile-tabs {
    display: flex;
    gap: var(--space-2);
  }

  @media (min-width: 1024px) {
    .mobile-tabs {
      display: none;
    }
  }

  .mobile-tabs button {
    flex: 1;
    padding: var(--space-2);
    border: 1px solid var(--line-soft);
    background: var(--surface-primary);
    border-radius: var(--radius-sm);
    font-size: var(--text-sm);
    cursor: pointer;
  }

  .mobile-tabs button.active {
    border-color: var(--brand-blue);
    color: var(--brand-blue);
    font-weight: 600;
  }

  .workspace-grid {
    display: grid;
    gap: var(--space-5);
  }

  @media (min-width: 1024px) {
    .workspace-grid {
      grid-template-columns: minmax(240px, 1fr) minmax(320px, 1.6fr) minmax(260px, 1fr);
      align-items: start;
    }
  }

  .col.hidden {
    display: none;
  }

  @media (min-width: 1024px) {
    .col.hidden {
      display: block;
    }
  }

  .col.visual {
    display: flex;
    flex-direction: column;
    gap: var(--space-4);
  }

  .col.explain {
    display: flex;
    flex-direction: column;
    gap: var(--space-4);
  }

  .prediction-wrap :global(.prediction) {
    margin: 0;
    border: none;
    box-shadow: none;
    background: var(--warning-soft);
    border-radius: var(--radius-md);
    padding: var(--space-4);
  }

  .prediction-wrap :global(.prediction h2) {
    margin-bottom: var(--space-2);
  }

  .prediction-wrap :global(.prompt) {
    margin-bottom: var(--space-3);
    font-size: var(--text-xs);
    line-height: 1.45;
  }

  .prediction-wrap :global(.options) {
    flex-direction: row;
  }

  .prediction-wrap :global(.options button) {
    flex: 1;
    text-align: center;
    padding: var(--space-2);
  }

  .technical-toggle {
    margin-top: var(--space-4);
    font-size: var(--text-sm);
    color: var(--ink-muted);
  }

  .tech-hint {
    margin: var(--space-2) 0;
    font-size: var(--text-xs);
  }
</style>
