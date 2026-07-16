<script lang="ts">
  import type { Scene, SceneAction, Selection } from '@lol/lens-contracts';
  import type { SemanticGraph } from '@lol/lens-scenes';
  import { renderCaption } from '@lol/lens-scenes';
  import ValueToken from './ValueToken.svelte';
  import BindingTag from './BindingTag.svelte';
  import CollectionFrame from './CollectionFrame.svelte';
  import FunctionBoundary from './FunctionBoundary.svelte';
  import OperationNode from './OperationNode.svelte';
  import LoopFrame from './LoopFrame.svelte';
  import BranchFork from './BranchFork.svelte';
  import ReturnPort from './ReturnPort.svelte';
  import StateCell from './StateCell.svelte';
  import EffectPulse from './EffectPulse.svelte';
  import UnsupportedRegion from './UnsupportedRegion.svelte';
  import TraceControls from './TraceControls.svelte';
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
</script>

<div class="slice" class:reduced={reducedMotion}>
  <TraceControls
    {stepIndex}
    {maxStep}
    {playing}
    onback={back}
    onstep={step}
    onplay={play}
    onpause={stopPlay}
    onreset={reset}
    onscrub={go}
  />

  <p class="vg-caption" data-testid="caption">
    {currentStep ? renderCaption(currentStep.caption) : ''}
  </p>

  <div class="vg-canvas" style:width="{width}px" style:height="{height}px" data-testid="scene-canvas">
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
</style>
