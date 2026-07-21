<script lang="ts">
  import PageContainer from '$lib/learner-ui/shell/PageContainer.svelte';
</script>

<svelte:head>
  <title>Library — Language of Learning</title>
</svelte:head>

<PageContainer>
  <p class="eyebrow">Library</p>
  <h1 class="display-heading">Saved lessons & code</h1>
  <p class="lede">
    Your bookmarked pathways, decoded snippets, and in-progress lessons will appear here.
  </p>
  <div class="empty surface-card">
    <p>Nothing saved yet.</p>
    <a href="/decode" class="btn-primary">Decode your first snippet</a>
  </div>
</PageContainer>

<style>
  .lede {
    color: var(--ink-secondary);
    margin-bottom: var(--space-6);
    max-width: 50ch;
  }

  .empty {
    padding: var(--space-8);
    text-align: center;
  }

  .empty p {
    color: var(--ink-muted);
    margin: 0 0 var(--space-5);
  }
</style>
