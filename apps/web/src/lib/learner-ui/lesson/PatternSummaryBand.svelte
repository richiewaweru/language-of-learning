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
    <div class="summary-copy">
      <h2>Pattern: {pattern}</h2>
      {#if description}<p class="desc">{description}</p>{/if}
    </div>
    <div class="when-block">
      <span class="mini-label">When to use it</span>
      {#if whenToUse}<p class="when">{whenToUse}</p>{/if}
    </div>
    {#if examples.length}
      <div class="tags">
        <span class="mini-label">Common in real life</span>
        <div class="tag-list">
          {#each examples as ex}<span class="pill-tag tag">{ex}</span>{/each}
        </div>
      </div>
    {/if}
    {#if related.length}
      <div class="related-block">
        <span class="mini-label">Related patterns</span>
        <p class="related">
          {#each related as r, i}{r}{#if i < related.length - 1}, {/if}{/each}
        </p>
      </div>
    {/if}
  </div>
</section>

<style>
  .pattern-summary {
    display: flex;
    gap: var(--space-5);
    padding: var(--space-4) var(--space-5);
    background: var(--state-gold-soft);
    border-radius: var(--radius-md);
    border: 1px solid color-mix(in srgb, var(--state-gold) 25%, transparent);
    margin-top: var(--space-2);
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

  .content {
    display: grid;
    grid-template-columns: 1.25fr .9fr 1.55fr .75fr;
    gap: var(--space-5);
    align-items: center;
    width: 100%;
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
    display: grid;
    gap: var(--space-2);
  }

  .mini-label {
    font-size: var(--text-xs);
    color: var(--ink-muted);
    font-weight: 600;
  }

  .tag-list {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-2);
  }

  .tag {
    background: var(--surface-primary);
    color: var(--flow-teal);
    border: 1px solid color-mix(in srgb, var(--flow-teal) 30%, transparent);
  }

  .when,
  .related {
    margin-top: var(--space-2);
  }

  @media (max-width: 900px) {
    .content {
      grid-template-columns: 1fr;
      gap: var(--space-3);
    }

    .pattern-summary { align-items: flex-start; }
  }
</style>
