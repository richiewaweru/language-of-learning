<script lang="ts">
  let { before = 'old', after = 'new', active = false }: { before?: string; after?: string; active?: boolean } = $props();
</script>
<span class="mutation" class:active aria-label={'change ' + before + ' to ' + after}>{before} → {after}</span>
<style>
  .mutation { display:inline-flex; padding:.3rem .5rem; border:2px solid var(--work-purple); border-radius:var(--radius-xs); color:var(--work-purple); font:600 12px var(--font-mono); }
  .mutation.active { background:color-mix(in srgb,var(--work-purple) 10%,transparent); }
</style>
