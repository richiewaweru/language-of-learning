<script lang="ts">
  import '../app.css';
  import { page } from '$app/stores';
  import AppHeader from '$lib/learner-ui/shell/AppHeader.svelte';
  import ProductFooter from '$lib/product/ProductFooter.svelte';

  let { children } = $props();

  const minimalChrome = $derived(
    $page.url.pathname.startsWith('/debug/') ||
      $page.url.pathname.startsWith('/internal/debug/') ||
      $page.url.pathname.startsWith('/slices/'),
  );
</script>

<div class="page-shell">
  {#if !minimalChrome}
    <AppHeader />
  {/if}
  <main class="page-main">
    {@render children()}
  </main>
  {#if !minimalChrome}
    <ProductFooter />
  {/if}
</div>
