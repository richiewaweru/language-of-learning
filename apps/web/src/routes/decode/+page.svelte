<script lang="ts">
  import '@lol/visual-grammar/styles.css';
  import {
    buildScene,
    normalizeSemanticScene,
    buildTransferCheck,
    gradeTransferCheck,
    resolveSelection,
    resolveTruthDetail,
    type SemanticGraph,
    type Trace,
    type TransferCheck,
  } from '@lol/lens-scenes';
  import { detectPattern } from '@lol/lens-patterns';
  import type { PatternHit, Selection, SemanticScene } from '@lol/lens-contracts';
  import CodeEditor from '$lib/CodeEditor.svelte';
  import TruthDrawer from '$lib/product/TruthDrawer.svelte';
  import PageContainer from '$lib/learner-ui/shell/PageContainer.svelte';
  import Breadcrumbs from '$lib/learner-ui/shell/Breadcrumbs.svelte';
  import LearnerFlowView from '$lib/learner-ui/lesson/LearnerFlowView.svelte';
  import SemanticStateView from '$lib/learner-ui/lesson/SemanticStateView.svelte';
  import GuidedTraceView from '$lib/learner-ui/lesson/GuidedTraceView.svelte';
  import GraphInspector from '$lib/learner-ui/lesson/GraphInspector.svelte';
  import AskLens from '$lib/learner-ui/lesson/AskLens.svelte';
  import { deriveFlowProjection } from '$lib/learner-ui/projection/deriveSemanticProjections';
  import { analyzeSource, recordEvent } from '$lib/api';

  let { data } = $props();

  function createInitialDecodeState() {
    const pack = data.pack;
    return {
      source: pack.source,
      argsText: pack.argsRepr[0] ?? '[]',
      graph: pack.graph,
      trace: pack.trace,
      pattern: detectPattern(pack.graph),
      scene: pack.scene,
      semanticScene: pack.semanticScene,
      selection: { stepIndex: 0 } as Selection,
      transfer: buildTransferCheck(pack.graph),
    };
  }

  const initial = createInitialDecodeState();
  let source = $state(initial.source);
  let argsText = $state(initial.argsText);
  let error = $state('');
  let analyzing = $state(false);
  let graph = $state<SemanticGraph | null>(initial.graph);
  let trace = $state<Trace | null>(initial.trace);
  let pattern = $state<PatternHit | null>(initial.pattern);
  let scene = $state<ReturnType<typeof buildScene> | null>(initial.scene);
  let semanticScene = $state<SemanticScene | null>(initial.semanticScene);
  let violation = $state<{ construct: string; message: string } | null>(null);
  let selection = $state<Selection>(initial.selection);
  let transfer = $state<TransferCheck | null>(initial.transfer);
  let transferAnswer = $state('');
  let transferFeedback = $state('');
  let activeView = $state<'structure' | 'flow' | 'state' | 'explain'>('flow');
  let inputTab = $state<'paste' | 'examples'>('paste');
  let drawerOpen = $state(false);
  let showTechnical = $state(false);

  const unsupported = $derived(graph?.unsupported ?? []);
  const resolved = $derived(
    graph && trace && scene
      ? resolveSelection(selection, graph, trace, scene.layout)
      : null,
  );

  const stepIndex = $derived(selection.stepIndex ?? 0);
  const totalSteps = $derived(semanticScene?.steps.length ?? 0);
  const moduleInput = $derived(sourceHasModuleEntry(source));
  const emptyProgram = $derived(
    Boolean(
      graph &&
        trace?.scope.kind === 'module' &&
        !violation &&
        trace.steps.length === 0,
    ),
  );

  const truthDetail = $derived(
    graph && trace && scene
      ? resolveTruthDetail(selection, graph, trace, scene, stepIndex)
      : null,
  );

  function parseArgs(text: string): string[] {
    const trimmed = text.trim();
    if (!trimmed) return [];
    const args: string[] = [];
    let start = 0;
    let depth = 0;
    let quote = '';
    let escaped = false;
    for (let index = 0; index < trimmed.length; index += 1) {
      const character = trimmed[index];
      if (quote) {
        if (escaped) escaped = false;
        else if (character === '\\') escaped = true;
        else if (character === quote) quote = '';
        continue;
      }
      if (character === '"' || character === "'") quote = character;
      else if ('([{'.includes(character)) depth += 1;
      else if (')]}'.includes(character)) depth = Math.max(0, depth - 1);
      else if (character === ',' && depth === 0) {
        args.push(trimmed.slice(start, index).trim());
        start = index + 1;
      }
    }
    args.push(trimmed.slice(start).trim());
    return args.filter(Boolean);
  }

  function sourceHasModuleEntry(value: string): boolean {
    const topLevel = value
      .split('\n')
      .map((line) => line.trimEnd())
      .filter((line) => line.trim() && !line.trimStart().startsWith('#'))
      .filter((line) => !/^\s/.test(line));
    if (topLevel.length === 0) return true;
    return topLevel.some(
      (line) =>
        !line.startsWith('def ') &&
        !line.startsWith('async def ') &&
        !line.startsWith('@'),
    );
  }

  async function runAnalyze() {
    analyzing = true;
    error = '';
    transferFeedback = '';
    try {
      const argsRepr = moduleInput ? [] : parseArgs(argsText);
      const result = await analyzeSource(source, argsRepr);
      graph = result.graph;
      trace = result.trace as Trace;
      violation = result.violation;
      pattern = detectPattern(result.graph);
      if (!result.violation && result.trace.steps?.length) {
        scene = buildScene(result.graph, result.trace as Trace);
        semanticScene = normalizeSemanticScene(result.graph, result.trace as Trace);
      } else {
        scene = null;
        semanticScene = null;
      }
      transfer = buildTransferCheck(result.graph);
      selection = { stepIndex: 0 };
      await recordEvent('analyze', {
        scopeKind: result.trace.scope.kind,
        scopeId:
          result.trace.scope.kind === 'function'
            ? result.trace.scope.functionId
            : result.trace.scope.id,
        functionId:
          result.trace.scope.kind === 'function'
            ? result.trace.scope.functionId
            : undefined,
        unsupported: result.graph.unsupported?.length ?? 0,
        pattern: pattern?.pattern ?? null,
      });
    } catch (err) {
      error = err instanceof Error ? err.message : String(err);
    } finally {
      analyzing = false;
    }
  }

  function submitTransfer() {
    if (!transfer) return;
    const answer = Number(transferAnswer);
    const grade = gradeTransferCheck(transfer, answer);
    transferFeedback = grade.feedback;
    recordEvent('transfer', { correct: grade.correct, nodeId: transfer.nodeId });
  }

  function selectLine(line: number) {
    const next: Selection = { line, nodeId: undefined, stepIndex: selection.stepIndex };
    if (graph && trace && scene) {
      const r = resolveSelection(next, graph, trace, scene.layout);
      selection = { line, stepIndex: r.stepIndex };
    } else {
      selection = next;
    }
    drawerOpen = true;
  }

  function selectNode(nodeId: string) {
    const next: Selection = { nodeId };
    if (graph && trace && scene) {
      const r = resolveSelection(next, graph, trace, scene.layout);
      selection = { nodeId, line: r.line, stepIndex: r.stepIndex };
    } else {
      selection = next;
    }
    drawerOpen = true;
  }

  function onSelectionChange(next: Selection) {
    selection = next;
  }
  function goToStep(next: number) {
    const last = Math.max(0, (semanticScene?.steps.length ?? 1) - 1);
    selection = { ...selection, stepIndex: Math.min(last, Math.max(0, next)) };
  }
  const projection = $derived(
    semanticScene
      ? deriveFlowProjection(semanticScene, stepIndex)
      : null,
  );
  const patternLessonHref = $derived(
    pattern?.pattern === 'ACCUMULATE'
      ? '/learn/python-foundations/loops/accumulate'
      : pattern?.pattern === 'COUNT'
        ? '/learn/python-foundations/loops/count'
        : pattern?.pattern === 'FILTER'
          ? '/learn/python-foundations/loops/filter'
          : pattern?.pattern === 'TRANSFORM'
            ? '/learn/python-foundations/loops/transform'
            : pattern?.pattern === 'SEARCH'
              ? '/learn/python-foundations/loops/search'
            : null,
  );
