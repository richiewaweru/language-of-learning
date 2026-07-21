<script lang="ts">
  let { label = 'operation' }: { label?: string } = $props();
</script>
<span class="generic">{label}</span>
<style>
  .generic { display:inline-flex; padding:.3rem .5rem; border:1px solid var(--data-blue); border-radius:var(--radius-xs); color:var(--data-blue); font:600 12px var(--font-mono); }
</style>
