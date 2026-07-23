<script lang="ts">
  import type { SemanticGraph, Trace } from '@lol/lens-scenes';
  import { resolveSelection } from '@lol/lens-scenes';
  import type { Selection } from '@lol/lens-contracts';

  let {
    source,
    graph,
    trace,
    selection,
    onLineSelect,
    callExpression = '',
  }: {
    source: string;
    graph: SemanticGraph;
    trace: Trace;
    selection: Selection;
    onLineSelect?: (line: number) => void;
    callExpression?: string;
  } = $props();

  const lines = $derived(source.split('\n'));
  const stepIndex = $derived(selection.stepIndex ?? 0);
  const activeLine = $derived(trace.steps[stepIndex]?.line);

  const displaySource = $derived(
    callExpression ? `${source}\n\n# Sample call\n${callExpression}` : source,
  );
  const displayLines = $derived(displaySource.split('\n'));

  function handleLineClick(lineNum: number) {
    onLineSelect?.(lineNum);
  }
</script>

<div class="code-panel" data-testid="code-panel">
  <p class="label">Code</p>
  <pre class="code" aria-label="Source code"><code>{#each displayLines as line, i}
{@const lineNum = i + 1}
{@const isActive = lineNum === activeLine && lineNum <= lines.length}
<span
  class="line"
  class:active={isActive}
  role="button"
  tabindex="0"
  aria-current={isActive ? 'step' : undefined}
  onclick={() => lineNum <= lines.length && handleLineClick(lineNum)}
  onkeydown={(e) => e.key === 'Enter' && lineNum <= lines.length && handleLineClick(lineNum)}
><span class="line-marker" aria-hidden="true">{isActive ? '▸' : ' '}</span><span class="line-num">{lineNum}</span>{line || ' '}</span>
{/each}</code></pre>
</div>

<style>
  .code-panel {
    background: var(--surface-code);
    border: var(--border-w) solid var(--line-default);
    border-radius: var(--radius-panel);
    box-shadow: var(--shadow-sm);
    overflow: hidden;
  }

  .label {
    font: var(--eyebrow);
    letter-spacing: 0.12em;
    text-transform: uppercase;
    font-size: 11px;
    color: var(--ink-muted);
    margin: 0;
    padding: var(--space-3) var(--space-4);
    border-bottom: 1px solid var(--line-soft);
  }

  .code {
    margin: 0;
    padding: var(--space-4);
    font-family: var(--font-mono);
    font-size: var(--text-sm);
    line-height: 1.6;
    overflow-x: auto;
  }

  .line {
    display: block;
    padding: 0 var(--space-2);
    border-left: 3px solid transparent;
    cursor: pointer;
    white-space: pre;
  }

  .line.active {
    background: color-mix(in srgb, var(--ink-strong) 6%, transparent);
    border-left-color: var(--ink-strong);
    font-weight: 500;
  }

  .line-marker {
    display: inline-block;
    width: 1ch;
    color: var(--ink-strong);
  }

  .line-num {
    display: inline-block;
    width: 2.5ch;
    color: var(--ink-faint);
    user-select: none;
    margin-right: var(--space-3);
  }
</style>
