<script lang="ts">
  const patterns = [
    { slug: 'accumulate', label: 'Accumulate', tag: 'Foundation', question: 'How much total?' },
    { slug: 'count', label: 'Count', tag: 'Adds a condition', question: 'How many match?' },
    { slug: 'filter', label: 'Filter', tag: 'Builds a collection', question: 'Which ones?' },
    { slug: 'transform', label: 'Transform', tag: 'Changes every item', question: 'What changed value?' },
  ];
</script>

<section class="family-map" data-testid="pattern-family-map" aria-label="Loop pattern family">
  <div class="trunk">
    <span class="node">Input collection</span>
    <span class="arrow">↓</span>
    <span class="node">Repeated work</span>
    <span class="arrow">↓</span>
  </div>
  <div class="branches">
    {#each patterns as p}
      <a href="/learn/how-loops-build-results/{p.slug}" class="branch">
        <span class="tag">{p.tag}</span>
        <strong>{p.label}</strong>
        <span class="q">{p.question}</span>
      </a>
    {/each}
  </div>
</section>

<style>
  .family-map {
    padding: var(--space-6);
    background: var(--surface-paper);
    border: var(--border-w) solid var(--line-default);
    border-radius: var(--radius-panel);
    margin: var(--space-4) 0;
  }

  .trunk {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--space-2);
    margin-bottom: var(--space-6);
  }

  .node {
    padding: var(--space-2) var(--space-4);
    border: 1px solid var(--line-default);
    border-radius: var(--radius-sm);
    font-size: var(--text-sm);
    background: var(--surface-raised);
  }

  .arrow {
    color: var(--ink-faint);
  }

  .branches {
    display: grid;
    gap: var(--space-3);
  }

  @media (min-width: 640px) {
    .branches {
      grid-template-columns: repeat(2, 1fr);
    }
  }

  @media (min-width: 960px) {
    .branches {
      grid-template-columns: repeat(4, 1fr);
    }
  }

  .branch {
    display: flex;
    flex-direction: column;
    gap: var(--space-1);
    padding: var(--space-4);
    border: 1px solid var(--line-default);
    border-radius: var(--radius-sm);
    text-decoration: none;
    color: inherit;
    background: var(--surface-raised);
  }

  .branch:hover {
    border-color: var(--ink-strong);
  }

  .tag {
    font-size: var(--text-xs);
    color: var(--ink-faint);
  }

  .q {
    font-size: var(--text-xs);
    color: var(--ink-muted);
  }
</style>
