<script lang="ts">
  import PageContainer from '$lib/learner-ui/shell/PageContainer.svelte';

  let { data } = $props();
</script>

<svelte:head>
  <title>Learn — Language of Learning</title>
</svelte:head>

<PageContainer>
  <p class="eyebrow">Learn</p>
  <h1 class="display-heading">Pathways</h1>
  <p class="lede">Structured visual lessons that build reusable programming patterns.</p>

  <ul class="pathway-list">
    {#each data.pathways as p}
      <li>
        <a href="/learn/{p.slug}" class="pathway-card surface-card">
          <h2>{p.title}</h2>
          <p>{p.summary}</p>
          <span class="cta">View pathway →</span>
        </a>
      </li>
    {/each}
  </ul>
</PageContainer>

<style>
  .lede {
    color: var(--ink-secondary);
    margin: var(--space-3) 0 var(--space-6);
    max-width: 50ch;
  }

  .pathway-list {
    list-style: none;
    padding: 0;
    margin: 0;
    display: grid;
    gap: var(--space-4);
  }

  .pathway-card {
    display: block;
    padding: var(--space-6);
    text-decoration: none;
    color: inherit;
    transition: box-shadow var(--motion-fast);
  }

  .pathway-card:hover {
    box-shadow: var(--shadow-md);
  }

  h2 {
    font-family: var(--font-display);
    margin: 0 0 var(--space-2);
    font-size: var(--heading-lg);
    color: var(--ink-primary);
  }

  .pathway-card p {
    margin: 0 0 var(--space-4);
    color: var(--ink-secondary);
    font-size: var(--text-sm);
    line-height: 1.5;
  }

  .cta {
    font-size: var(--text-sm);
    font-weight: 600;
    color: var(--brand-blue);
  }
</style>
