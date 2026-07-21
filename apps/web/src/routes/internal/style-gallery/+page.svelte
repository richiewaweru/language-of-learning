<script lang="ts">
  import PageContainer from '$lib/learner-ui/shell/PageContainer.svelte';
</script>

<svelte:head>
  <title>Style gallery — internal</title>
  <meta name="robots" content="noindex" />
</svelte:head>

<PageContainer wide>
  <p class="eyebrow">UI-0 gate</p>
  <h1 class="display-heading">Learner UI style gallery</h1>

  <section class="section">
    <h2>Typography</h2>
    <p class="display-sample">Display — Source Serif 4</p>
    <p class="body-sample">Body — Inter at 15px for interface copy.</p>
    <code class="mono-sample">JetBrains Mono — calculate_total([3, 5, 2])</code>
  </section>

  <section class="section">
    <h2>Colors</h2>
    <div class="swatches">
      <div class="swatch" style="background: var(--page-bg)">page-bg</div>
      <div class="swatch" style="background: var(--brand-blue); color: white">brand-blue</div>
      <div class="swatch" style="background: var(--flow-teal); color: white">flow-teal</div>
      <div class="swatch" style="background: var(--state-gold); color: white">state-gold</div>
      <div class="swatch" style="background: var(--work-purple); color: white">structure-purple</div>
    </div>
  </section>

  <section class="section">
    <h2>Buttons</h2>
    <div class="row">
      <button type="button" class="btn-primary">Primary action</button>
      <button type="button" class="btn-secondary">Secondary</button>
    </div>
  </section>

  <section class="section">
    <h2>Cards & tags</h2>
    <div class="surface-card card-demo">
      <p>Surface card with soft shadow and 16px radius.</p>
      <span class="pill-tag">Beginner</span>
      <span class="pill-tag" style="background: var(--flow-teal-soft); color: var(--flow-teal)">Loop</span>
    </div>
  </section>

  <section class="section">
    <h2>Progress</h2>
    <div class="progress-demo">
      <div class="bar"><div class="fill" style="width: 65%"></div></div>
      <span>65%</span>
    </div>
  </section>
</PageContainer>

<style>
  .section {
    margin: var(--space-7) 0;
  }

  .section h2 {
    font-family: var(--font-display);
    font-size: var(--heading-md);
    margin: 0 0 var(--space-4);
  }

  .display-sample {
    font-family: var(--font-display);
    font-size: var(--display-lg);
    margin: 0 0 var(--space-3);
    color: var(--ink-primary);
  }

  .body-sample {
    font-size: var(--text-md);
    color: var(--ink-secondary);
    margin: 0 0 var(--space-3);
  }

  .mono-sample {
    font-family: var(--font-mono);
    font-size: var(--text-sm);
    background: var(--surface-soft);
    padding: var(--space-2) var(--space-3);
    border-radius: var(--radius-xs);
    display: inline-block;
  }

  .swatches {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-3);
  }

  .swatch {
    width: 120px;
    height: 64px;
    border-radius: var(--radius-sm);
    display: grid;
    place-items: center;
    font-size: var(--text-xs);
    border: 1px solid var(--line-soft);
  }

  .row {
    display: flex;
    gap: var(--space-3);
    flex-wrap: wrap;
  }

  .card-demo {
    padding: var(--space-5);
    max-width: 400px;
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
  }

  .progress-demo {
    display: flex;
    align-items: center;
    gap: var(--space-3);
    max-width: 280px;
  }

  .bar {
    flex: 1;
    height: 6px;
    background: var(--line-soft);
    border-radius: var(--radius-pill);
    overflow: hidden;
  }

  .fill {
    height: 100%;
    background: var(--state-gold);
  }
</style>
