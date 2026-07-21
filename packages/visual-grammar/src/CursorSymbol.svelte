<script lang="ts">
  let { label = 'cursor', active = false }: { label?: string; active?: boolean } = $props();
</script>
<span class="cursor" class:active aria-label={label}><span aria-hidden="true">▼</span>{label}</span>
<style>
  .cursor { display:inline-flex; gap:.3rem; color:var(--state-gold); font:600 12px var(--font-mono); }
  .cursor.active { filter:drop-shadow(0 0 4px color-mix(in srgb,var(--state-gold) 55%,transparent)); }
</style>
