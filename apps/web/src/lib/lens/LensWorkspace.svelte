<script lang="ts">
  import type { LensSessionController, LensViewId, Selection } from '@lol/lens-contracts';
  import type { Snippet } from 'svelte';
  import {
    resolveSelection,
    resolveTruthDetail,
  } from '@lol/lens-scenes';
  import CodeEditor from '$lib/CodeEditor.svelte';
  import TruthDrawer from '$lib/product/TruthDrawer.svelte';
  import LearnerFlowView from '$lib/learner-ui/lesson/LearnerFlowView.svelte';
  import SemanticStateView from '$lib/learner-ui/lesson/SemanticStateView.svelte';
  import GuidedTraceView from '$lib/learner-ui/lesson/GuidedTraceView.svelte';
  import GraphInspector from '$lib/learner-ui/lesson/GraphInspector.svelte';
  import { deriveFlowProjection } from '$lib/learner-ui/projection/deriveSemanticProjections';
  import { sourceHasModuleEntry } from './input';

  let {
    controller,
    sidebar,
  }: {
    controller: LensSessionController;
    sidebar?: Snippet;
  } = $props();

  let inputTab = $state<'paste' | 'examples'>('paste');
  let drawerOpen = $state(false);
  let showTechnical = $state(false);

  const state = $derived(controller.state);
  const artifacts = $derived(state.artifacts);
  const graph = $derived(artifacts?.graph ?? null);
  const trace = $derived(artifacts?.trace ?? null);
  const scene = $derived(artifacts?.scene ?? null);
  const semanticScene = $derived(artifacts?.semanticScene ?? null);
  const violation = $derived(artifacts?.violation ?? null);
  const stepIndex = $derived(state.selection.stepIndex ?? 0);
  const totalSteps = $derived(semanticScene?.steps.length ?? 0);
  const moduleInput = $derived(sourceHasModuleEntry(state.source));
  const emptyProgram = $derived(
    Boolean(
      graph &&
        trace?.scope.kind === 'module' &&
        !violation &&
        trace.steps.length === 0,
    ),
  );
  const projection = $derived(
    semanticScene ? deriveFlowProjection(semanticScene, stepIndex) : null,
  );
  const truthDetail = $derived(
    graph && trace && scene
      ? resolveTruthDetail(state.selection, graph, trace, scene, stepIndex)
      : null,
  );

  const views: ReadonlyArray<{ id: LensViewId; label: string }> = [
    { id: 'flow', label: 'Flow' },
    { id: 'state', label: 'State' },
    { id: 'explain', label: 'Guided Trace' },
    { id: 'structure', label: 'Graph Inspector' },
  ];

  function onSelectionChange(next: Selection) {
    if (graph && trace && scene) {
      const resolved = resolveSelection(next, graph, trace, scene.layout);
      controller.actions.setSelection({
        ...next,
        line: resolved.line,
        stepIndex: resolved.stepIndex,
      });
    } else {
      controller.actions.setSelection(next);
    }
    drawerOpen = true;
  }
</script>

<div
  class="lens-workspace-grid"
  class:with-sidebar={Boolean(sidebar)}
  data-testid="lens-workspace"
  data-session-id={state.id}
  data-hydration-status={state.hydrationStatus}
  data-revision={state.revision}
