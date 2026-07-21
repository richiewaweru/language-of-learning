<script lang="ts">
  import type { SemanticGraph, Trace } from '@lol/lens-scenes';
  import type { Selection } from '@lol/lens-contracts';

  let {
    source,
    graph,
    trace,
    selection,
    onLineSelect,
    callArgs = '',
    filename = 'build_total.py',
  }: {
    source: string;
    graph: SemanticGraph;
    trace: Trace;
    selection: Selection;
    onLineSelect?: (line: number) => void;
    callArgs?: string;
    filename?: string;
  } = $props();

  const lines = $derived(source.split('\n'));
  const stepIndex = $derived(selection.stepIndex ?? 0);
  const activeLine = $derived(trace.steps[stepIndex]?.line);

  const displaySource = $derived(
    callArgs
      ? `${source}\n\nresult = calculate_total(${callArgs})`
      : source,
  );
  const displayLines = $derived(displaySource.split('\n'));
</script>

<div class="code-panel surface-card" data-testid="code-learning-panel">
  <div class="toolbar">
    <span class="lang-badge">Python</span>
    <span class="live-badge" aria-label="Live execution">Live</span>
  </div>
  <pre class="code" aria-label="Source code"><code>{#each displayLines as line, i}
{@const lineNum = i + 1}
{@const isActive = lineNum === activeLine && lineNum <= lines.length}
<span
  class="line"
  class:active={isActive}
  role="button"
  tabindex="0"
  aria-current={isActive ? 'step' : undefined}
  onclick={() => lineNum <= lines.length && onLineSelect?.(lineNum)}
  onkeydown={(e) => e.key === 'Enter' && lineNum <= lines.length && onLineSelect?.(lineNum)}
><span class="line-num">{lineNum}</span>{line || ' '}</span>
{/each}</code></pre>
  <div class="footer">
    <span>{filename}</span>
  </div>
</div>

<style>
  .code-panel {
    overflow: hidden;
    display: flex;
    flex-direction: column;
  }

  .toolbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: var(--space-3) var(--space-4);
    border-bottom: 1px solid var(--line-soft);
  }

  .lang-badge {
    font-size: var(--text-xs);
    font-weight: 500;
    color: var(--ink-secondary);
    background: var(--surface-soft);
    padding: var(--space-1) var(--space-3);
    border-radius: var(--radius-xs);
  }

  .live-badge {
    font-size: var(--text-xs);
    font-weight: 600;
    color: var(--exit-green);
    display: flex;
    align-items: center;
    gap: var(--space-2);
  }

  .live-badge::before {
    content: '';
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: var(--exit-green);
  }

  .code {
    margin: 0;
    padding: var(--space-4);
    font-family: var(--font-mono);
    font-size: 14px;
    line-height: 1.65;
    overflow-x: auto;
    flex: 1;
  }

  .code code {
    display: flex;
    flex-direction: column;
  }

  .line {
    display: block;
    padding: 2px var(--space-3);
    border-left: 3px solid transparent;
    cursor: pointer;
    white-space: pre;
    border-radius: 0 var(--radius-xs) var(--radius-xs) 0;
  }

  .line.active {
    background: var(--brand-blue-soft);
    border-left-color: var(--brand-blue);
  }

  .line-num {
    display: inline-block;
    width: 2.5ch;
    color: var(--ink-faint);
    user-select: none;
    margin-right: var(--space-3);
  }

  .footer {
    padding: var(--space-2) var(--space-4);
    border-top: 1px solid var(--line-soft);
    font-size: var(--text-xs);
    color: var(--ink-faint);
  }

  @media (min-width: 1024px) {
    .code-panel {
      min-height: 550px;
    }
  }
</style>
