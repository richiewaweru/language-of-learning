<script lang="ts">
  let { start = '0', end = 'n', active = false }: { start?: string; end?: string; active?: boolean } = $props();
</script>
<span class="range" class:active aria-label={'active range ' + start + ' to ' + end}>[{start} … {end}]</span>
<style>
  .range { display:inline-flex; padding:.25rem .45rem; border-block:2px solid var(--state-gold); color:var(--state-gold); font:600 12px var(--font-mono); }
  .range.active { background:color-mix(in srgb,var(--state-gold) 10%,transparent); }
</style>
