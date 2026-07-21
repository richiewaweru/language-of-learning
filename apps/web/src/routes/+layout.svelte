<script lang="ts">
  import { page } from '$app/stores';
  import AppHeader from '$lib/learner-ui/shell/AppHeader.svelte';
  import ProductFooter from '$lib/product/ProductFooter.svelte';

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
    <slot />
  </main>
  {#if !minimalChrome}
    <ProductFooter />
  {/if}
</div>
