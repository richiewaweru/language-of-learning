<script lang="ts">
  import { page } from '$app/stores';
  import ProductHeader from '$lib/product/ProductHeader.svelte';
  import ProductFooter from '$lib/product/ProductFooter.svelte';

  /** Minimal chrome for debug routes */
  const minimalChrome = $derived($page.url.pathname.startsWith('/debug/'));
</script>

<div class="page-shell bg-grid">
  {#if !minimalChrome}
    <ProductHeader />
  {/if}
  <main class="page-main">
    <slot />
  </main>
  {#if !minimalChrome}
    <ProductFooter />
  {/if}
</div>
