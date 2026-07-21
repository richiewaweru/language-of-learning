<script lang="ts">
  import type { Scene, SceneAction, Selection } from '@lol/lens-contracts';
  import type { SemanticGraph, Trace } from '@lol/lens-scenes';
  import { renderCaption, deriveMotionState } from '@lol/lens-scenes';
  import ValueToken from './ValueToken.svelte';
  import BindingTag from './BindingTag.svelte';
  import CollectionFrame from './CollectionFrame.svelte';
  import FunctionBoundary from './FunctionBoundary.svelte';
  import OperationNode from './OperationNode.svelte';
  import LoopFrame from './LoopFrame.svelte';
  import BranchFork from './BranchFork.svelte';
  import BranchRoute from './BranchRoute.svelte';
  import ReturnPort from './ReturnPort.svelte';
  import StateCell from './StateCell.svelte';
  import StateTransition from './StateTransition.svelte';
  import EffectPulse from './EffectPulse.svelte';
  import UnsupportedRegion from './UnsupportedRegion.svelte';
  import TraceControls from './TraceControls.svelte';
  import RuntimeTokenLayer from './RuntimeTokenLayer.svelte';
  import MotionPath from './MotionPath.svelte';
  import ReturnExit from './ReturnExit.svelte';
  import { cancelAllTransitions } from './motion-controller.js';
  import { loopItemCountFromTrace, returnReprFromScene } from './trace-display.js';

  type TraceLike = {
    steps: Array<{
      index: number;
      line?: number;
      bindings: Record<string, string>;
      focus: string[];
      event: { type: string; [key: string]: unknown };
    }>;
    result?: { repr?: string };
  };

  let {
    scene,
    graph,
    trace,
    selection,
    onselectionchange,
    width = 640,
    height = 480,
    reducedMotion = false,
  }: {
    scene: Scene;
    graph: SemanticGraph;
    trace: TraceLike;
    selection: Selection;
    onselectionchange?: (next: Selection) => void;
    width?: number;
    height?: number;
    reducedMotion?: boolean;
  } = $props();

  let playing = $state(false);
  let playTimer: ReturnType<typeof setInterval> | null = null;

  const maxStep = $derived(Math.max(scene.steps.length - 1, 0));
  // Controlled: stepIndex is derived from the parent-owned Selection, never owned here.
  const stepIndex = $derived(Math.min(Math.max(selection.stepIndex ?? 0, 0), maxStep));
  const currentStep = $derived(scene.steps[stepIndex]);
  const bindings = $derived(trace.steps[stepIndex]?.bindings ?? {});
  const focusIds = $derived(new Set(currentStep?.focus ?? []));

  const loopItemIndex = $derived.by(() => {
    const action = currentStep?.actions.find((a) => a.type === 'advance_item') as
      | Extract<SceneAction, { type: 'advance_item' }>
      | undefined;
    if (action) return action.itemIndex;
    // find latest advance_item up to current step
    for (let i = stepIndex; i >= 0; i--) {
      const a = scene.steps[i]?.actions.find((x) => x.type === 'advance_item') as
        | Extract<SceneAction, { type: 'advance_item' }>
        | undefined;
      if (a) return a.itemIndex;
    }
    return 0;
  });

  const loopItemCount = $derived.by(() => {
    const loop = graph.nodes.find((n) => n.kind === 'loop');
    const collRef = loop && 'collectionRef' in loop ? (loop as { collectionRef?: string }).collectionRef : undefined;
    const coll = collRef ? graph.nodes.find((n) => n.id === collRef) : undefined;
    const fallback =
      coll && 'items' in coll && Array.isArray((coll as { items?: unknown[] }).items)
        ? (coll as { items: unknown[] }).items.length
        : 0;
    return loopItemCountFromTrace(trace.steps, fallback);
  });

  const returnRepr = $derived(
    returnReprFromScene(scene.steps, stepIndex, trace.result?.repr ?? ''),
  );

  const branchResult = $derived.by(() => {
    const map = new Map<string, boolean>();
    for (let i = 0; i <= stepIndex; i++) {
      for (const a of scene.steps[i]?.actions ?? []) {
        if (a.type === 'evaluate') map.set(a.branch, a.result);
      }
    }
    return map;
  });

  const ghostByCell = $derived.by(() => {
    const ghosts = new Map<string, string>();
    for (const a of currentStep?.actions ?? []) {
      if (a.type === 'change_state' && a.oldRepr !== '—') {
        ghosts.set(a.cell, a.oldRepr);
      }
    }
    return ghosts;
  });

  // PM2: MotionState is a pure derivation of (scene, graph, trace, stepIndex).
  // It never becomes a second source of truth — Selection.stepIndex still leads.
  const motion = $derived(
    deriveMotionState(scene, graph, trace as unknown as Trace, stepIndex),
  );

  const layoutById = $derived(new Map(scene.layout.map((n) => [n.id, n])));

  // PM3: labelled old→new morph near the state cell during the change beat.
  const stateTransitions = $derived.by(() => {
    const out: Array<{
      id: string;
      x: number;
      y: number;
      width: number;
      oldRepr: string;
      newRepr: string;
    }> = [];
    for (const a of currentStep?.actions ?? []) {
      if (a.type !== 'change_state') continue;
      const ln = layoutById.get(a.cell);
      if (!ln) continue;
      out.push({ id: a.cell, x: ln.x, y: ln.y, width: ln.width, oldRepr: a.oldRepr, newRepr: a.newRepr });
    }
    return out;
  });

  // PM4: route chips per branch node with a recorded result (dim the untaken).
  const branchRoutes = $derived.by(() => {
    const out: Array<{
      id: string;
      x: number;
      y: number;
      width: number;
      height: number;
      result: boolean;
    }> = [];
    for (const ln of scene.layout) {
      const result = motion.branchResults[ln.id];
      if (result === undefined) continue;
      out.push({ id: ln.id, x: ln.x, y: ln.y, width: ln.width, height: ln.height, result });
    }
    return out;
  });

  // PM5: return token at the port + a label outside the function boundary.
  const returnExit = $derived.by(() => {
    if (motion.returnValue === undefined) return null;
    const portNode = scene.layout.find((n) => n.kind === 'return');
    if (!portNode) return null;
    const boundary = scene.layout.find((n) => n.kind === 'function');
    return {
      port: { x: portNode.x, y: portNode.y, width: portNode.width, height: portNode.height },
      boundary: boundary
        ? { x: boundary.x, y: boundary.y, width: boundary.width, height: boundary.height }
        : undefined,
      returnValue: motion.returnValue,
    };
  });

  let canvasEl = $state<HTMLDivElement | null>(null);

  // On selection change (scrub/jump/back), cancel in-flight CSS transitions so
  // tokens don't slide from a stale position. Render-only; never mutates state.
  $effect(() => {
    void stepIndex;
    if (canvasEl) cancelAllTransitions(canvasEl);
  });

  function nodeById(id: string) {
    return graph.nodes.find((n) => n.id === id);
  }

  function emit(next: Selection) {
    onselectionchange?.(next);
  }

  function go(index: number) {
    const clamped = Math.max(0, Math.min(maxStep, index));
    emit({ ...selection, nodeId: undefined, stepIndex: clamped, line: trace.steps[clamped]?.line });
  }

  function back() {
    go(stepIndex - 1);
  }

  function step() {
    go(stepIndex + 1);
  }

  function reset() {
    stopPlay();
    go(0);
  }

  function stopPlay() {
    playing = false;
    if (playTimer) {
      clearInterval(playTimer);
      playTimer = null;
    }
  }

  function play() {
    if (reducedMotion) {
      // reduced motion: jump one beat at a time without interval animation feel
      step();
      return;
    }
    playing = true;
    playTimer = setInterval(() => {
      if (stepIndex >= maxStep) {
        stopPlay();
        return;
      }
      go(stepIndex + 1);
    }, 1600);
  }

  function selectNode(id: string) {
    const idx = scene.steps.findIndex((s) => s.focus.includes(id));
    emit({
      nodeId: id,
      stepIndex: idx >= 0 ? idx : (selection.stepIndex ?? 0),
      line: idx >= 0 ? trace.steps[idx]?.line : selection.line,
    });
  }

  /** PM6: keyboard controls (ArrowLeft/Right, Home, Space, Escape). */
  function onKeydown(e: KeyboardEvent) {
    const tag = (e.target as HTMLElement | null)?.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA') return;
    switch (e.key) {
      case 'ArrowRight':
        e.preventDefault();
        step();
        break;
      case 'ArrowLeft':
        e.preventDefault();
        back();
        break;
      case 'Home':
        e.preventDefault();
        reset();
        break;
      case ' ':
      case 'Spacebar':
        e.preventDefault();
        if (playing) stopPlay();
        else play();
        break;
      case 'Escape':
        e.preventDefault();
        stopPlay();
        break;
      default:
        break;
    }
  }

  const liveSummary = $derived.by(() => {
    const caption = currentStep ? renderCaption(currentStep.caption) : '';
    const ret = motion.returnValue ? ` Result ${motion.returnValue}.` : '';
    return `Step ${stepIndex} of ${maxStep}. ${caption}.${ret}`;
  });
