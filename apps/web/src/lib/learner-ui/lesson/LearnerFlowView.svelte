<script lang="ts">
  import type { LearnerFlowStep } from '../projection/deriveLearnerProjection';

  let {
    steps,
    technicalMode = false,
  }: {
    steps: LearnerFlowStep[];
    technicalMode?: boolean;
  } = $props();
</script>

<div class="learner-flow" data-testid="learner-flow-view">
  {#each steps as step, i}
    {#if step.value || step.kind === 'work'}
      <div class="flow-step" class:active={step.active} data-kind={step.kind}>
        <p class="step-label">{step.label}</p>
        <p class="step-value">{step.value || '—'}</p>
      </div>
      {#if i < steps.length - 1 && steps[i + 1]?.value}
        <div class="arrow" aria-hidden="true">↓</div>
      {/if}
    {/if}
  {/each}
  {#if technicalMode}
    <p class="tech-note">Technical graph available in advanced view.</p>
  {/if}
</div>

<style>
  .learner-flow {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--space-2);
    padding: var(--space-6);
    min-height: 280px;
    justify-content: center;
  }

  .flow-step {
    width: 100%;
    max-width: 280px;
    padding: var(--space-4) var(--space-5);
    border-radius: var(--radius-md);
    border: 1px solid var(--line-soft);
    background: var(--surface-primary);
    text-align: center;
    transition: border-color var(--motion-fast), box-shadow var(--motion-fast);
  }

  .flow-step.active {
    border-color: var(--flow-teal);
    box-shadow: 0 0 0 3px var(--flow-teal-soft);
  }

  .flow-step[data-kind='input'] { border-left: 3px solid var(--data-blue); }
  .flow-step[data-kind='current'] { border-left: 3px solid var(--flow-teal); }
  .flow-step[data-kind='work'] { border-left: 3px solid var(--work-purple); }
  .flow-step[data-kind='state'] { border-left: 3px solid var(--state-gold); }
  .flow-step[data-kind='return'] {
    border-left: 3px solid var(--exit-green);
    border-style: dashed;
  }

  .step-label {
    margin: 0 0 var(--space-1);
    font-size: var(--text-xs);
    color: var(--ink-muted);
    text-transform: uppercase;
    letter-spacing: 0.06em;
  }

  .step-value {
    margin: 0;
    font-family: var(--font-mono);
    font-size: var(--text-lg);
    font-weight: 500;
    color: var(--ink-primary);
  }

  .arrow {
    color: var(--flow-teal);
    font-size: var(--text-lg);
    line-height: 1;
  }

  .tech-note {
    margin-top: var(--space-4);
    font-size: var(--text-xs);
    color: var(--ink-faint);
  }
</style>