>
  <section class="input-panel surface-card">
    <div class="input-tabs" role="tablist">
      {#each ['paste', 'examples'] as tab}
        <button
          type="button"
          role="tab"
          aria-selected={inputTab === tab}
          class:active={inputTab === tab}
          onclick={() => (inputTab = tab as typeof inputTab)}
        >
          {tab === 'paste' ? 'Paste Code' : 'Examples'}
        </button>
      {/each}
    </div>

    {#if inputTab === 'paste'}
      <label class="field" data-testid="decode-source-editor">
        <span class="sr-only">Python source</span>
        <CodeEditor
          value={state.source}
          readonly={!controller.capabilities.canEditSource}
          allowPaste={controller.capabilities.canPasteSource}
          onchange={(value) => controller.actions.setSourceFromUser(value)}
        />
      </label>
      {#if !moduleInput}
        <label class="field args-field">
          <span>Sample input</span>
          <input
            class="args"
            value={state.argsText}
            oninput={(event) =>
              controller.actions.setArgsText(event.currentTarget.value)}
            readonly={!controller.capabilities.canUseFreeformInput}
            placeholder="[2, 4, 6, 8]"
            data-testid="decode-sample-input"
          />
        </label>
      {:else}
        <p class="hint" data-testid="module-input-note">Program code runs without sample input.</p>
      {/if}
    {:else}
      <p class="hint">Explore supported functions, loops, lists, and conditionals.</p>
      <div class="example-pills">
        {#each ['Functions', 'Loops', 'Lists', 'Conditionals'] as example}
          <button
            type="button"
            class="pill-tag"
            disabled={!controller.capabilities.canReplaceProgram}
            onclick={() => (inputTab = 'paste')}
          >{example}</button>
        {/each}
      </div>
    {/if}

    <button
      type="button"
      class="btn-primary visualize"
      onclick={() => controller.actions.run()}
      disabled={state.status === 'running' || !controller.capabilities.canRun}
      data-testid="decode-visualize"
    >
      {state.status === 'running' ? 'Visualizing…' : 'Visualize'}
    </button>

    {#if state.error}
      <div class="error" data-testid="decode-error" data-diagnostic="error" role="alert">
        <p>We could not visualize that program. {state.error}</p>
        {#if controller.capabilities.canRun}
          <button type="button" class="btn-secondary" onclick={() => controller.actions.run()}>Retry</button>
        {/if}
      </div>
    {:else if violation}
      <div class="error" data-testid="decode-unsupported" role="status">
        <p><strong>Execution not verified.</strong> {violation.message}</p>
        <p>Lens will not invent a trace for unsupported behavior.</p>
      </div>
    {/if}

    {#if state.persistenceWarning}
      <p class="persistence-warning" data-testid="lens-persistence-warning" role="status">
        {state.persistenceWarning}
      </p>
    {/if}

    {#if controller.capabilities.canReset}
      <button type="button" class="btn-secondary" data-testid="lens-reset" onclick={() => controller.actions.reset()}>
        Reset
      </button>
    {/if}
  </section>

  <section class="workspace">
    {#if graph && trace}
      {#if totalSteps}
        <div class="decode-playback" data-testid="decode-playback" aria-label="Execution controls">
          <button type="button" class="btn-secondary" data-testid="step-start" onclick={() => controller.actions.setCurrentFrame(0)} disabled={stepIndex === 0}>Start</button>
          <button type="button" class="btn-secondary" data-testid="step-back" onclick={() => controller.actions.setCurrentFrame(stepIndex - 1)} disabled={stepIndex === 0}>Back</button>
          <span data-testid="decode-step-count">Step {stepIndex + 1} of {totalSteps}</span>
          <span class="sr-only" data-testid="current-frame">{stepIndex}</span>
          <button type="button" class="btn-secondary" data-testid="step-next" onclick={() => controller.actions.setCurrentFrame(stepIndex + 1)} disabled={stepIndex >= totalSteps - 1}>Next</button>
          <button type="button" class="btn-secondary" data-testid="step-end" onclick={() => controller.actions.setCurrentFrame(totalSteps - 1)} disabled={stepIndex >= totalSteps - 1}>End</button>
        </div>
      {/if}

      {#if !violation}
        <div class="view-tabs" role="tablist">
          {#each views.filter((view) => controller.capabilities.enabledViews.includes(view.id)) as view}
            <button
              type="button"
              role="tab"
              data-testid="view-{view.id}"
              aria-selected={state.activeView === view.id}
              class:active={state.activeView === view.id}
              onclick={() => controller.actions.setActiveView(view.id)}
            >
              {view.label}
            </button>
          {/each}
        </div>
      {/if}

      <div
        class="workspace-main surface-card"
        data-testid="view-{state.activeView}"
        data-verified-output={!violation}
      >
        {#if violation}
          <div class="unsupported-workspace" data-testid="unsupported-workspace">
            <h2>Verified visualization unavailable</h2>
            <p>{violation.message}</p>
            <p>
              Try a smaller {trace.scope.kind === 'module' ? 'program' : 'function'} using supported assignments,
              loops, conditions, and list operations{trace.scope.kind === 'function' ? ', and returns' : ''}.
            </p>
          </div>
        {:else if emptyProgram}
          <div class="workspace-empty" data-testid="decode-empty-program">
            <h2>Nothing to run</h2>
            <p>This file contains definitions or comments but nothing to run.</p>
          </div>
        {:else if state.activeView === 'structure' && scene && semanticScene}
          <GraphInspector
            {scene}
            {semanticScene}
            {graph}
            {trace}
            selection={state.selection}
            onselectionchange={onSelectionChange}
            width={Math.max(...scene.layout.map((node) => node.x + node.width), 400) + 28}
            height={Math.max(...scene.layout.map((node) => node.y + node.height), 300) + 28}
          />
        {:else if state.activeView === 'flow' && projection}
          <LearnerFlowView {projection} />
        {:else if state.activeView === 'state' && semanticScene}
          <SemanticStateView {semanticScene} {stepIndex} />
        {:else if state.activeView === 'explain' && semanticScene}
          <GuidedTraceView {semanticScene} source={state.source} {stepIndex} />
        {/if}
      </div>
    {:else}
      <div class="workspace-empty surface-card" data-testid="lens-empty-workspace">
        <p>Paste supported Python and press Visualize to see structure, flow, and patterns.</p>
      </div>
    {/if}
  </section>

  {#if sidebar}
    <aside class="sidebar">
      {@render sidebar()}
    </aside>
  {/if}
</div>

<TruthDrawer
  detail={truthDetail}
  open={drawerOpen}
  onClose={() => (drawerOpen = false)}
  {showTechnical}
  onToggleTechnical={(value) => (showTechnical = value)}
/>

<style>
  .lens-workspace-grid { display: grid; gap: var(--space-5); min-width: 0; max-width: 100%; }
  .input-panel, .workspace, .sidebar, .workspace-main { min-width: 0; max-width: 100%; box-sizing: border-box; }
  @media (min-width: 1100px) {
    .lens-workspace-grid { grid-template-columns: 320px minmax(0, 1fr); align-items: start; }
    .lens-workspace-grid.with-sidebar { grid-template-columns: 320px minmax(0, 1fr) 280px; }
  }
  .input-panel { padding: var(--space-4); display: flex; flex-direction: column; gap: var(--space-4); }
  .input-tabs { display: flex; gap: var(--space-1); border-bottom: 1px solid var(--line-soft); padding-bottom: var(--space-2); }
  .input-tabs button { flex: 1; border: none; background: transparent; font-size: var(--text-xs); padding: var(--space-2); cursor: pointer; color: var(--ink-muted); border-radius: var(--radius-xs); }
  .input-tabs button.active { background: var(--brand-blue-soft); color: var(--brand-blue); font-weight: 600; }
  .field span { display: block; font-size: var(--text-xs); color: var(--ink-muted); margin-bottom: var(--space-2); }
  .args { width: 100%; font-family: var(--font-mono); font-size: var(--text-sm); padding: var(--space-3); border: 1px solid var(--line-soft); border-radius: var(--radius-sm); }
  .visualize { width: 100%; }
  .hint { font-size: var(--text-sm); color: var(--ink-muted); margin: 0; }
  .example-pills { display: flex; flex-wrap: wrap; gap: var(--space-2); }
  .error { color: var(--alert-orange); font-size: var(--text-sm); margin: 0; display: flex; flex-wrap: wrap; gap: var(--space-2); align-items: center; justify-content: space-between; }
  .error p { margin: 0; }
  .view-tabs { display: flex; gap: var(--space-2); margin-bottom: var(--space-3); }
  .decode-playback { display: flex; flex-wrap: wrap; align-items: center; justify-content: center; gap: var(--space-2); margin-bottom: var(--space-3); color: var(--ink-muted); font-size: var(--text-xs); }
  .view-tabs button { padding: var(--space-2) var(--space-4); border: none; background: transparent; font-size: var(--text-sm); color: var(--ink-muted); cursor: pointer; border-radius: var(--radius-sm); }
  .view-tabs button.active { background: var(--brand-blue-soft); color: var(--brand-blue); font-weight: 600; }
  .workspace-main { padding: var(--space-4); min-height: 360px; }
  .workspace-empty { padding: var(--space-8); text-align: center; color: var(--ink-muted); }
  .unsupported-workspace { min-height: 300px; display: grid; place-content: center; gap: var(--space-2); text-align: center; color: var(--ink-secondary); }
  .unsupported-workspace h2, .unsupported-workspace p { margin: 0; }
  .sidebar { display: flex; flex-direction: column; gap: var(--space-4); }
  @media (max-width: 767px) {
    .view-tabs button { flex: 1; min-width: 0; padding-inline: var(--space-2); }
  }
</style>
