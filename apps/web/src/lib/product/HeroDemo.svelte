<script lang="ts">
  import type { DemoPack } from './loadDemoPack';
  import LearningInstrument from './LearningInstrument.svelte';

  let { pack }: { pack: DemoPack } = $props();
</script>

<div class="hero-demo" data-testid="hero-demo">
  <LearningInstrument {pack} compact showTruthDrawer={false} />
</div>

<style>
  .hero-demo {
    width: 100%;
  }
</style>
