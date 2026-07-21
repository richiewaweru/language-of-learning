<script lang="ts">
  import LearningInstrument from '$lib/product/LearningInstrument.svelte';

  let { data } = $props();
</script>

<svelte:head>
  <title>Flagship demo — Language of Learning</title>
</svelte:head>

<div class="demo-page container-wide">
  <header class="demo-header">
    <h1>{data.pack.title}</h1>
    <p class="instruction">
      Step through the loop to see how each number updates the running total.
    </p>
  </header>
  <LearningInstrument pack={data.pack} showTruthDrawer={true} />
</div>

<style>
  .demo-page {
    padding: var(--space-6) var(--space-6) var(--space-10);
  }

  .demo-header {
    margin-bottom: var(--space-6);
  }

  .demo-header h1 {
    font-family: var(--font-display);
    font-size: var(--text-2xl);
    margin: 0 0 var(--space-3);
  }

  .instruction {
    color: var(--ink-muted);
    margin: 0;
    max-width: 55ch;
  }
</style>
