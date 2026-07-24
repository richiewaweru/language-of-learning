<script lang="ts">
  import { onMount } from 'svelte';
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
    initialFocusOnly = true,
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
    initialFocusOnly?: boolean;
    width: number;
    height: number;
  } = $props();

  let viewport!: HTMLDivElement;
  let zoom = $state(1);
  let panX = $state(12);
  let panY = $state(12);
  let dragging = $state(false);
  let dragPointerId: number | null = null;
  let dragOriginX = 0;
  let dragOriginY = 0;
  let dragPanX = 0;
  let dragPanY = 0;
  let userTransformed = false;
  let focusOnly = $state(true);
  const stepIndex = $derived(selection.stepIndex ?? 0);
  const semanticStep = $derived(semanticScene.steps[stepIndex] ?? semanticScene.steps[0]);
  const visibleNodes = $derived(
    focusOnly ? new Set(semanticStep?.activeEntityIds ?? []) : new Set(graph.nodes.map((node) => node.id)),
  );

  function boundsFor(nextZoom = zoom) {
    const padding = 24;
    const viewportWidth = viewport?.clientWidth ?? width;
    const viewportHeight = viewport?.clientHeight ?? height;
    const scaledWidth = width * nextZoom;
    const scaledHeight = height * nextZoom;
    return {
      minX: Math.min(padding, viewportWidth - scaledWidth - padding),
      maxX: Math.max(padding, (viewportWidth - scaledWidth) / 2),
      minY: Math.min(padding, viewportHeight - scaledHeight - padding),
      maxY: Math.max(padding, (viewportHeight - scaledHeight) / 2),
      viewportWidth,
      viewportHeight,
    };
  }

  function constrainPan(nextX = panX, nextY = panY, nextZoom = zoom) {
    const bounds = boundsFor(nextZoom);
    panX = Math.min(bounds.maxX, Math.max(bounds.minX, nextX));
    panY = Math.min(bounds.maxY, Math.max(bounds.minY, nextY));
  }

  function fitToView() {
    if (!viewport) return;
    const padding = 32;
    const availableWidth = Math.max(1, viewport.clientWidth - padding * 2);
    const availableHeight = Math.max(1, viewport.clientHeight - padding * 2);
    zoom = Math.min(1, Math.max(.35, Math.min(availableWidth / width, availableHeight / height)));
    panX = Math.max(padding, (viewport.clientWidth - width * zoom) / 2);
    panY = Math.max(padding, (viewport.clientHeight - height * zoom) / 2);
    userTransformed = false;
  }

  function setZoom(nextZoom: number) {
    const previous = zoom;
    const next = Math.min(1.8, Math.max(.35, nextZoom));
    if (next === previous) return;
    const centerX = (viewport.clientWidth / 2 - panX) / previous;
    const centerY = (viewport.clientHeight / 2 - panY) / previous;
    zoom = next;
    constrainPan(
      viewport.clientWidth / 2 - centerX * next,
      viewport.clientHeight / 2 - centerY * next,
      next,
    );
    userTransformed = true;
  }

  function startPan(event: PointerEvent) {
    if (event.button !== 0) return;
    if (event.target instanceof Element && event.target.closest('button, input, label, a')) return;
    dragging = true;
    dragPointerId = event.pointerId;
    dragOriginX = event.clientX;
    dragOriginY = event.clientY;
    dragPanX = panX;
    dragPanY = panY;
    viewport.setPointerCapture(event.pointerId);
  }

  function movePan(event: PointerEvent) {
    if (!dragging || event.pointerId !== dragPointerId) return;
    constrainPan(dragPanX + event.clientX - dragOriginX, dragPanY + event.clientY - dragOriginY);
    userTransformed = true;
  }

  function endPan(event: PointerEvent) {
    if (event.pointerId !== dragPointerId) return;
    dragging = false;
    dragPointerId = null;
    if (viewport.hasPointerCapture(event.pointerId)) viewport.releasePointerCapture(event.pointerId);
  }

  function handleViewportKeydown(event: KeyboardEvent) {
    const amount = event.shiftKey ? 48 : 24;
    if (event.key === '+' || event.key === '=') setZoom(zoom + .1);
    else if (event.key === '-') setZoom(zoom - .1);
    else if (event.key === '0') fitToView();
    else if (event.key === 'ArrowLeft') constrainPan(panX + amount, panY);
    else if (event.key === 'ArrowRight') constrainPan(panX - amount, panY);
    else if (event.key === 'ArrowUp') constrainPan(panX, panY + amount);
    else if (event.key === 'ArrowDown') constrainPan(panX, panY - amount);
    else return;
    userTransformed = event.key !== '0';
    event.preventDefault();
  }

  onMount(() => {
    focusOnly = initialFocusOnly;
    const observer = new ResizeObserver(() => {
      if (userTransformed) constrainPan();
      else fitToView();
    });
    observer.observe(viewport);
    fitToView();
    return () => observer.disconnect();
  });
