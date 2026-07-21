<script lang="ts">
  import type { LearnerFlowStep } from '../projection/deriveLearnerProjection';

  let {
    steps,
    technicalMode = false,
  }: {
    steps: LearnerFlowStep[];
    technicalMode?: boolean;
  } = $props();

  const input = $derived(steps.find((step) => step.kind === 'input'));
  const current = $derived(steps.find((step) => step.kind === 'current'));
  const work = $derived(steps.find((step) => step.kind === 'work'));
  const state = $derived(steps.find((step) => step.kind === 'state'));
  const returned = $derived(steps.find((step) => step.kind === 'return'));
  const inputItems = $derived(
    (input?.value ?? '')
      .replace(/^\[|\]$/g, '')
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean),
  );
</script>

<div class="learner-flow" data-testid="learner-flow-view">
  <div class="flow-step collection" class:active={input?.active} data-kind="input">
    <p class="step-label">{input?.label ?? 'Input collection'}</p>
    <div class="collection-strip">
      {#each inputItems as item}
        <span>{item}</span>
      {:else}
        <span class="placeholder">—</span>
      {/each}
    </div>
  </div>

  <div class="arrow" aria-hidden="true">→</div>

  <div class="process-group">
    <div class="current-card" class:active={current?.active}>
      <p class="step-label">{current?.label ?? 'Current item'}</p>
      <p class="current-value">{current?.value || '—'}</p>
    </div>
    <div class="loop-cycle" class:active={work?.active}>
      <span class="cycle-arrow" aria-hidden="true">↻</span>
      <span>Loop<br />body</span>
    </div>
    <p class="operation">{work?.value || 'Combine values'}</p>
  </div>

  <div class="arrow" aria-hidden="true">→</div>

  <div class="flow-step state-card" class:active={state?.active} data-kind="state">
    <p class="step-label">{state?.label ?? 'Running total'}</p>
    <p class="step-value">{state?.value || '—'}</p>
  </div>

  <div class="arrow" aria-hidden="true">→</div>

  <div class="flow-step return-card" class:active={returned?.active} data-kind="return">
    <p class="step-label">{returned?.label ?? 'Returned result'}</p>
    <p class="step-value">{returned?.value || '—'}</p>
    <span class="result-note">Final total</span>
  </div>

  <div class="loop-route" aria-hidden="true">
    <span>Take next item, add it in, repeat.</span>
  </div>

  {#if technicalMode}
    <p class="tech-note">Technical graph available in advanced view.</p>
  {/if}
</div>

<style>
  .learner-flow {
    display: grid;
    grid-template-columns: minmax(104px, 1.25fr) auto minmax(94px, .92fr) auto minmax(82px, .76fr) auto minmax(86px, .8fr);
    align-items: center;
    gap: clamp(4px, .65vw, 10px);
    padding: var(--space-7) var(--space-3) var(--space-8);
    min-height: 330px;
    justify-content: center;
    position: relative;
  }

  .flow-step {
    min-width: 0;
    padding: var(--space-3);
    border-radius: var(--radius-sm);
    border: 1px solid var(--line-soft);
    background: var(--surface-primary);
    text-align: center;
    transition: border-color var(--motion-fast), box-shadow var(--motion-fast);
  }

  .flow-step.active {
    border-color: var(--flow-teal);
    box-shadow: 0 0 0 3px var(--flow-teal-soft);
  }

  .flow-step[data-kind='input'] { border-color: color-mix(in srgb, var(--data-blue) 38%, var(--line-soft)); }
  .flow-step[data-kind='state'] { border-color: color-mix(in srgb, var(--state-gold) 58%, var(--line-soft)); }
  .flow-step[data-kind='return'] {
    border-color: color-mix(in srgb, var(--data-blue) 55%, var(--line-soft));
    border-style: dashed;
  }

  .collection-strip {
    display: flex;
    justify-content: center;
    margin-top: var(--space-2);
  }

  .collection-strip span {
    min-width: 29px;
    padding: 7px 5px;
    background: var(--surface-primary);
    border: 1px solid var(--line-medium);
    color: var(--ink-primary);
    font-family: var(--font-mono);
    font-size: var(--text-sm);
  }

  .collection-strip span + span { border-left: 0; }
  .collection-strip span:first-child { border-radius: var(--radius-xs) 0 0 var(--radius-xs); }
  .collection-strip span:last-child { border-radius: 0 var(--radius-xs) var(--radius-xs) 0; }

  .process-group {
    display: grid;
    justify-items: center;
    gap: var(--space-2);
  }

  .current-card {
    min-width: 66px;
    padding: var(--space-2);
    border: 1px solid color-mix(in srgb, var(--flow-teal) 55%, var(--line-soft));
    border-radius: var(--radius-sm);
    background: var(--flow-teal-soft);
    text-align: center;
  }

  .current-card.active,
  .loop-cycle.active {
    box-shadow: 0 0 0 3px var(--flow-teal-soft), var(--shadow-sm);
  }

  .current-value {
    margin: 0;
    font-family: var(--font-mono);
    color: var(--flow-teal);
    font-size: var(--heading-md);
    font-weight: 600;
  }

  .loop-cycle {
    width: 76px;
    height: 76px;
    border: 2px solid var(--flow-teal);
    border-radius: 50%;
    display: grid;
    place-items: center;
    position: relative;
    background: var(--surface-primary);
    color: var(--ink-secondary);
    font-size: var(--text-xs);
    line-height: 1.2;
  }

  .cycle-arrow {
    position: absolute;
    top: -14px;
    right: -2px;
    color: var(--flow-teal);
    background: var(--surface-primary);
    font-size: 24px;
    line-height: 1;
  }

  .operation {
    margin: 0;
    font-family: var(--font-mono);
    font-size: 11px;
    color: var(--work-purple);
    white-space: nowrap;
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
    font-size: var(--heading-md);
    line-height: 1;
  }

  .result-note {
    display: block;
    margin-top: var(--space-1);
    color: var(--ink-muted);
    font-size: 10px;
  }

  .loop-route {
    position: absolute;
    left: 17%;
    right: 27%;
    bottom: 24px;
    border-bottom: 2px dashed color-mix(in srgb, var(--flow-teal) 60%, transparent);
    text-align: center;
    color: var(--ink-muted);
    font-size: 10px;
    padding-bottom: 6px;
  }

  .loop-route::before {
    content: '↰';
    position: absolute;
    left: -5px;
    bottom: -7px;
    color: var(--flow-teal);
    font-size: 21px;
  }

  .tech-note {
    grid-column: 1 / -1;
    margin-top: var(--space-4);
    font-size: var(--text-xs);
    color: var(--ink-faint);
  }

  @media (max-width: 720px) {
    .learner-flow {
      grid-template-columns: 1fr;
      padding: var(--space-5);
    }

    .flow-step,
    .process-group { width: min(100%, 300px); }
    .arrow { transform: rotate(90deg); }
    .loop-route { display: none; }
  }
</style>