</script>

<svelte:window onkeydown={onKeydown} />

<div
  class="slice"
  class:reduced={reducedMotion}
  role="region"
  aria-label="Scene player"
>
  <TraceControls
    {stepIndex}
    {maxStep}
    {playing}
    onback={back}
    onstep={step}
    onplay={play}
    onpause={stopPlay}
    onreset={reset}
    onscrub={(index) => {
      stopPlay();
      go(index);
    }}
  />

  <p class="vg-live sr-only" aria-live="polite" aria-atomic="true">{liveSummary}</p>

  <p class="vg-caption" data-testid="caption">
    {currentStep ? renderCaption(currentStep.caption) : ''}
  </p>

  <div
    class="vg-canvas"
    class:reduced={reducedMotion}
    bind:this={canvasEl}
    style:width="{width}px"
    style:height="{height}px"
    data-testid="scene-canvas"
  >
    <MotionPath
      edges={scene.edges}
      activePaths={motion.activePaths}
      fadedPaths={motion.fadedPaths}
      {width}
      {height}
    />
    {#each scene.layout as layoutNode (layoutNode.id)}
      {@const node = nodeById(layoutNode.id)}
      {@const focused = focusIds.has(layoutNode.id)}
      {#if node?.kind === 'function'}
        <FunctionBoundary
          id={layoutNode.id}
          x={layoutNode.x}
          y={layoutNode.y}
          width={layoutNode.width}
          height={layoutNode.height}
          name={node.name ?? 'fn'}
          {focused}
          onclick={() => selectNode(layoutNode.id)}
        />
      {:else if node?.kind === 'binding'}
        <BindingTag
          id={layoutNode.id}
          x={layoutNode.x}
          y={layoutNode.y}
          width={layoutNode.width}
          height={layoutNode.height}
          name={node.name ?? layoutNode.id}
          role={node.role}
          value={node.name ? bindings[node.name] : undefined}
          ghost={ghostByCell.get(layoutNode.id)}
          {focused}
          onclick={() => selectNode(layoutNode.id)}
        />
      {:else if node?.kind === 'collection'}
        <CollectionFrame
          id={layoutNode.id}
          x={layoutNode.x}
          y={layoutNode.y}
          width={layoutNode.width}
          height={layoutNode.height}
          name={node.name}
          items={node.name && bindings[node.name]
            ? bindings[node.name].replace(/^\[|\]$/g, '').split(', ').filter(Boolean)
            : (node.items ?? [])}
          {focused}
          onclick={() => selectNode(layoutNode.id)}
        />
      {:else if node?.kind === 'loop'}
        <LoopFrame
          id={layoutNode.id}
          x={layoutNode.x}
          y={layoutNode.y}
          width={layoutNode.width}
          height={layoutNode.height}
          iteratorName={node.iteratorName ?? 'item'}
          itemIndex={loopItemIndex}
          itemCount={loopItemCount}
          {focused}
          onclick={() => selectNode(layoutNode.id)}
        />
      {:else if node?.kind === 'branch'}
        <BranchFork
          id={layoutNode.id}
          x={layoutNode.x}
          y={layoutNode.y}
          width={layoutNode.width}
          height={layoutNode.height}
          conditionExpr={node.conditionExpr ?? ''}
          result={branchResult.get(layoutNode.id)}
          {focused}
          dimmed={branchResult.has(layoutNode.id) && branchResult.get(layoutNode.id) === false}
          onclick={() => selectNode(layoutNode.id)}
        />
      {:else if node?.kind === 'operation'}
        <OperationNode
          id={layoutNode.id}
          x={layoutNode.x}
          y={layoutNode.y}
          width={layoutNode.width}
          height={layoutNode.height}
          expr={node.expr ?? ''}
          {focused}
          onclick={() => selectNode(layoutNode.id)}
        />
      {:else if node?.kind === 'mutation'}
        <StateCell
          id={layoutNode.id}
          x={layoutNode.x}
          y={layoutNode.y}
          width={layoutNode.width}
          height={layoutNode.height}
          label={node.mutationType ?? 'mutate'}
          {focused}
          onclick={() => selectNode(layoutNode.id)}
        />
      {:else if node?.kind === 'return'}
        <ReturnPort
          id={layoutNode.id}
          x={layoutNode.x}
          y={layoutNode.y}
          width={layoutNode.width}
          height={layoutNode.height}
          label={`return ${returnRepr}`}
          {focused}
          onclick={() => selectNode(layoutNode.id)}
        />
      {:else if node?.kind === 'value'}
        <ValueToken
          id={layoutNode.id}
          x={layoutNode.x}
          y={layoutNode.y}
          width={layoutNode.width}
          height={layoutNode.height}
          label={node.repr ?? '?'}
          {focused}
          onclick={() => selectNode(layoutNode.id)}
        />
      {:else if node?.kind === 'effect'}
        <EffectPulse
          id={layoutNode.id}
          x={layoutNode.x}
          y={layoutNode.y}
          width={layoutNode.width}
          height={layoutNode.height}
          {focused}
          onclick={() => selectNode(layoutNode.id)}
        />
      {:else if !node}
        <UnsupportedRegion
          id={layoutNode.id}
          x={layoutNode.x}
          y={layoutNode.y}
          width={layoutNode.width}
          height={layoutNode.height}
          message="unknown"
        />
      {/if}
    {/each}

    {#each branchRoutes as route (route.id)}
      <BranchRoute
        x={route.x}
        y={route.y}
        width={route.width}
        height={route.height}
        result={route.result}
        {reducedMotion}
      />
    {/each}

    <RuntimeTokenLayer {motion} layout={scene.layout} edges={scene.edges} {reducedMotion} />

    {#each stateTransitions as t (t.id)}
      <StateTransition
        x={t.x}
        y={t.y}
        width={t.width}
        oldRepr={t.oldRepr}
        newRepr={t.newRepr}
        {reducedMotion}
      />
    {/each}

    {#if returnExit}
      <ReturnExit
        port={returnExit.port}
        boundary={returnExit.boundary}
        returnValue={returnExit.returnValue}
        {reducedMotion}
      />
    {/if}
  </div>

  <pre class="bindings" data-testid="bindings">{JSON.stringify(bindings, null, 2)}</pre>
</div>

<style>
  .slice {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .bindings {
    margin: 0;
    padding: 0.75rem;
    background: var(--paper);
    border: var(--border-w) solid var(--line);
    font: 12px/1.4 var(--font-mono);
    max-height: 160px;
    overflow: auto;
  }

  .sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip: rect(0 0 0 0);
  }

  .slice:focus {
    outline: 2px solid var(--work-purple);
    outline-offset: 2px;
  }
</style>
