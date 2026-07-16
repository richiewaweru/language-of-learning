<script lang="ts">
  import { ScenePlayer } from '@lol/visual-grammar';
  import '@lol/visual-grammar/styles.css';
  import {
    buildScene,
    buildTransferCheck,
    gradeTransferCheck,
    resolveSelection,
    type SemanticGraph,
    type Trace,
    type TransferCheck,
  } from '@lol/lens-scenes';
  import { detectPattern } from '@lol/lens-patterns';
  import type { PatternHit, Selection } from '@lol/lens-contracts';
  import CodeEditor from '$lib/CodeEditor.svelte';
  import { analyzeSource, loadAnalysis, recordEvent, saveAnalysis } from '$lib/api';

  const DEFAULT_SOURCE = `def calculate_total(prices):
    total = 0
    for price in prices:
        total = total + price
    return total`;

  let source = $state(DEFAULT_SOURCE);
  let argsText = $state('[3, 5, 2]');
  let error = $state('');
  let analyzing = $state(false);
  let graph = $state<SemanticGraph | null>(null);
  let trace = $state<Trace | null>(null);
  let pattern = $state<PatternHit | null>(null);
  let scene = $state<ReturnType<typeof buildScene> | null>(null);
  let violation = $state<{ construct: string; message: string } | null>(null);
  let selection = $state<Selection>({ stepIndex: 0 });
  let savedId = $state('');
  let loadId = $state('');
  let transfer = $state<TransferCheck | null>(null);
  let transferAnswer = $state('');
  let transferFeedback = $state('');
  let activeView = $state<'code' | 'shape' | 'trace' | 'pattern'>('shape');

  const unsupported = $derived(graph?.unsupported ?? []);
  const resolved = $derived(
    graph && trace && scene
      ? resolveSelection(selection, graph, trace, scene.layout)
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
  }

  function selectNode(nodeId: string) {
    const next: Selection = { nodeId };
    if (graph && trace && scene) {
      const r = resolveSelection(next, graph, trace, scene.layout);
      selection = { nodeId, line: r.line, stepIndex: r.stepIndex };
    } else {
      selection = next;
    }
  }

  function onStepChange(index: number) {
    selection = { stepIndex: index, line: trace?.steps[index]?.line };
  }

  function onSelectionChange(next: Selection) {
    selection = next;
  }
</script>

<svelte:head>
  <title>Decode — Language of Learning</title>
</svelte:head>

