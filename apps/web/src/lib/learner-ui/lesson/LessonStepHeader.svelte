<script lang="ts">
  import Breadcrumbs from '../shell/Breadcrumbs.svelte';

  let {
    breadcrumbs,
    title,
    subtitle = '',
    progressPercent = 0,
  }: {
    breadcrumbs: Array<{ label: string; href?: string }>;
    title: string;
    subtitle?: string;
    progressPercent?: number;
  } = $props();
</script>

<header class="lesson-header" data-testid="lesson-step-header">
  <Breadcrumbs items={breadcrumbs} />
  <div class="title-row">
    <div>
      <h1>{title}</h1>
      {#if subtitle}
        <p class="subtitle">{subtitle}</p>
      {/if}
    </div>
    <div class="progress-wrap">
      <div class="progress-bar" role="progressbar" aria-valuenow={progressPercent} aria-valuemin={0} aria-valuemax={100}>
        <div class="progress-fill" style="width: {progressPercent}%"></div>
      </div>
      <span class="progress-label">{progressPercent}%</span>
    </div>
  </div>
</header>

<style>
  .lesson-header {
    margin-bottom: var(--space-6);
  }

  .title-row {
    display: flex;
    flex-wrap: wrap;
    align-items: flex-start;
    justify-content: space-between;
    gap: var(--space-4);
    margin-top: var(--space-3);
  }

  h1 {
    font-family: var(--font-display);
    font-size: var(--heading-xl);
    font-weight: 600;
    color: var(--ink-primary);
    margin: 0 0 var(--space-2);
    line-height: 1.2;
  }

  .subtitle {
    margin: 0;
    font-size: var(--text-md);
    color: var(--ink-secondary);
    max-width: 55ch;
    line-height: 1.5;
  }

  .progress-wrap {
    display: flex;
    align-items: center;
    gap: var(--space-3);
    min-width: 140px;
  }

  .progress-bar {
    flex: 1;
    height: 6px;
    background: var(--line-soft);
    border-radius: var(--radius-pill);
    overflow: hidden;
  }

  .progress-fill {
    height: 100%;
    background: var(--state-gold);
    border-radius: var(--radius-pill);
    transition: width var(--motion-medium) var(--ease-standard);
  }

  .progress-label {
    font-size: var(--text-sm);
    font-weight: 600;
    color: var(--ink-secondary);
    white-space: nowrap;
  }
</style>
