<script lang="ts">
  let { operator = '≶', active = false }: { operator?: string; active?: boolean } = $props();
</script>
<span class="comparison" class:active aria-label={'comparison ' + operator}>{operator}</span>
<style>
  .comparison { display:inline-grid; place-items:center; min-width:2rem; padding:.25rem; border:2px solid var(--branch-magenta); color:var(--branch-magenta); clip-path:polygon(8% 0,100% 0,92% 100%,0 100%); }
  .comparison.active { background:color-mix(in srgb,var(--branch-magenta) 10%,transparent); }
</style>
