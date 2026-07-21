<script lang="ts">
  let {
    steps,
    activeStepIndex = 0,
    caption = '',
    tab = 'explain',
  }: {
    steps: string[];
    activeStepIndex?: number;
    caption?: string;
    tab?: 'explain' | 'key' | 'notes';
  } = $props();

  let activeTab = $state(tab);
</script>

<div class="explanation-sidebar surface-card" data-testid="explanation-sidebar">
  <div class="tabs" role="tablist">
    {#each ['explain', 'key', 'notes'] as t}
      <button
        type="button"
        role="tab"
        class:active={activeTab === t}
        onclick={() => (activeTab = t as typeof activeTab)}
      >
        {t === 'explain' ? 'Explain' : t === 'key' ? 'Key idea' : 'Notes'}
      </button>
    {/each}
  </div>

  {#if activeTab === 'explain'}
    <ol class="steps">
      {#each steps as step, i}
        <li class:active={i === activeStepIndex} class:current={i === activeStepIndex}>
          <span class="n">{i + 1}</span>
          <span class="text">{step}</span>
          {#if i === activeStepIndex}
            <span class="here">You are here</span>
          {/if}
        </li>
      {/each}
    </ol>
    {#if caption}
      <p class="caption">{caption}</p>
    {/if}
  {:else if activeTab === 'key'}
    <p class="key-idea">
      A loop can walk a collection and update one remembered value each time — that is the
      <strong>Accumulate</strong> pattern.
    </p>
  {:else}
    <p class="notes-placeholder">Your notes will appear here.</p>
  {/if}
</div>

<style>
  .explanation-sidebar {
    display: flex;
    flex-direction: column;
    height: 100%;
  }

  .tabs {
    display: flex;
    border-bottom: 1px solid var(--line-soft);
  }

  .tabs button {
    flex: 1;
    padding: var(--space-3);
    border: none;
    background: transparent;
    font-size: var(--text-sm);
    color: var(--ink-muted);
    cursor: pointer;
  }

  .tabs button.active {
    color: var(--brand-blue);
    font-weight: 600;
    box-shadow: inset 0 -2px 0 var(--brand-blue);
  }

  .steps {
    list-style: none;
    margin: 0;
    padding: var(--space-4);
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
  }

  .steps li {
    display: grid;
    grid-template-columns: auto 1fr;
    gap: var(--space-2) var(--space-3);
    padding: var(--space-3);
    border-radius: var(--radius-sm);
    font-size: var(--text-sm);
    color: var(--ink-secondary);
    align-items: start;
  }

  .steps li.active {
    background: var(--flow-teal-soft);
    color: var(--ink-primary);
    font-weight: 500;
  }

  .n {
    font-weight: 600;
    color: var(--ink-muted);
  }

  .here {
    grid-column: 2;
    font-size: var(--text-xs);
    color: var(--flow-teal);
    font-weight: 600;
  }

  .caption {
    margin: 0 var(--space-4) var(--space-4);
    padding: var(--space-3);
    background: var(--surface-soft);
    border-radius: var(--radius-sm);
    font-size: var(--text-sm);
    color: var(--ink-secondary);
    line-height: 1.5;
  }

  .key-idea,
  .notes-placeholder {
    padding: var(--space-5);
    font-size: var(--text-sm);
    line-height: 1.6;
    color: var(--ink-secondary);
    margin: 0;
  }
</style>
