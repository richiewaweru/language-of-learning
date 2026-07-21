<script lang="ts">
  import '@lol/visual-grammar/styles.css';
  import type { Scene, Selection, SemanticScene } from '@lol/lens-contracts';
  import type { SemanticGraph, Trace } from '@lol/lens-scenes';
  import { deriveFlowProjection } from '../projection/deriveSemanticProjections';
  import LearnerFlowView from './LearnerFlowView.svelte';
  import SemanticStateView from './SemanticStateView.svelte';
  import GuidedTraceView from './GuidedTraceView.svelte';
  import GraphInspector from './GraphInspector.svelte';

  let {
    scene,
    semanticScene,
    graph,
    trace,
    source,
    selection,
    onselectionchange,
    reducedMotion = false,
    technicalMode = false,
  }: {
    scene: Scene;
    semanticScene: SemanticScene;
    graph: SemanticGraph;
    trace: Trace;
    source: string;
    selection: Selection;
    onselectionchange?: (next: Selection) => void;
    reducedMotion?: boolean;
    technicalMode?: boolean;
  } = $props();

  let viewMode = $state<'flow' | 'state' | 'guided' | 'inspector'>('flow');
  const stepIndex = $derived(Math.min(Math.max(selection.stepIndex ?? 0, 0), semanticScene.steps.length - 1));
  const flowProjection = $derived(deriveFlowProjection(semanticScene, stepIndex));
  const canvasWidth = $derived(Math.max(...scene.layout.map((node) => node.x + node.width), 400) + 28);
  const canvasHeight = $derived(Math.max(...scene.layout.map((node) => node.y + node.height), 300) + 28);

  $effect(() => {
    if (technicalMode) viewMode = 'inspector';
  });
</script>

<div class="visual-stage surface-card" data-testid="visual-learning-stage">
  <div class="tabs" role="tablist" aria-label="Visual views">
    <button type="button" role="tab" aria-selected={viewMode === 'flow'} class:active={viewMode === 'flow'} onclick={() => (viewMode = 'flow')}>Flow</button>
    <button type="button" role="tab" aria-selected={viewMode === 'state'} class:active={viewMode === 'state'} onclick={() => (viewMode = 'state')}>State</button>
    <button type="button" role="tab" aria-selected={viewMode === 'guided'} class:active={viewMode === 'guided'} onclick={() => (viewMode = 'guided')}>Guided Trace</button>
    <button type="button" role="tab" aria-selected={viewMode === 'inspector'} class:active={viewMode === 'inspector'} onclick={() => (viewMode = 'inspector')}>Graph Inspector</button>
  </div>
  <div class="canvas-area">
    {#if viewMode === 'flow'}
      <LearnerFlowView projection={flowProjection} {technicalMode} />
    {:else if viewMode === 'state'}
      <SemanticStateView {semanticScene} {stepIndex} />
    {:else if viewMode === 'guided'}
      <GuidedTraceView {semanticScene} {source} {stepIndex} />
    {:else}
      <GraphInspector
        {scene}
        {semanticScene}
        {graph}
        {trace}
        {selection}
        {onselectionchange}
        {reducedMotion}
        width={canvasWidth}
        height={canvasHeight}
      />
    {/if}
  </div>
</div>

<style>
  .visual-stage { display:flex; flex-direction:column; min-height:360px; min-width:0; }
  .tabs { display:flex; gap:var(--space-1); padding:var(--space-3) var(--space-4); border-bottom:1px solid var(--line-soft); overflow-x:auto; }
  .tabs button { padding:var(--space-2) var(--space-3); border:0; background:transparent; font-size:var(--text-sm); color:var(--ink-muted); border-radius:var(--radius-xs); cursor:pointer; white-space:nowrap; }
  .tabs button.active { background:var(--brand-blue-soft); color:var(--brand-blue); font-weight:600; }
  .canvas-area { flex:1; min-width:0; overflow:hidden; }
</style>
