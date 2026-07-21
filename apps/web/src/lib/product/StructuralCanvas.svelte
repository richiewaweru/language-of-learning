<script lang="ts">
  import { ScenePlayer } from '@lol/visual-grammar';
  import '@lol/visual-grammar/styles.css';
  import type { Scene } from '@lol/lens-contracts';
  import type { SemanticGraph, Trace } from '@lol/lens-scenes';
  import type { Selection } from '@lol/lens-contracts';

  let {
    scene,
    graph,
    trace,
    selection,
    onselectionchange,
    width,
    height,
    reducedMotion = false,
  }: {
    scene: Scene;
    graph: SemanticGraph;
    trace: Trace;
    selection: Selection;
    onselectionchange?: (next: Selection) => void;
    width?: number;
    height?: number;
    reducedMotion?: boolean;
  } = $props();

  const canvasWidth = $derived(
    width ?? Math.max(...scene.layout.map((n) => n.x + n.width), 400) + 28,
  );
  const canvasHeight = $derived(
    height ?? Math.max(...scene.layout.map((n) => n.y + n.height), 300) + 28,
  );
</script>

<div class="structural-canvas" data-testid="structural-canvas">
  <p class="label">Visual</p>
  <div class="canvas-wrap">
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
</div>

<style>
  .structural-canvas {
    background: var(--surface-paper);
    border: var(--border-w) solid var(--line-default);
    border-radius: var(--radius-panel);
    box-shadow: var(--shadow-sm);
    overflow: hidden;
  }

  .label {
    font: var(--eyebrow);
    letter-spacing: 0.12em;
    text-transform: uppercase;
    font-size: 11px;
    color: var(--ink-muted);
    margin: 0;
    padding: var(--space-3) var(--space-4);
    border-bottom: 1px solid var(--line-soft);
  }

  .canvas-wrap {
    padding: var(--space-3);
    overflow: auto;
  }
</style>
