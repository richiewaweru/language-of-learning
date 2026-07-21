<script lang="ts">
  import type { Snippet } from 'svelte';

  let {
    wide = false,
    children,
  }: {
    wide?: boolean;
    children: Snippet;
  } = $props();
</script>

<div class="page-container" class:wide>
  {@render children()}
</div>

<style>
  .page-container {
    width: min(100% - var(--space-6), var(--content-standard));
    margin-inline: auto;
    padding: var(--space-6) 0 var(--space-8);
  }

  .page-container.wide {
    width: min(100% - var(--space-6), var(--content-wide));
  }
</style>
