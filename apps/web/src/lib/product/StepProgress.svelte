<script lang="ts">
  let {
    stepLabel,
    stepIndex,
    totalSteps,
  }: {
    stepLabel: string;
    stepIndex: number;
    totalSteps: number;
  } = $props();
</script>

<div class="step-progress" data-testid="step-progress">
  <span class="label">{stepLabel}</span>
  <span class="count">Step {stepIndex + 1} of {totalSteps}</span>
</div>

<style>
  .step-progress {
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    justify-content: space-between;
    gap: var(--space-2);
    padding: var(--space-3) 0;
  }

  .label {
    font-weight: 600;
    color: var(--ink-strong);
    font-size: var(--text-md);
  }

  .count {
    font-size: var(--text-sm);
    color: var(--ink-muted);
  }
</style>
