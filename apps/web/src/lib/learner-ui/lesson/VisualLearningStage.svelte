<script lang="ts">
  import { ScenePlayer } from '@lol/visual-grammar';
  import '@lol/visual-grammar/styles.css';
  import type { Scene } from '@lol/lens-contracts';
  import type { SemanticGraph, Trace } from '@lol/lens-scenes';
  import type { Selection } from '@lol/lens-contracts';
  import { deriveLearnerProjection } from '../projection/deriveLearnerProjection';
  import LearnerFlowView from './LearnerFlowView.svelte';
  import StaticSceneFallback from '$lib/product/StaticSceneFallback.svelte';

  let {
    scene,
    graph,
    trace,
    selection,
    onselectionchange,
    reducedMotion = false,
    technicalMode = false,
  }: {
    scene: Scene;
    graph: SemanticGraph;
    trace: Trace;
    selection: Selection;
    onselectionchange?: (next: Selection) => void;
    reducedMotion?: boolean;
    technicalMode?: boolean;
  } = $props();

  let viewMode = $state<'flow' | 'state' | 'trace'>('flow');

  const stepIndex = $derived(Math.min(Math.max(selection.stepIndex ?? 0, 0), scene.steps.length - 1));
  const projection = $derived(deriveLearnerProjection(graph, trace, scene, stepIndex));

  const canvasWidth = $derived(
    Math.max(...scene.layout.map((n) => n.x + n.width), 400) + 28,
  );
  const canvasHeight = $derived(
    Math.max(...scene.layout.map((n) => n.y + n.height), 300) + 28,
  );
</script>

<div class="visual-stage surface-card" data-testid="visual-learning-stage">
  <div class="tabs" role="tablist" aria-label="Visual views">
    <button type="button" role="tab" class:active={viewMode === 'flow'} onclick={() => (viewMode = 'flow')}>Flow</button>
    <button type="button" role="tab" class:active={viewMode === 'state'} onclick={() => (viewMode = 'state')}>State Table</button>
    <button type="button" role="tab" class:active={viewMode === 'trace'} onclick={() => (viewMode = 'trace')}>Trace</button>
  </div>

  <div class="canvas-area">
    {#if viewMode === 'flow' && !technicalMode}
      <LearnerFlowView steps={projection.flowSteps} {technicalMode} />
    {:else if viewMode === 'state'}
      <div class="state-table">
        <table>
          <thead><tr><th>Binding</th><th>Value</th></tr></thead>
          <tbody>
            {#each Object.entries(trace.steps[stepIndex]?.bindings ?? {}) as [name, val]}
              <tr><td>{name}</td><td><code>{val}</code></td></tr>
            {/each}
          </tbody>
        </table>
      </div>
    {:else if reducedMotion && viewMode === 'trace'}
      <StaticSceneFallback {scene} {stepIndex} />
    {:else}
      <div class="scene-wrap">
        <ScenePlayer
          {scene}
          {graph}
          {trace}
          {selection}
          {onselectionchange}
          width={canvasWidth}
          height={canvasHeight}
          {reducedMotion}
        />
      </div>
    {/if}
  </div>
</div>

<style>
  .visual-stage {
    display: flex;
    flex-direction: column;
    min-height: 360px;
  }

  .tabs {
    display: flex;
    gap: var(--space-1);
    padding: var(--space-3) var(--space-4);
    border-bottom: 1px solid var(--line-soft);
  }

  .tabs button {
    padding: var(--space-2) var(--space-4);
    border: none;
    background: transparent;
    font-size: var(--text-sm);
    color: var(--ink-muted);
    border-radius: var(--radius-xs);
    cursor: pointer;
  }

  .tabs button.active {
    background: var(--brand-blue-soft);
    color: var(--brand-blue);
    font-weight: 600;
  }

  .canvas-area {
    flex: 1;
    overflow: auto;
  }

  .scene-wrap {
    padding: var(--space-3);
  }

  .state-table {
    padding: var(--space-5);
  }

  .state-table table {
    width: 100%;
    border-collapse: collapse;
    font-size: var(--text-sm);
  }

  .state-table th,
  .state-table td {
    padding: var(--space-2) var(--space-3);
    text-align: left;
    border-bottom: 1px solid var(--line-soft);
  }

  .state-table code {
    font-family: var(--font-mono);
  }
</style>
