<script lang="ts">
  let { fields }: { fields: Array<{ key: string; value: string }> } = $props();
</script>

<section class="summary" data-testid="pattern-summary">
  <h2>Pattern summary</h2>
  <dl>
    {#each fields as field}
      <div>
        <dt>{field.key}</dt>
        <dd>{field.value}</dd>
      </div>
    {/each}
  </dl>
</section>

<style>
  .summary {
    padding: var(--space-6);
    background: var(--surface-paper);
    border: var(--border-w) solid var(--line-default);
    border-radius: var(--radius-panel);
    margin: var(--space-4) 0;
  }

  h2 {
    margin: 0 0 var(--space-4);
    font-size: var(--text-lg);
  }

  dl {
    margin: 0;
    display: grid;
    gap: var(--space-3);
  }

  dt {
    font: var(--eyebrow);
    letter-spacing: 0.1em;
    text-transform: uppercase;
    font-size: 10px;
    color: var(--ink-faint);
  }

  dd {
    margin: var(--space-1) 0 0;
    color: var(--ink-body);
    font-size: var(--text-sm);
  }
</style>
