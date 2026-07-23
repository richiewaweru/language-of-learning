<script lang="ts">
  import type { SemanticScene } from '@lol/lens-contracts';
  import { SymbolBadge } from '@lol/visual-grammar';
  import { semanticEventHeadline } from '../projection/deriveSemanticProjections';

  let {
    semanticScene,
    source,
    stepIndex,
  }: {
    semanticScene: SemanticScene;
    source: string;
    stepIndex: number;
  } = $props();

  const step = $derived(semanticScene.steps[stepIndex] ?? semanticScene.steps[0]);
  const range = $derived(step?.activeSourceRange);
  const sourceLines = $derived(source.split('\n'));
  const activeLine = $derived(range ? sourceLines[range.startLine - 1] ?? '' : '');
  const before = $derived(range ? activeLine.slice(0, range.startColumn) : '');
  const selected = $derived(
    range && range.startLine === range.endLine
      ? activeLine.slice(range.startColumn, Math.max(range.endColumn, range.startColumn + 1))
      : activeLine,
  );
  const after = $derived(
    range && range.startLine === range.endLine ? activeLine.slice(range.endColumn) : '',
  );
  const facts = $derived(
    step
      ? Object.entries(step.activeEvent.payload).filter(
          ([, value]) =>
            typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean',
        )
      : [],
  );
  const recent = $derived(semanticScene.steps.slice(Math.max(0, stepIndex - 3), stepIndex));
</script>

{#if step}
  <article class="guided-trace" data-testid="guided-trace-view">
    <header>
      <div>
        <p class="eyebrow">Guided Trace</p>
        <h3>{semanticEventHeadline(step, semanticScene.steps.length)}</h3>
      </div>
      <SymbolBadge
        semantic={step.activeEvent.type}
        label={step.activeEvent.type}
        state={step.activeEvent.type === 'unsupported' ? 'unsupported' : 'active'}
        behaviorVerified={step.activeEvent.confidence !== 'unsupported'}
      />
    </header>

    <section
      class="source-evidence"
      aria-label="Active source range"
      data-testid={range ? `active-source-line-${range.startLine}` : undefined}
    >
      <div class="line-label">
        Line {range?.startLine ?? '—'}
        {#if range} · columns {range.startColumn + 1}–{range.endColumn}{/if}
      </div>
      <pre><code><span>{before}</span><mark>{selected || activeLine || 'Source range unavailable'}</mark><span>{after}</span></code></pre>
    </section>

    <section class="event-breakdown">
      <h4>What happened</h4>
      {#if facts.length}
        <dl>
          {#each facts as [key, value]}
            <div><dt>{key.replaceAll(/([A-Z])/g, ' $1')}</dt><dd><code>{String(value)}</code></dd></div>
          {/each}
        </dl>
      {:else}
        <p>The engine recorded this {step.activeEvent.type} event without additional scalar values.</p>
      {/if}
      <p class="confidence">Evidence: {step.activeEvent.confidence}</p>
    </section>

    <section class="recent-events">
      <h4>Recent events</h4>
      {#if recent.length}
        <ol>
          {#each recent as recentStep}
            <li><span>Step {recentStep.index + 1}</span><SymbolBadge semantic={recentStep.activeEvent.type} label={recentStep.activeEvent.type} /></li>
          {/each}
        </ol>
      {:else}
        <p>No earlier events.</p>
      {/if}
    </section>
  </article>
{/if}

<style>
  .guided-trace { padding:var(--space-4); display:grid; gap:var(--space-4); min-width:0; }
  header { display:flex; justify-content:space-between; gap:var(--space-3); align-items:flex-start; }
  .eyebrow { margin:0 0 .2rem; color:var(--brand-blue); font-size:var(--text-xs); font-weight:700; text-transform:uppercase; letter-spacing:.08em; }
  h3,h4 { margin:0; }
  h3 { font-size:var(--text-lg); }
  h4 { font-size:var(--text-sm); }
  .source-evidence,.event-breakdown,.recent-events { border:1px solid var(--line-soft); border-radius:var(--radius-sm); padding:var(--space-3); min-width:0; }
  .line-label { color:var(--ink-muted); font-size:var(--text-xs); margin-bottom:.45rem; }
  pre { margin:0; max-width:100%; overflow:hidden; padding:var(--space-3); background:var(--surface-soft); border-radius:var(--radius-xs); white-space:pre-wrap; overflow-wrap:anywhere; }
  code { font-family:var(--font-mono); }
  mark { background:var(--brand-blue-soft); color:inherit; border-bottom:2px solid var(--brand-blue); }
  dl { margin:.7rem 0 0; display:grid; gap:.4rem; }
  dl div { display:grid; grid-template-columns:minmax(95px,.5fr) 1fr; gap:var(--space-3); }
  dt { color:var(--ink-muted); text-transform:capitalize; }
  dd { margin:0; overflow-wrap:anywhere; }
  .confidence { margin:.7rem 0 0; color:var(--ink-faint); font-size:var(--text-xs); text-transform:capitalize; }
  ol { list-style:none; margin:.7rem 0 0; padding:0; display:grid; gap:.35rem; }
  li { display:flex; justify-content:space-between; align-items:center; gap:var(--space-3); font-size:var(--text-xs); }
  .recent-events p,.event-breakdown p { color:var(--ink-muted); font-size:var(--text-xs); }
  @media(max-width:560px) { header { flex-direction:column; } dl div { grid-template-columns:1fr; gap:.1rem; } }
</style>
