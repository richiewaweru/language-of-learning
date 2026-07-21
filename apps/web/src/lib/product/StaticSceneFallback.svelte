<script lang="ts">
  import type { Scene } from '@lol/lens-contracts';
  import { renderCaption } from '@lol/lens-scenes';

  let { scene, stepIndex = 0 }: { scene: Scene; stepIndex?: number } = $props();

  const step = $derived(scene.steps[stepIndex] ?? scene.steps[0]);
  const caption = $derived(step ? renderCaption(step.caption) : '');
  const canvasWidth = $derived(Math.max(...scene.layout.map((n) => n.x + n.width), 400) + 28);
  const canvasHeight = $derived(Math.max(...scene.layout.map((n) => n.y + n.height), 300) + 28);
</script>

<div class="static-fallback" data-testid="static-scene-fallback" role="img" aria-label="Static scene preview">
  <p class="caption">{caption}</p>
  <div
    class="canvas"
    style:width="{canvasWidth}px"
    style:height="{canvasHeight}px"
  >
    {#each scene.layout as node}
      <div
        class="node"
        data-kind={node.kind}
        style:left="{node.x}px"
        style:top="{node.y}px"
        style:width="{node.width}px"
        style:height="{node.height}px"
      >
        {node.kind}
      </div>
    {/each}
  </div>
  <p class="note">Static preview — use Play to step through execution.</p>
</div>

<style>
  .static-fallback {
    background: var(--surface-paper);
    border: var(--border-w) solid var(--line-default);
    border-radius: var(--radius-panel);
    padding: var(--space-4);
  }

  .caption {
    font-size: var(--text-sm);
    color: var(--ink-muted);
    margin: 0 0 var(--space-3);
  }

  .canvas {
    position: relative;
    background: var(--bg-canvas);
    border: 1px solid var(--line-soft);
    border-radius: var(--radius-sm);
  }

  .node {
    position: absolute;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 10px;
    font-family: var(--font-mono);
    border: 1px solid var(--line-default);
    border-radius: var(--radius-xs);
    background: var(--surface-raised);
    color: var(--ink-muted);
  }

  .note {
    font-size: var(--text-xs);
    color: var(--ink-faint);
    margin: var(--space-3) 0 0;
  }
</style>
