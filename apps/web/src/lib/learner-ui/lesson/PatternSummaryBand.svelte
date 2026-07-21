<script lang="ts">
  let {
    pattern = 'Accumulate',
    description = '',
    whenToUse = '',
    examples = [] as string[],
    related = [] as string[],
  }: {
    pattern?: string;
    description?: string;
    whenToUse?: string;
    examples?: string[];
    related?: string[];
  } = $props();
</script>

<section class="pattern-summary" data-testid="pattern-summary-band">
  <div class="icon" aria-hidden="true">◎</div>
  <div class="content">
    <h2>Pattern: {pattern}</h2>
    {#if description}
      <p class="desc">{description}</p>
    {/if}
    {#if whenToUse}
      <p class="when"><strong>When to use it:</strong> {whenToUse}</p>
    {/if}
    {#if examples.length}
      <div class="tags">
        <span class="tags-label">Common in real life</span>
        {#each examples as ex}
          <span class="pill-tag tag">{ex}</span>
        {/each}
      </div>
    {/if}
    {#if related.length}
      <p class="related">
        <strong>Related patterns:</strong>
        {#each related as r, i}
          {r}{#if i < related.length - 1}, {/if}
        {/each}
      </p>
    {/if}
  </div>
</section>

<style>
  .pattern-summary {
    display: flex;
    gap: var(--space-5);
    padding: var(--space-6);
    background: var(--state-gold-soft);
    border-radius: var(--radius-md);
    border: 1px solid color-mix(in srgb, var(--state-gold) 25%, transparent);
    margin-top: var(--space-6);
  }

  .icon {
    width: 48px;
    height: 48px;
    border-radius: 50%;
    background: var(--state-gold);
    color: white;
    display: grid;
    place-items: center;
    font-size: 20px;
    flex-shrink: 0;
  }

  h2 {
    margin: 0 0 var(--space-2);
    font-family: var(--font-display);
    font-size: var(--heading-md);
    color: var(--ink-primary);
  }

  .desc,
  .when,
  .related {
    margin: 0 0 var(--space-2);
    font-size: var(--text-sm);
    color: var(--ink-secondary);
    line-height: 1.55;
    max-width: 70ch;
  }

  .tags {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--space-2);
    margin-top: var(--space-3);
  }

  .tags-label {
    font-size: var(--text-xs);
    color: var(--ink-muted);
    margin-right: var(--space-2);
  }

  .tag {
    background: var(--surface-primary);
    color: var(--flow-teal);
    border: 1px solid color-mix(in srgb, var(--flow-teal) 30%, transparent);
  }
</style>
