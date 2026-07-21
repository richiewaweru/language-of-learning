<script lang="ts">
  import { ScenePlayer } from '@lol/visual-grammar';
  import '@lol/visual-grammar/styles.css';
  import {
    buildScene,
    buildTransferCheck,
    gradeTransferCheck,
    resolveSelection,
    resolveTruthDetail,
    type SemanticGraph,
    type Trace,
    type TransferCheck,
  } from '@lol/lens-scenes';
  import { detectPattern } from '@lol/lens-patterns';
  import type { PatternHit, Selection } from '@lol/lens-contracts';
  import CodeEditor from '$lib/CodeEditor.svelte';
  import TruthDrawer from '$lib/product/TruthDrawer.svelte';
  import PageContainer from '$lib/learner-ui/shell/PageContainer.svelte';
  import Breadcrumbs from '$lib/learner-ui/shell/Breadcrumbs.svelte';
  import LearnerFlowView from '$lib/learner-ui/lesson/LearnerFlowView.svelte';
  import { deriveLearnerProjection, eventToLearnerLabel } from '$lib/learner-ui/projection/deriveLearnerProjection';
  import { analyzeSource, loadAnalysis, recordEvent, saveAnalysis } from '$lib/api';

  let { data } = $props();

  function createInitialDecodeState() {
    const pack = data.pack;
    const initialStep =
      pack.trace.steps
        .map((step, index) => ({ type: step.event.type, index }))
        .filter((step) => step.type === 'state_change')
        .at(-2)?.index ?? 0;
    return {
      source: pack.source,
      argsText: pack.argsRepr[0] ?? '[]',
      graph: pack.graph,
      trace: pack.trace,
      pattern: detectPattern(pack.graph),
      scene: pack.scene,
      selection: { stepIndex: initialStep } as Selection,
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
  let violation = $state<{ construct: string; message: string } | null>(null);
  let selection = $state<Selection>(initial.selection);
  let savedId = $state('');
  let loadId = $state('');
  let transfer = $state<TransferCheck | null>(initial.transfer);
  let transferAnswer = $state('');
  let transferFeedback = $state('');
  let activeView = $state<'structure' | 'flow' | 'state' | 'explain'>('structure');
  let inputTab = $state<'paste' | 'upload' | 'examples'>('paste');
  let drawerOpen = $state(false);
  let showTechnical = $state(false);

  const unsupported = $derived(graph?.unsupported ?? []);
  const resolved = $derived(
    graph && trace && scene
      ? resolveSelection(selection, graph, trace, scene.layout)
      : null,
  );

  const stepIndex = $derived(selection.stepIndex ?? 0);

  const truthDetail = $derived(
    graph && trace && scene
      ? resolveTruthDetail(selection, graph, trace, scene, stepIndex)
      : null,
  );

  function parseArgs(text: string): string[] {
    const trimmed = text.trim();
    if (!trimmed) return [];
    // single literal or comma-separated literals
    if (trimmed.startsWith('[')) return [trimmed];
    return trimmed.split(',').map((s) => s.trim()).filter(Boolean);
  }

  async function runAnalyze() {
    analyzing = true;
    error = '';
    transferFeedback = '';
    try {
      const argsRepr = parseArgs(argsText);
      const result = await analyzeSource(source, argsRepr);
      graph = result.graph;
      trace = result.trace as Trace;
      violation = result.violation;
      pattern = detectPattern(result.graph);
      if (result.graph.nodes.some((n) => n.kind === 'function') && result.trace.steps?.length) {
        scene = buildScene(result.graph, result.trace as Trace);
      } else {
        scene = null;
      }
      transfer = buildTransferCheck(result.graph);
      selection = { stepIndex: 0 };
      await recordEvent('analyze', {
        functionId: result.trace.call?.functionId,
        unsupported: result.graph.unsupported?.length ?? 0,
        pattern: pattern?.pattern ?? null,
      });
    } catch (err) {
      error = err instanceof Error ? err.message : String(err);
    } finally {
      analyzing = false;
    }
  }

  async function onSave() {
    if (!graph || !trace) return;
    try {
      const res = await saveAnalysis({
        source,
        argsRepr: parseArgs(argsText),
        graph,
        trace,
        pattern,
        scene,
        id: savedId || undefined,
      });
      savedId = res.id;
      loadId = res.id;
      await recordEvent('save', { id: res.id });
    } catch (err) {
      error = err instanceof Error ? err.message : String(err);
    }
  }

  async function onLoad() {
    if (!loadId.trim()) return;
    try {
      const data = await loadAnalysis(loadId.trim());
      source = String(data.source ?? '');
      argsText = Array.isArray(data.argsRepr) ? data.argsRepr.join(', ') : argsText;
      graph = data.graph as SemanticGraph;
      trace = data.trace as Trace;
      pattern = (data.pattern as PatternHit | null) ?? detectPattern(graph);
      scene = (data.scene as ReturnType<typeof buildScene> | null) ??
        (trace.steps?.length ? buildScene(graph, trace) : null);
      transfer = buildTransferCheck(graph);
      savedId = String(data.id ?? loadId);
      selection = { stepIndex: 0 };
      await recordEvent('load', { id: savedId });
    } catch (err) {
      error = err instanceof Error ? err.message : String(err);
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

  function onStepChange(index: number) {
    selection = { stepIndex: index, line: trace?.steps[index]?.line };
  }

  function onSelectionChange(next: Selection) {
    selection = next;
  }
  const projection = $derived(
    graph && trace && scene
      ? deriveLearnerProjection(graph, trace, scene, stepIndex)
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
        {#each ['paste', 'upload', 'examples'] as tab}
          <button
            type="button"
            class:active={inputTab === tab}
            onclick={() => (inputTab = tab as typeof inputTab)}
          >
            {tab === 'paste' ? 'Paste Code' : tab === 'upload' ? 'Upload' : 'Examples'}
          </button>
        {/each}
      </div>

      {#if inputTab === 'paste'}
        <label class="field">
          <span class="sr-only">Python source</span>
          <CodeEditor value={source} onchange={(v) => (source = v)} />
        </label>
        <label class="field args-field">
          <span>Sample input</span>
          <input class="args" bind:value={argsText} placeholder="[2, 4, 6, 8]" />
        </label>
      {:else if inputTab === 'examples'}
        <p class="hint">Quick examples use the default accumulate function.</p>
        <div class="example-pills">
          {#each ['Functions', 'Loops', 'Lists', 'Conditionals'] as ex}
            <button type="button" class="pill-tag" onclick={() => (inputTab = 'paste')}>{ex}</button>
          {/each}
        </div>
      {:else}
        <p class="hint">File upload is not yet available. Paste your code instead.</p>
      {/if}

      <button type="button" class="btn-primary visualize" onclick={runAnalyze} disabled={analyzing}>
        {analyzing ? 'Visualizing…' : 'Visualize'}
      </button>

      {#if error}
        <p class="error" data-testid="error">{error}</p>
      {/if}
    </section>

    <section class="workspace">
      {#if graph && trace}
        <div class="view-tabs" role="tablist">
          {#each [
            { id: 'structure', label: 'Structure' },
            { id: 'flow', label: 'Flow' },
            { id: 'state', label: 'State' },
            { id: 'explain', label: 'Explain' },
          ] as view}
            <button
              type="button"
              class:active={activeView === view.id}
              onclick={() => (activeView = view.id as typeof activeView)}
            >
              {view.label}
            </button>
          {/each}
        </div>

        <div class="workspace-main surface-card" data-testid="view-{activeView}">
          {#if activeView === 'structure'}
            <pre class="code-view">{#each source.split('\n') as line, i}
<span
  class="line"
  class:focus={resolved?.line === i + 1}
  role="button"
  tabindex="0"
  onclick={() => selectLine(i + 1)}
  onkeydown={(e) => e.key === 'Enter' && selectLine(i + 1)}
><span class="ln">{i + 1}</span>{line}</span>
{/each}</pre>
          {:else if activeView === 'flow' && scene && projection}
            <LearnerFlowView steps={projection.flowSteps} />
          {:else if activeView === 'state'}
            <div class="state-list">
              {#each trace.steps as step}
                <button
                  type="button"
                  class="state-step"
                  class:focus={selection.stepIndex === step.index}
                  onclick={() => onStepChange(step.index)}
                >
                  <strong>Step {step.index + 1}</strong>
                  <span>{eventToLearnerLabel(step.event.type)}</span>
                </button>
              {/each}
            </div>
          {:else if activeView === 'explain' && pattern}
            <p class="explain-text">
              This code {pattern.pattern === 'ACCUMULATE' ? 'builds one combined result by updating state on each loop pass.' : 'follows a recognizable loop pattern.'}
            </p>
          {:else if activeView === 'flow' && scene}
            <ScenePlayer
              {scene}
              {graph}
              {trace}
              {selection}
              onselectionchange={onSelectionChange}
              reducedMotion={false}
            />
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
          <a href="/learn/python-foundations/loops/accumulate" class="link">Learn more →</a>
        </div>
      {/if}

      <div class="insight-card surface-card">
        <p class="card-label">Try this next</p>
        <ul>
          <li>Modify the code to return the sum of cubes</li>
          <li>What if the list is empty? Add a guard.</li>
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

  <footer class="scope-strip surface-card">
    <p>
      <strong>Scope:</strong> We currently support core Python loop patterns.
      {#if unsupported.length}
        {unsupported.length} unsupported region(s) detected.
      {:else if graph}
        All good for this snippet.
      {/if}
    </p>
    <details class="admin">
      <summary>Save / load analysis</summary>
      <div class="admin-row">
        <button type="button" class="btn-secondary" onclick={onSave} disabled={!graph}>Save</button>
        <input class="id" bind:value={loadId} placeholder="analysis id" />
        <button type="button" class="btn-secondary" onclick={onLoad}>Load</button>
        {#if savedId}<span class="saved">saved: {savedId}</span>{/if}
      </div>
    </details>
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
  }

  .view-tabs {
    display: flex;
    gap: var(--space-2);
    margin-bottom: var(--space-3);
  }

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

  .code-view {
    margin: 0;
    font: 14px/1.6 var(--font-mono);
    white-space: pre;
  }

  .line {
    display: block;
    cursor: pointer;
    padding: 2px var(--space-2);
    border-radius: var(--radius-xs);
  }

  .line.focus {
    background: var(--brand-blue-soft);
  }

  .ln {
    display: inline-block;
    width: 2.5rem;
    color: var(--ink-faint);
  }

  .state-list {
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
  }

  .state-step {
    text-align: left;
    padding: var(--space-3);
    border: 1px solid var(--line-soft);
    border-radius: var(--radius-sm);
    background: var(--surface-primary);
    cursor: pointer;
    font-size: var(--text-sm);
  }

  .state-step.focus {
    border-color: var(--flow-teal);
    background: var(--flow-teal-soft);
  }

  .state-step span {
    display: block;
    color: var(--ink-secondary);
    margin-top: var(--space-1);
  }

  .explain-text {
    font-size: var(--text-md);
    line-height: 1.6;
    color: var(--ink-secondary);
    margin: 0;
    padding: var(--space-4);
  }

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

  .admin {
    margin-top: var(--space-3);
    font-size: var(--text-xs);
  }

  .admin-row {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-2);
    margin-top: var(--space-2);
    align-items: center;
  }

  .id {
    font-family: var(--font-mono);
    font-size: var(--text-xs);
    padding: var(--space-2);
    border: 1px solid var(--line-soft);
    border-radius: var(--radius-xs);
  }

  .saved {
    font-size: var(--text-xs);
    color: var(--ink-faint);
  }
</style>