</script>

<svelte:head>
  <title>Decode — Language of Learning</title>
</svelte:head>

<PageContainer wide>
  <Breadcrumbs
    items={[
      { label: 'Python Foundations', href: '/learn/python-foundations' },
      { label: 'Decode' },
    ]}
  />

  <header class="decode-header">
    <h1>Decode a concept</h1>
    <p class="lede">Paste code or content and get a clear, visual explanation.</p>
  </header>

  <div class="decode-layout">
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
          <CodeEditor value={source} onchange={(v) => (source = v)} />
        </label>
        {#if !moduleInput}
          <label class="field args-field">
            <span>Sample input</span>
            <input
              class="args"
              bind:value={argsText}
              placeholder="[2, 4, 6, 8]"
              data-testid="decode-sample-input"
            />
          </label>
        {:else}
          <p class="hint" data-testid="module-input-note">Program code runs without sample input.</p>
        {/if}
      {:else if inputTab === 'examples'}
        <p class="hint">Explore supported functions, loops, lists, and conditionals.</p>
        <div class="example-pills">
          {#each ['Functions', 'Loops', 'Lists', 'Conditionals'] as ex}
            <button type="button" class="pill-tag" onclick={() => (inputTab = 'paste')}>{ex}</button>
          {/each}
        </div>
      {/if}

      <button
        type="button"
        class="btn-primary visualize"
        onclick={runAnalyze}
        disabled={analyzing}
        data-testid="decode-visualize"
      >
        {analyzing ? 'Visualizing…' : 'Visualize'}
      </button>

      {#if error}
        <div class="error" data-testid="decode-error" role="alert">
          <p>We could not visualize that program. {error}</p>
          <button type="button" class="btn-secondary" onclick={runAnalyze}>Retry</button>
        </div>
      {:else if violation}
        <div class="error" data-testid="decode-unsupported" role="status">
          <p><strong>Execution not verified.</strong> {violation.message}</p>
          <p>Lens will not invent a trace for unsupported behavior.</p>
        </div>
      {/if}
    </section>

    <section class="workspace">
      {#if graph && trace}
        {#if totalSteps}
          <div class="decode-playback" data-testid="decode-playback" aria-label="Execution controls">
            <button type="button" class="btn-secondary" onclick={() => goToStep(0)} disabled={stepIndex === 0}>Start</button>
            <button type="button" class="btn-secondary" onclick={() => goToStep(stepIndex - 1)} disabled={stepIndex === 0}>Back</button>
            <span data-testid="decode-step-count">Step {stepIndex + 1} of {totalSteps}</span>
            <button type="button" class="btn-secondary" onclick={() => goToStep(stepIndex + 1)} disabled={stepIndex >= totalSteps - 1}>Next</button>
            <button type="button" class="btn-secondary" onclick={() => goToStep(totalSteps - 1)} disabled={stepIndex >= totalSteps - 1}>End</button>
          </div>
        {/if}
        {#if !violation}
          <div class="view-tabs" role="tablist">
            {#each [
              { id: 'flow', label: 'Flow' },
              { id: 'state', label: 'State' },
              { id: 'explain', label: 'Guided Trace' },
              { id: 'structure', label: 'Graph Inspector' },
            ] as view}
              <button
                type="button"
                role="tab"
                data-testid="view-{view.id}"
                aria-selected={activeView === view.id}
                class:active={activeView === view.id}
                onclick={() => (activeView = view.id as typeof activeView)}
              >
                {view.label}
              </button>
            {/each}
          </div>
        {/if}

        <div class="workspace-main surface-card" data-testid="view-{activeView}">
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
          {:else if activeView === 'structure' && scene && semanticScene}
            <GraphInspector
              {scene}
              {semanticScene}
              {graph}
              {trace}
              {selection}
              onselectionchange={onSelectionChange}
              width={Math.max(...scene.layout.map((node) => node.x + node.width), 400) + 28}
              height={Math.max(...scene.layout.map((node) => node.y + node.height), 300) + 28}
            />
          {:else if activeView === 'flow' && projection}
            <LearnerFlowView {projection} />
          {:else if activeView === 'state' && semanticScene}
            <SemanticStateView {semanticScene} {stepIndex} />
          {:else if activeView === 'explain' && semanticScene}
            <GuidedTraceView {semanticScene} {source} {stepIndex} />
          {/if}
        </div>
      {:else}
        <div class="workspace-empty surface-card">
          <p>Paste supported Python and press Visualize to see structure, flow, and patterns.</p>
        </div>
      {/if}
    </section>

    <aside class="sidebar">
      {#if pattern}
        <div class="insight-card pattern-card surface-card" data-testid="pattern-hit">
          <p class="card-label">Pattern detected</p>
          <h2>{pattern.pattern[0]}{pattern.pattern.slice(1).toLowerCase()}</h2>
          <p class="confidence">{pattern.confidence} confidence</p>
          {#if patternLessonHref}<a href={patternLessonHref} class="link">Learn this pattern →</a>{/if}
        </div>
      {/if}

      <div class="insight-card surface-card">
        <p class="card-label">Try this next</p>
        <ul>
          <li>Rename the program variables, then Visualize again.</li>
          <li>Change an input value and predict which State row will change.</li>
        </ul>
      </div>

      {#if transfer}
        <div class="insight-card surface-card" data-testid="transfer-check">
          <p class="card-label">Challenge</p>
          <p>{transfer.prompt}</p>
          <div class="challenge-row">
            <input type="number" min="1" bind:value={transferAnswer} aria-label="Line number" />
            <button type="button" class="btn-secondary" onclick={submitTransfer}>Check</button>
          </div>
          {#if transferFeedback}
            <p data-testid="transfer-feedback">{transferFeedback}</p>
          {/if}
        </div>
      {/if}
    </aside>
  </div>

  <AskLens
    {source}
    argsRepr={moduleInput ? [] : parseArgs(argsText)}
    {stepIndex}
    lessonGoal="Connect the current Flow, State, and Guided Trace views."
  />

  <footer class="scope-strip surface-card">
    <p>
      <strong>Scope:</strong> Lens explains supported programs and single functions built from variables, arithmetic,
      comparisons, Boolean guards, loops, lists, state updates, selected built-ins, and returns. It does not yet
      expand recursion, helper functions, objects, dictionaries, comprehensions, exceptions, imports, generators,
      or async code.
      {#if unsupported.length}
        {unsupported.length} unsupported region(s) detected.
      {:else if graph}
        All good for this snippet.
      {/if}
    </p>
  </footer>

  <TruthDrawer
    detail={truthDetail}
    open={drawerOpen}
    onClose={() => (drawerOpen = false)}
    {showTechnical}
    onToggleTechnical={(v) => (showTechnical = v)}
  />
</PageContainer>

<style>
  .decode-header {
    margin: var(--space-5) 0 var(--space-6);
  }

  h1 {
    font-family: var(--font-display);
    font-size: var(--heading-xl);
    margin: 0 0 var(--space-2);
    color: var(--ink-primary);
  }

  .lede {
    color: var(--ink-secondary);
    margin: 0;
    max-width: 50ch;
  }

  .decode-layout {
    display: grid;
    gap: var(--space-5);
  }

  @media (min-width: 1100px) {
    .decode-layout {
      grid-template-columns: 320px 1fr 280px;
      align-items: start;
    }
  }

  .input-panel {
    padding: var(--space-4);
    display: flex;
    flex-direction: column;
    gap: var(--space-4);
  }

  .input-tabs {
    display: flex;
    gap: var(--space-1);
    border-bottom: 1px solid var(--line-soft);
    padding-bottom: var(--space-2);
  }

  .input-tabs button {
    flex: 1;
    border: none;
    background: transparent;
    font-size: var(--text-xs);
    padding: var(--space-2);
    cursor: pointer;
    color: var(--ink-muted);
    border-radius: var(--radius-xs);
  }

  .input-tabs button.active {
    background: var(--brand-blue-soft);
    color: var(--brand-blue);
    font-weight: 600;
  }

  .field span {
    display: block;
    font-size: var(--text-xs);
    color: var(--ink-muted);
    margin-bottom: var(--space-2);
  }

  .args {
    width: 100%;
    font-family: var(--font-mono);
    font-size: var(--text-sm);
    padding: var(--space-3);
    border: 1px solid var(--line-soft);
    border-radius: var(--radius-sm);
  }

  .visualize {
    width: 100%;
  }

  .hint {
    font-size: var(--text-sm);
    color: var(--ink-muted);
    margin: 0;
  }

  .example-pills {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-2);
  }

  .error {
    color: var(--alert-orange);
    font-size: var(--text-sm);
    margin: 0;
    display:flex;
    flex-wrap:wrap;
    gap:var(--space-2);
    align-items:center;
    justify-content:space-between;
  }
  .error p { margin:0; }

  .view-tabs {
    display: flex;
    gap: var(--space-2);
    margin-bottom: var(--space-3);
  }
  .decode-playback { display:flex; flex-wrap:wrap; align-items:center; justify-content:center; gap:var(--space-2); margin-bottom:var(--space-3); color:var(--ink-muted); font-size:var(--text-xs); }

  .view-tabs button {
    padding: var(--space-2) var(--space-4);
    border: none;
    background: transparent;
    font-size: var(--text-sm);
    color: var(--ink-muted);
    cursor: pointer;
    border-radius: var(--radius-sm);
  }

  .view-tabs button.active {
    background: var(--brand-blue-soft);
    color: var(--brand-blue);
    font-weight: 600;
  }

  .workspace-main {
    padding: var(--space-4);
    min-height: 360px;
  }

  .workspace-empty {
    padding: var(--space-8);
    text-align: center;
    color: var(--ink-muted);
  }
  .unsupported-workspace { min-height:300px; display:grid; place-content:center; gap:var(--space-2); text-align:center; color:var(--ink-secondary); }
  .unsupported-workspace h2,.unsupported-workspace p { margin:0; }

  .sidebar {
    display: flex;
    flex-direction: column;
    gap: var(--space-4);
  }

  .insight-card {
    padding: var(--space-5);
  }

  .card-label {
    font-size: var(--text-xs);
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: var(--ink-muted);
    margin: 0 0 var(--space-2);
  }

  .pattern-card {
    background: var(--flow-teal-soft);
    border-color: color-mix(in srgb, var(--flow-teal) 25%, transparent);
  }

  .pattern-card h2 {
    margin: 0 0 var(--space-2);
    font-size: var(--heading-md);
    color: var(--ink-primary);
  }

  .confidence {
    font-size: var(--text-sm);
    color: var(--ink-secondary);
    margin: 0 0 var(--space-3);
  }

  .link {
    font-size: var(--text-sm);
    font-weight: 600;
    color: var(--brand-blue);
    text-decoration: none;
  }

  .insight-card ul {
    margin: 0;
    padding-left: var(--space-4);
    font-size: var(--text-sm);
    color: var(--ink-secondary);
    line-height: 1.5;
  }

  .challenge-row {
    display: flex;
    gap: var(--space-2);
    margin-top: var(--space-3);
  }

  .scope-strip {
    margin-top: var(--space-6);
    padding: var(--space-4) var(--space-5);
    font-size: var(--text-sm);
    color: var(--ink-secondary);
  }

</style>
