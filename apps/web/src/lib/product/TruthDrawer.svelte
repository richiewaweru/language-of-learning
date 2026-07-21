<script lang="ts">
  import type { TruthDetail } from '@lol/lens-scenes';

  let {
    detail,
    open = false,
    onClose,
    showTechnical = false,
    onToggleTechnical,
  }: {
    detail: TruthDetail | null;
    open?: boolean;
    onClose?: () => void;
    showTechnical?: boolean;
    onToggleTechnical?: (next: boolean) => void;
  } = $props();
</script>

{#if open && detail}
  <div class="backdrop" role="presentation" onclick={onClose}></div>
  <aside class="drawer" aria-label="Execution detail" data-testid="truth-drawer">
    <header class="drawer-header">
      <h2>Detail</h2>
      <button type="button" class="close" onclick={onClose} aria-label="Close detail">×</button>
    </header>
    <dl class="fields">
      <div><dt>What is this?</dt><dd>{detail.what}</dd></div>
      {#if detail.currentValue !== undefined}
        <div><dt>Current value</dt><dd>{detail.currentValue}</dd></div>
      {/if}
      {#if detail.origin}
        <div><dt>Where did it come from?</dt><dd>{detail.origin}</dd></div>
      {/if}
      {#if detail.changedBy}
        <div><dt>What changed it?</dt><dd>{detail.changedBy}</dd></div>
      {/if}
      {#if detail.destination}
        <div><dt>Where is it going?</dt><dd>{detail.destination}</dd></div>
      {/if}
      {#if detail.whyActive}
        <div><dt>Why is it active now?</dt><dd>{detail.whyActive}</dd></div>
      {/if}
    </dl>
    <button
      type="button"
      class="tech-toggle"
      aria-expanded={showTechnical}
      onclick={() => onToggleTechnical?.(!showTechnical)}
    >
      {showTechnical ? 'Hide' : 'Show'} technical evidence
    </button>
    {#if showTechnical}
      <dl class="fields technical">
        {#if detail.nodeId}<div><dt>Node ID</dt><dd>{detail.nodeId}</dd></div>{/if}
        {#if detail.line}<div><dt>Line</dt><dd>{detail.line}</dd></div>{/if}
        {#if detail.traceEvent}<div><dt>Trace event</dt><dd>{detail.traceEvent}</dd></div>{/if}
        {#if detail.sceneAction}<div><dt>Scene action</dt><dd>{detail.sceneAction}</dd></div>{/if}
        {#if detail.bindingSnapshot}
          <div><dt>Bindings</dt><dd><pre>{JSON.stringify(detail.bindingSnapshot, null, 2)}</pre></dd></div>
        {/if}
      </dl>
    {/if}
  </aside>
{/if}

<style>
  .backdrop {
    position: fixed;
    inset: 0;
    background: rgba(23, 25, 31, 0.25);
    z-index: 200;
  }

  .drawer {
    position: fixed;
    top: 0;
    right: 0;
    bottom: 0;
    width: min(400px, 100vw);
    background: var(--surface-paper);
    border-left: 1px solid var(--line-default);
    box-shadow: var(--shadow-lg);
    z-index: 201;
    overflow-y: auto;
    padding: var(--space-5);
  }

  @media (max-width: 767px) {
    .drawer {
      top: auto;
      left: 0;
      right: 0;
      width: 100%;
      max-height: 70vh;
      border-left: none;
      border-top: 1px solid var(--line-default);
      border-radius: var(--radius-lg) var(--radius-lg) 0 0;
    }
  }

  .drawer-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: var(--space-4);
  }

  .drawer-header h2 {
    margin: 0;
    font-size: var(--text-lg);
  }

  .close {
    background: none;
    border: none;
    font-size: 1.5rem;
    cursor: pointer;
    color: var(--ink-muted);
    line-height: 1;
  }

  .fields {
    margin: 0;
  }

  .fields div {
    margin-bottom: var(--space-4);
  }

  .fields dt {
    font: var(--eyebrow);
    letter-spacing: 0.1em;
    text-transform: uppercase;
    font-size: 10px;
    color: var(--ink-faint);
    margin-bottom: var(--space-1);
  }

  .fields dd {
    margin: 0;
    color: var(--ink-body);
    font-size: var(--text-sm);
  }

  .fields pre {
    font-size: var(--text-xs);
    overflow-x: auto;
    margin: 0;
  }

  .technical {
    margin-top: var(--space-4);
    padding-top: var(--space-4);
    border-top: 1px solid var(--line-soft);
  }

  .tech-toggle {
    background: none;
    border: 1px solid var(--line-default);
    border-radius: var(--radius-xs);
    padding: var(--space-2) var(--space-3);
    font-size: var(--text-xs);
    cursor: pointer;
    color: var(--ink-muted);
  }
</style>
