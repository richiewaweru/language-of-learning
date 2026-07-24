<script lang="ts">
  import '@lol/visual-grammar/styles.css';
  import { gradeTransferCheck } from '@lol/lens-scenes';
  import type { LensCapabilities, LensEngine } from '@lol/lens-contracts';
  import { onMount, untrack } from 'svelte';
  import type { DemoPack } from '$lib/product/loadDemoPack';
  import PageContainer from '$lib/learner-ui/shell/PageContainer.svelte';
  import Breadcrumbs from '$lib/learner-ui/shell/Breadcrumbs.svelte';
  import AskLens from '$lib/learner-ui/lesson/AskLens.svelte';
  import { recordEvent } from '$lib/api';
  import LensWorkspace from './LensWorkspace.svelte';
  import { buildLensArtifacts, createLensEngine } from './engine';
  import { parseLensArgs, sourceHasModuleEntry } from './input';
  import { createLensSession } from './session.svelte';
  import { lensSessionStorageKey, noOpLensPersistence } from './storage';

  let { pack }: { pack: DemoPack } = $props();
  const initialPack = untrack(() => pack);

  const capabilities: LensCapabilities = {
    canEditSource: true,
    canPasteSource: true,
    canReplaceProgram: true,
    canRun: true,
    canReset: false,
    canUseFreeformInput: true,
    enabledViews: ['flow', 'state', 'explain', 'structure'],
  };

  const baseEngine = createLensEngine();
  const engine: LensEngine = {
    async analyze(request) {
      const artifacts = await baseEngine.analyze(request);
      await recordEvent('analyze', {
        scopeKind: artifacts.trace.scope.kind,
        scopeId:
          artifacts.trace.scope.kind === 'function'
            ? artifacts.trace.scope.functionId
            : artifacts.trace.scope.id,
        functionId:
          artifacts.trace.scope.kind === 'function'
            ? artifacts.trace.scope.functionId
            : undefined,
        unsupported: artifacts.graph.unsupported?.length ?? 0,
        pattern: artifacts.pattern?.pattern ?? null,
      });
      return artifacts;
    },
  };

  const initialArtifacts = buildLensArtifacts({
    graph: initialPack.graph,
    trace: initialPack.trace,
    scene: initialPack.scene,
    semanticScene: initialPack.semanticScene,
  });

  const { controller } = createLensSession({
    id: 'decode-default',
    kind: 'decode',
    source: initialPack.source,
    argsText: initialPack.argsRepr[0] ?? '[]',
    artifacts: initialArtifacts,
    engine,
    capabilities,
    persistence: noOpLensPersistence,
    persistenceKey: lensSessionStorageKey({ kind: 'decode', ownerId: 'default' }),
  });
  onMount(() => void controller.actions.hydrate());

  let transferAnswer = $state('');
  let transferFeedback = $state('');
  const artifacts = $derived(controller.state.artifacts);
  const pattern = $derived(artifacts?.pattern ?? null);
  const transfer = $derived(artifacts?.transfer ?? null);
  const unsupported = $derived(artifacts?.graph.unsupported ?? []);
  const stepIndex = $derived(controller.state.selection.stepIndex ?? 0);
  const moduleInput = $derived(sourceHasModuleEntry(controller.state.source));
  const patternLessonHref = $derived(
    pattern?.pattern === 'ACCUMULATE'
      ? '/learn/python-foundations/loops-over-lists'
      : pattern?.pattern === 'COUNT'
        ? '/learn/python-foundations/loops-over-lists'
        : pattern?.pattern === 'FILTER'
          ? '/learn/python-foundations/loops-over-lists'
          : pattern?.pattern === 'TRANSFORM'
            ? '/learn/python-foundations/loops-over-lists'
            : pattern?.pattern === 'SEARCH'
              ? '/learn/python-foundations/loops-over-lists'
              : null,
  );

  function submitTransfer() {
    if (!transfer) return;
    const grade = gradeTransferCheck(transfer, Number(transferAnswer));
    transferFeedback = grade.feedback;
    void recordEvent('transfer', { correct: grade.correct, nodeId: transfer.nodeId });
  }
</script>

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

  {#snippet sidebar()}
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
  {/snippet}

  <LensWorkspace {controller} {sidebar} />

  <AskLens
    source={controller.state.source}
    argsRepr={moduleInput ? [] : parseLensArgs(controller.state.argsText)}
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
      {:else if artifacts?.graph}
        All good for this snippet.
      {/if}
    </p>
  </footer>
</PageContainer>

<style>
  .decode-header { margin: var(--space-5) 0 var(--space-6); }
  h1 { font-family: var(--font-display); font-size: var(--heading-xl); margin: 0 0 var(--space-2); color: var(--ink-primary); }
  .lede { color: var(--ink-secondary); margin: 0; max-width: 50ch; }
  .insight-card { padding: var(--space-5); }
  .card-label { font-size: var(--text-xs); text-transform: uppercase; letter-spacing: 0.06em; color: var(--ink-muted); margin: 0 0 var(--space-2); }
  .pattern-card { background: var(--flow-teal-soft); border-color: color-mix(in srgb, var(--flow-teal) 25%, transparent); }
  .pattern-card h2 { margin: 0 0 var(--space-2); font-size: var(--heading-md); color: var(--ink-primary); }
  .confidence { font-size: var(--text-sm); color: var(--ink-secondary); margin: 0 0 var(--space-3); }
  .link { font-size: var(--text-sm); font-weight: 600; color: var(--brand-blue); text-decoration: none; }
  .insight-card ul { margin: 0; padding-left: var(--space-4); font-size: var(--text-sm); color: var(--ink-secondary); line-height: 1.5; }
  .challenge-row { display: flex; gap: var(--space-2); margin-top: var(--space-3); }
  .challenge-row input { min-width: 0; flex: 1; padding: var(--space-2); border: 1px solid var(--line-soft); border-radius: var(--radius-xs); }
  .scope-strip { margin-top: var(--space-6); padding: var(--space-4) var(--space-5); color: var(--ink-secondary); font-size: var(--text-sm); }
  .scope-strip p { margin: 0; }
</style>
