<script lang="ts">
  import { ScenePlayer, SymbolBadge } from '@lol/visual-grammar';
  import type { Scene, Selection, SemanticScene } from '@lol/lens-contracts';
  import type { SemanticGraph, Trace } from '@lol/lens-scenes';

  let {
    scene,
    semanticScene,
    graph,
    trace,
    selection,
    onselectionchange,
    reducedMotion = false,
    width,
    height,
  }: {
    scene: Scene;
    semanticScene: SemanticScene;
    graph: SemanticGraph;
    trace: Trace;
    selection: Selection;
    onselectionchange?: (next: Selection) => void;
    reducedMotion?: boolean;
    width: number;
    height: number;
  } = $props();

  let zoom = $state(1);
  let focusOnly = $state(true);
  const stepIndex = $derived(selection.stepIndex ?? 0);
  const semanticStep = $derived(semanticScene.steps[stepIndex] ?? semanticScene.steps[0]);
  const visibleNodes = $derived(
    focusOnly ? new Set(semanticStep?.activeEntityIds ?? []) : new Set(graph.nodes.map((node) => node.id)),
  );
</script>

<div class="graph-inspector" data-testid="graph-inspector">
  <div class="inspector-toolbar">
    <SymbolBadge semantic={semanticStep?.activeEvent.type ?? 'generic'} label={semanticStep?.activeEvent.type ?? 'event'} state="active" />
    <button type="button" onclick={() => (zoom = Math.max(.55, zoom - .1))} aria-label="Zoom out">−</button>
    <button type="button" onclick={() => (zoom = 1)} aria-label="Zoom to fit">Fit</button>
    <button type="button" onclick={() => (zoom = Math.min(1.6, zoom + .1))} aria-label="Zoom in">+</button>
    <label><input type="checkbox" bind:checked={focusOnly} /> Active neighborhood</label>
  </div>
  <div class="viewport" class:focus-only={focusOnly} aria-label="Pannable semantic graph">
    <div class="zoom-layer" style:transform={'scale(' + zoom + ')'} style:transform-origin="top left">
      <ScenePlayer
        {scene}
        {graph}
        {trace}
        {selection}
        {onselectionchange}
        {width}
        {height}
        {reducedMotion}
      />
    </div>
  </div>
  <aside class="minimap" aria-label="Graph minimap">
    {#each graph.nodes as node}
      <span class:active={visibleNodes.has(node.id)} title={node.kind}></span>
    {/each}
  </aside>
  <details class="frames">
    <summary>Frames and active entities</summary>
    <p>frame-root</p>
    <ul>
      {#each semanticStep?.activeEntityIds ?? [] as id}<li>{id}</li>{/each}
    </ul>
  </details>
  <details class="fallback-legend">
    <summary>Fallback symbol legend</summary>
    <div>
      <SymbolBadge semantic="generic-operation" label="Generic supported behavior" />
      <SymbolBadge semantic="unsupported" label="Unsupported behavior" state="unsupported" behaviorVerified={false} />
    </div>
  </details>
</div>

<style>
  .graph-inspector { position:relative; padding:var(--space-3); min-width:0; }
  .inspector-toolbar { display:flex; flex-wrap:wrap; align-items:center; gap:var(--space-2); margin-bottom:var(--space-3); }
  button { border:1px solid var(--line-medium); background:var(--surface-primary); border-radius:var(--radius-xs); padding:.35rem .55rem; cursor:pointer; }
  label { font-size:var(--text-xs); color:var(--ink-muted); }
  .viewport { max-width:100%; overflow:auto; border:1px solid var(--line-soft); border-radius:var(--radius-sm); }
  .viewport.focus-only :global([data-focus='false']) { opacity:.18; }
  .viewport.focus-only :global(.vg-motion-edge[data-faded='true']) { opacity:0; }
  .zoom-layer { width:max-content; }
  .minimap { position:absolute; right:var(--space-5); bottom:5.5rem; width:92px; min-height:46px; display:flex; flex-wrap:wrap; gap:3px; padding:6px; background:color-mix(in srgb,var(--surface-primary) 92%,transparent); border:1px solid var(--line-medium); border-radius:var(--radius-xs); }
  .minimap span { width:8px; height:8px; background:var(--line-medium); border-radius:2px; opacity:.35; }
  .minimap span.active { background:var(--brand-blue); opacity:1; }
  .frames { margin-top:var(--space-3); font-size:var(--text-xs); color:var(--ink-muted); }
  .frames p,.frames ul { margin:.35rem 0; }
  .fallback-legend { margin-top:var(--space-2); font-size:var(--text-xs); color:var(--ink-muted); }
  .fallback-legend div { display:flex; flex-wrap:wrap; gap:var(--space-2); margin-top:var(--space-2); }
</style>