</script>

<div class="graph-inspector" data-testid="graph-inspector">
  <div class="inspector-toolbar">
    <SymbolBadge semantic={semanticStep?.activeEvent.type ?? 'generic'} label={semanticStep?.activeEvent.type ?? 'event'} state="active" />
    <button type="button" onclick={() => setZoom(zoom - .1)} aria-label="Zoom out">−</button>
    <button type="button" onclick={fitToView} aria-label="Fit graph to view">Fit to view</button>
    <button type="button" onclick={() => setZoom(zoom + .1)} aria-label="Zoom in">+</button>
    <button type="button" onclick={fitToView} aria-label="Reset graph position">Reset</button>
    <label><input type="checkbox" bind:checked={focusOnly} /> Active neighborhood</label>
  </div>
  <div
    bind:this={viewport}
    class="viewport"
    class:focus-only={focusOnly}
    class:dragging
    role="application"
    aria-label="Pannable semantic graph"
    tabindex="0"
    onpointerdown={startPan}
    onpointermove={movePan}
    onpointerup={endPan}
    onpointercancel={endPan}
    onkeydown={handleViewportKeydown}
    data-zoom={zoom.toFixed(2)}
  >
    <div
      class="zoom-layer"
      style:transform={`translate(${panX}px, ${panY}px) scale(${zoom})`}
      style:width={`${width}px`}
      style:height={`${height}px`}
    >
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
    <p>{trace.scope.kind === 'module' ? 'Program / frame:module' : `Function / frame:${trace.scope.functionId}`}</p>
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
  .viewport { width:100%; max-width:100%; height:clamp(360px,calc(100vh - 300px),720px); overflow:hidden; border:1px solid var(--line-soft); border-radius:var(--radius-sm); touch-action:none; cursor:grab; background:var(--surface-primary); }
  .viewport.dragging { cursor:grabbing; user-select:none; }
  .viewport:focus-visible { outline:3px solid color-mix(in srgb,var(--brand-blue) 45%,transparent); outline-offset:2px; }
  .viewport.focus-only :global([data-focus='false']) { opacity:.18; }
  .viewport.focus-only :global(.vg-motion-edge[data-faded='true']) { opacity:0; }
  .zoom-layer { transform-origin:top left; will-change:transform; }
  .minimap { position:absolute; right:var(--space-5); bottom:5.5rem; width:92px; min-height:46px; display:flex; flex-wrap:wrap; gap:3px; padding:6px; background:color-mix(in srgb,var(--surface-primary) 92%,transparent); border:1px solid var(--line-medium); border-radius:var(--radius-xs); }
  .minimap span { width:8px; height:8px; background:var(--line-medium); border-radius:2px; opacity:.35; }
  .minimap span.active { background:var(--brand-blue); opacity:1; }
  .frames { margin-top:var(--space-3); font-size:var(--text-xs); color:var(--ink-muted); }
  .frames p,.frames ul { margin:.35rem 0; }
  .fallback-legend { margin-top:var(--space-2); font-size:var(--text-xs); color:var(--ink-muted); }
  .fallback-legend div { display:flex; flex-wrap:wrap; gap:var(--space-2); margin-top:var(--space-2); }
</style>
