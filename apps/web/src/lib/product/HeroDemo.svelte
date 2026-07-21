<script lang="ts">
  import type { DemoPack } from './loadDemoPack';
  import type { Selection } from '@lol/lens-contracts';
  import { resolveSelection } from '@lol/lens-scenes';
  import CodeLearningPanel from '$lib/learner-ui/lesson/CodeLearningPanel.svelte';
  import LearnerFlowView from '$lib/learner-ui/lesson/LearnerFlowView.svelte';
  import PlaybackTimeline from '$lib/learner-ui/lesson/PlaybackTimeline.svelte';
  import { deriveFlowProjection } from '$lib/learner-ui/projection/deriveSemanticProjections';

  let { pack }: { pack: DemoPack } = $props();

  function findInitialStep() {
    return pack.trace.steps
      .map((step, index) => ({ type: step.event.type, index }))
      .filter((step) => step.type === 'state_change')
      .at(-2)?.index ?? 0;
  }

  let selection = $state<Selection>({ stepIndex: findInitialStep() });
  const stepIndex = $derived(selection.stepIndex ?? 0);
  const projection = $derived(deriveFlowProjection(pack.semanticScene, stepIndex));

  function selectLine(line: number) {
    const resolved = resolveSelection(
      { line, stepIndex },
      pack.graph,
      pack.trace,
      pack.scene.layout,
    );
    selection = { line, stepIndex: resolved.stepIndex, nodeId: resolved.primaryNodeId };
  }
</script>

<div class="hero-demo" data-testid="hero-demo">
  <div class="demo-code">
    <CodeLearningPanel
      source={pack.source}
      graph={pack.graph}
      trace={pack.trace}
      {selection}
      onLineSelect={selectLine}
      callArgs={pack.argsRepr[0] ?? '[]'}
    />
  </div>
  <div class="demo-flow surface-card">
    <div class="demo-tabs"><strong>Flow</strong><span>State</span><span>Guided Trace</span></div>
    <LearnerFlowView {projection} />
    <PlaybackTimeline
      {stepIndex}
      totalSteps={pack.semanticScene.steps.length}
      {selection}
      onselectionchange={(next) => (selection = next)}
    />
  </div>
</div>

<style>
  .hero-demo {
    width: 100%;
    display: grid;
    grid-template-columns: minmax(230px, .8fr) minmax(390px, 1.45fr);
    gap: var(--space-4);
    align-items: stretch;
  }

  .demo-code :global([data-testid='code-learning-panel']) {
    min-height: 0;
    height: 100%;
  }

  .demo-code :global(.code) {
    padding: var(--space-3);
    font-size: 12px;
  }

  .demo-code :global(.line) {
    padding-inline: var(--space-1);
  }

  .demo-flow {
    overflow: hidden;
  }

  .demo-flow :global([data-testid='playback-timeline']) {
    border: 0;
    border-top: 1px solid var(--line-soft);
    border-radius: 0;
  }

  .demo-flow :global([data-testid='learner-flow-view']) {
    min-height: 300px;
  }

  .demo-tabs {
    display: flex;
    gap: var(--space-5);
    padding: var(--space-3) var(--space-4);
    border-bottom: 1px solid var(--line-soft);
    color: var(--ink-muted);
    font-size: var(--text-xs);
  }

  .demo-tabs strong {
    color: var(--brand-blue);
  }

  @media (max-width: 760px) {
    .hero-demo { grid-template-columns: 1fr; }
  }
</style>