<main class="decode">
  <header>
    <p class="eyebrow">Decode</p>
    <h1>Structural Code Lens</h1>
    <p class="lede">Paste a supported Python function, analyze, and step through synchronized views.</p>
  </header>

  <section class="panel inputs">
    <label class="field">
      <span>Source</span>
      <CodeEditor value={source} onchange={(v) => (source = v)} />
    </label>
    <label class="field">
      <span>Sample call args (literal)</span>
      <input class="args" bind:value={argsText} placeholder="[3, 5, 2]" />
    </label>
    <div class="actions">
      <button type="button" class="btn primary" onclick={runAnalyze} disabled={analyzing}>
        {analyzing ? 'Analyzing…' : 'Analyze'}
      </button>
      <button type="button" class="btn" onclick={onSave} disabled={!graph}>Save</button>
      <input class="id" bind:value={loadId} placeholder="analysis id" />
      <button type="button" class="btn" onclick={onLoad}>Load</button>
      {#if savedId}
        <span class="saved">saved: {savedId}</span>
      {/if}
    </div>
    {#if error}
      <p class="error" data-testid="error">{error}</p>
    {/if}
  </section>

  {#if unsupported.length || violation}
    <section class="panel unsupported" data-testid="unsupported-panel">
      <h2>Unsupported / sandbox</h2>
      {#if violation}
        <p><strong>{violation.construct}</strong> — {violation.message}</p>
      {/if}
      {#each unsupported as region}
        <p>
          Line {region.sourceRange.startLine}: <strong>{region.construct}</strong> — {region.message}
        </p>
      {/each}
    </section>
  {/if}

  {#if graph && trace}
    <div class="tabs" role="tablist">
      {#each ['code', 'shape', 'trace', 'pattern'] as view}
        <button
          type="button"
          class="tab"
          class:active={activeView === view}
          role="tab"
          aria-selected={activeView === view}
          onclick={() => (activeView = view)}
        >
          {view}
        </button>
      {/each}
    </div>

    <section class="panel view" data-testid="view-{activeView}">
      {#if activeView === 'code'}
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
        {#if resolved?.primaryNodeId}
          <p class="hint">Primary node: {resolved.primaryNodeId}</p>
        {/if}
      {:else if activeView === 'shape' && scene}
        <ScenePlayer
          {scene}
          {graph}
          {trace}
          {selection}
          onselectionchange={onSelectionChange}
          reducedMotion={false}
        />
      {:else if activeView === 'trace'}
        <div class="trace-list">
          {#each trace.steps as step}
            <button
              type="button"
              class="trace-step"
              class:focus={selection.stepIndex === step.index}
              onclick={() => onStepChange(step.index)}
            >
              <strong>#{step.index}</strong> line {step.line} · {step.event.type}
              <code>{JSON.stringify(step.bindings)}</code>
            </button>
          {/each}
        </div>
      {:else if activeView === 'pattern'}
        {#if pattern}
          <p class="pattern-hit" data-testid="pattern-hit">
            <strong>{pattern.pattern}</strong>
            <span class="badge">{pattern.confidence}</span>
          </p>
          <p class="members">
            Members:
            {#each pattern.memberNodes as member}
              <button
                type="button"
                class="member"
                class:focus={resolved?.nodeIds.includes(member)}
                onclick={() => selectNode(member)}
              >
                {member}
              </button>
            {/each}
          </p>
          <p>Related: {pattern.related.join(', ')}</p>
        {:else}
          <p>No deterministic pattern matched.</p>
        {/if}
      {:else if activeView === 'shape'}
        <p>Shape view needs a successful scene build (function + steps).</p>
      {/if}
    </section>

    {#if transfer}
      <section class="panel transfer" data-testid="transfer-check">
        <h2>Transfer check</h2>
        <p>{transfer.prompt}</p>
        <div class="actions">
          <input type="number" min="1" bind:value={transferAnswer} aria-label="Line number" />
          <button type="button" class="btn" onclick={submitTransfer}>Check</button>
        </div>
        {#if transferFeedback}
          <p data-testid="transfer-feedback">{transferFeedback}</p>
        {/if}
      </section>
    {/if}
  {/if}

  <p class="nav"><a href="/">Home</a> · <a href="/slices/accumulate">Accumulate slice</a></p>
</main>

<style>
  .decode {
    max-width: 1100px;
    margin: 0 auto;
    padding: 1.25rem;
    background: var(--paper);
    min-height: 100vh;
  }
  .eyebrow {
    font: var(--eyebrow);
    letter-spacing: 0.15em;
    text-transform: uppercase;
    color: var(--muted);
    margin: 0;
  }
  h1 {
    margin: 0.2rem 0;
    color: var(--work-purple);
  }
  .lede {
    color: var(--muted);
  }
  .panel {
    border: var(--border-w) solid var(--ink);
    box-shadow: var(--shadow-panel);
    background: var(--paper);
    padding: 1rem;
    margin: 1rem 0;
  }
  .field {
    display: block;
    margin-bottom: 0.75rem;
  }
  .field span {
    display: block;
    font: 700 12px/1.2 var(--font-mono);
    text-transform: uppercase;
    letter-spacing: 0.08em;
    margin-bottom: 0.35rem;
  }
  .args,
  .id,
  input[type='number'] {
    font: 13px/1.4 var(--font-mono);
    border: var(--border-w) solid var(--ink);
    padding: 0.45rem 0.55rem;
    background: var(--paper);
  }
  .args {
    width: 100%;
  }
  .actions {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    align-items: center;
  }
  .btn {
    font: 700 12px/1 var(--font-mono);
    text-transform: uppercase;
    letter-spacing: 0.08em;
    padding: 0.55rem 0.75rem;
    border: var(--border-w) solid var(--ink);
    background: var(--paper);
    box-shadow: var(--shadow-btn);
    cursor: pointer;
  }
  .btn.primary {
    background: color-mix(in srgb, var(--work-purple) 12%, var(--paper));
  }
  .error {
    color: var(--alert-orange);
  }
  .unsupported {
    border-color: var(--alert-orange);
  }
  .tabs {
    display: flex;
    gap: 0.35rem;
  }
  .tab {
    font: 700 12px/1 var(--font-mono);
    text-transform: uppercase;
    padding: 0.5rem 0.75rem;
    border: var(--border-w) solid var(--ink);
    background: var(--paper);
    cursor: pointer;
  }
  .tab.active {
    background: color-mix(in srgb, var(--data-blue) 14%, var(--paper));
  }
  .code-view {
    margin: 0;
    font: 13px/1.45 var(--font-mono);
    white-space: pre;
  }
  .line {
    display: block;
    cursor: pointer;
  }
  .line.focus {
    background: color-mix(in srgb, var(--data-blue) 16%, transparent);
  }
  .ln {
    display: inline-block;
    width: 2.5rem;
    color: var(--muted);
  }
  .trace-list {
    margin: 0;
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
  }
  .trace-step {
    text-align: left;
    font: 12px/1.4 var(--font-mono);
    border: var(--border-w) solid var(--line);
    background: var(--paper);
    padding: 0.4rem 0.5rem;
    cursor: pointer;
  }
  .trace-step.focus {
    outline: 2px solid var(--flow-teal);
  }
  .pattern-hit {
    font-size: 1.25rem;
  }
  .members {
    display: flex;
    flex-wrap: wrap;
    gap: 0.35rem;
    align-items: center;
  }
  .member {
    font: 12px/1.2 var(--font-mono);
    border: var(--border-w) solid var(--line);
    background: var(--paper);
    padding: 0.2rem 0.4rem;
    cursor: pointer;
  }
  .member.focus {
    outline: 2px solid var(--flow-teal);
  }
  .badge {
    font: 700 11px/1 var(--font-mono);
    text-transform: uppercase;
    margin-left: 0.5rem;
    color: var(--exit-green);
  }
  .saved {
    font: 12px/1.2 var(--font-mono);
    color: var(--muted);
  }
  .nav {
    margin-top: 1.5rem;
  }
  a {
    color: var(--data-blue);
  }
  .hint {
    color: var(--muted);
    font-size: 0.9rem;
  }
</style>
