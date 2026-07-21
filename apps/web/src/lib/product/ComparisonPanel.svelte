<script lang="ts">
  let {
    currentPattern,
    neighborPattern,
    rows,
  }: {
    currentPattern: string;
    neighborPattern: string;
    rows: Array<{ label: string; current: string; neighbor: string }>;
  } = $props();
</script>

<section class="comparison" data-testid="comparison-panel">
  <h2>Compare: {currentPattern} vs {neighborPattern}</h2>
  <div class="grid">
    <div class="col">
      <p class="col-head">{currentPattern}</p>
      {#each rows as row}
        <div class="row">
          <span class="label">{row.label}</span>
          <span>{row.current}</span>
        </div>
      {/each}
    </div>
    <div class="col">
      <p class="col-head">{neighborPattern}</p>
      {#each rows as row}
        <div class="row">
          <span class="label">{row.label}</span>
          <span>{row.neighbor}</span>
        </div>
      {/each}
    </div>
  </div>
</section>

<style>
  .comparison {
    padding: var(--space-6);
    margin: var(--space-4) 0;
  }

  h2 {
    font-size: var(--text-lg);
    margin: 0 0 var(--space-4);
  }

  .grid {
    display: grid;
    gap: var(--space-4);
  }

  @media (min-width: 640px) {
    .grid {
      grid-template-columns: 1fr 1fr;
    }
  }

  .col {
    background: var(--surface-paper);
    border: var(--border-w) solid var(--line-default);
    border-radius: var(--radius-panel);
    padding: var(--space-4);
  }

  .col-head {
    font-weight: 700;
    margin: 0 0 var(--space-3);
    font-size: var(--text-md);
  }

  .row {
    display: flex;
    flex-direction: column;
    gap: var(--space-1);
    margin-bottom: var(--space-3);
    font-size: var(--text-sm);
  }

  .label {
    font: var(--eyebrow);
    letter-spacing: 0.08em;
    text-transform: uppercase;
    font-size: 10px;
    color: var(--ink-faint);
  }
</style>
