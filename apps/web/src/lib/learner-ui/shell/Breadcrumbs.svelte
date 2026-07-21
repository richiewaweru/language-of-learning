<script lang="ts">
  let { items }: { items: Array<{ label: string; href?: string }> } = $props();
</script>

<nav class="breadcrumbs" aria-label="Breadcrumb">
  <ol>
    {#each items as item, i}
      <li>
        {#if item.href && i < items.length - 1}
          <a href={item.href}>{item.label}</a>
        {:else}
          <span aria-current="page">{item.label}</span>
        {/if}
      </li>
    {/each}
  </ol>
</nav>

<style>
  .breadcrumbs ol {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-2);
    list-style: none;
    margin: 0;
    padding: 0;
    font-size: var(--text-xs);
    color: var(--ink-muted);
  }

  .breadcrumbs li:not(:last-child)::after {
    content: '›';
    margin-left: var(--space-2);
    color: var(--ink-faint);
  }

  .breadcrumbs a {
    color: var(--ink-muted);
    text-decoration: none;
  }

  .breadcrumbs a:hover {
    color: var(--brand-blue);
  }

  .breadcrumbs span {
    color: var(--ink-secondary);
  }
</style>
