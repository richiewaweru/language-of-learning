<script lang="ts">
  import type { FlowProjection } from '../projection/deriveSemanticProjections';
  import { SymbolBadge } from '@lol/visual-grammar';

  let {
    projection,
    technicalMode = false,
  }: {
    projection: FlowProjection;
    technicalMode?: boolean;
  } = $props();
</script>

<div class="learner-flow" data-testid="learner-flow-view" data-event={projection.eventType}>
  <section class="collection-zone" aria-label={projection.collection.label}>
    <SymbolBadge semantic="collection" label={projection.collection.label} />
    <div class="collection-strip">
      {#each projection.collection.items as item, index}
        <span
          class:selected={projection.cursor.active && projection.cursor.index === index}
          data-testid={projection.cursor.index === index ? 'selected-collection-cell' : undefined}
        >{item}</span>
      {:else}
        <span class="placeholder">—</span>
      {/each}
    </div>
    {#if projection.cursor.active && projection.cursor.index !== undefined}
      <div class="origin-link" aria-label="Current item comes from the selected collection cell">
        <span>selected cell</span><span aria-hidden="true">↘</span>
      </div>
    {/if}
  </section>

  <div class="flow-arrow" aria-hidden="true">→</div>

  <section class="work-zone" class:active={projection.work.active}>
    <div class="cursor-token" class:active={projection.cursor.active} data-testid="current-item-token">
      <SymbolBadge
        semantic="cursor"
        label={projection.cursor.label}
        state={projection.cursor.active ? 'selected' : 'idle'}
      />
      <strong
        data-testid="current-item-value"
        aria-label={'Current item ' + (projection.cursor.value ?? 'unavailable')}
      >{projection.cursor.value ?? '—'}</strong>
    </div>
    <div class="loop-frame">
      <SymbolBadge semantic="loop" label="Loop body" state={projection.work.active ? 'active' : 'idle'} />
      <code>{projection.work.expression}</code>
      <span class="repeat-route" aria-label="Repeat with the next item">↻</span>
    </div>
  </section>

  <div class="flow-arrow" aria-hidden="true">→</div>

  <section class="state-zone" class:changing={projection.state.changing} data-testid="flow-state">
    <SymbolBadge
      semantic="state"
      label={projection.state.label}
      state={projection.state.changing ? 'changing' : 'idle'}
    />
    {#if projection.state.changing && projection.state.previousValue !== undefined}
      <span class="old-value" data-testid="previous-state-value">{projection.state.previousValue}</span>
      <span aria-hidden="true">→</span>
    {/if}
    <strong
      data-testid="current-state-value"
      aria-label={projection.state.label + ' current value ' + (projection.state.value ?? 'unavailable')}
    >{projection.state.value ?? '—'}</strong>
  </section>

  <div class="flow-arrow" aria-hidden="true">→</div>

  <section
    class="result-zone"
    class:visible={projection.result.visible}
    data-testid="flow-result"
    aria-label={projection.result.visible ? 'Returned result ' + projection.result.value : 'Result not returned yet'}
  >
    <SymbolBadge semantic="return" label="Result port" state={projection.result.active ? 'completed' : 'idle'} />
    <strong>{projection.result.visible ? projection.result.value : 'Waiting for return'}</strong>
  </section>

  {#if technicalMode}
    <p class="tech-note">Complete graph evidence is available in Graph Inspector.</p>
  {/if}
</div>

<style>
  .learner-flow {
    display: grid;
    grid-template-columns: minmax(120px, 1.2fr) auto minmax(120px, 1fr) auto minmax(96px, .8fr) auto minmax(105px, .85fr);
    align-items: center;
    gap: clamp(5px, .7vw, 12px);
    min-height: 330px;
    padding: var(--space-6) var(--space-4);
    overflow: hidden;
  }
  section { min-width: 0; }
  .collection-zone, .work-zone, .state-zone, .result-zone {
    display: grid;
    justify-items: center;
    gap: var(--space-3);
    padding: var(--space-3);
    border: 1px solid var(--line-soft);
    border-radius: var(--radius-sm);
    background: var(--surface-primary);
    transition: opacity var(--motion-fast), border-color var(--motion-fast), transform var(--motion-fast);
  }
  .collection-strip { display:flex; max-width:100%; }
  .collection-strip span {
    min-width: 28px;
    padding: 6px 4px;
    text-align:center;
    border:1px solid var(--line-medium);
    font-family:var(--font-mono);
    font-size:var(--text-sm);
  }
  .collection-strip span + span { border-left:0; }
  .collection-strip span.selected {
    position:relative;
    z-index:1;
    border:2px solid var(--state-gold);
    background:color-mix(in srgb,var(--state-gold) 12%,var(--surface-primary));
    transform:translateY(-3px);
  }
  .origin-link { display:flex; gap:.35rem; color:var(--state-gold); font-size:10px; }
  .work-zone { border-color:color-mix(in srgb,var(--flow-teal) 45%,var(--line-soft)); }
  .work-zone.active { box-shadow:0 0 0 3px var(--flow-teal-soft); }
  .cursor-token { display:flex; align-items:center; gap:.4rem; opacity:.45; transform:translateX(-8px); }
  .cursor-token.active { opacity:1; transform:translateX(0); }
  .cursor-token strong { color:var(--state-gold); font-family:var(--font-mono); }
  .loop-frame { display:grid; justify-items:center; gap:.55rem; }
  .loop-frame code { color:var(--work-purple); font:500 11px var(--font-mono); white-space:normal; text-align:center; }
  .repeat-route { color:var(--flow-teal); font-size:24px; line-height:1; }
  .state-zone { border-color:color-mix(in srgb,var(--state-gold) 58%,var(--line-soft)); }
  .state-zone.changing { box-shadow:0 0 0 3px color-mix(in srgb,var(--state-gold) 16%,transparent); }
  .state-zone strong, .result-zone strong { font:600 var(--text-lg) var(--font-mono); }
  .old-value { opacity:.5; text-decoration:line-through; font-family:var(--font-mono); }
  .result-zone { border-style:dashed; opacity:.42; }
  .result-zone.visible { opacity:1; border-color:var(--exit-green); transform:translateX(0); }
  .result-zone strong { font-size:var(--text-sm); text-align:center; }
  .flow-arrow { color:var(--flow-teal); font-size:var(--heading-md); }
  .tech-note { grid-column:1/-1; color:var(--ink-faint); font-size:var(--text-xs); }
  @media (prefers-reduced-motion: reduce) {
    .collection-zone, .work-zone, .state-zone, .result-zone, .cursor-token { transition:none; }
  }
  @media (max-width: 720px) {
    .learner-flow { grid-template-columns:1fr; padding:var(--space-4); overflow:visible; }
    .collection-zone,.work-zone,.state-zone,.result-zone { width:min(100%,300px); justify-self:center; box-sizing:border-box; }
    .flow-arrow { transform:rotate(90deg); justify-self:center; }
  }
</style>
