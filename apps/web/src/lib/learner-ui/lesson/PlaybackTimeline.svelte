<script lang="ts">
  import type { Selection } from '@lol/lens-contracts';

  let {
    stepIndex,
    totalSteps,
    selection,
    onselectionchange,
    autoplayAllowed = true,
  }: {
    stepIndex: number;
    totalSteps: number;
    selection: Selection;
    onselectionchange?: (next: Selection) => void;
    autoplayAllowed?: boolean;
  } = $props();

  let playing = $state(false);
  let playTimer: ReturnType<typeof setInterval> | null = null;

  function goToStep(next: number) {
    const clamped = Math.max(0, Math.min(next, totalSteps - 1));
    onselectionchange?.({ ...selection, stepIndex: clamped });
  }

  function togglePlay() {
    if (playing) {
      if (playTimer) clearInterval(playTimer);
      playTimer = null;
      playing = false;
      return;
    }
    playing = true;
    playTimer = setInterval(() => {
      if (stepIndex >= totalSteps - 1) {
        if (playTimer) clearInterval(playTimer);
        playing = false;
        return;
      }
      goToStep(stepIndex + 1);
    }, 1600);
  }

  $effect(() => {
    return () => {
      if (playTimer) clearInterval(playTimer);
    };
  });
</script>

<div class="playback-timeline" data-testid="playback-timeline">
  <div class="progress-row">
    <span class="step-label">Step {stepIndex + 1} of {totalSteps}</span>
    <div class="dots" aria-hidden="true">
      {#each Array(totalSteps) as _, i}
        <span class="dot" class:active={i === stepIndex} class:done={i < stepIndex}></span>
      {/each}
    </div>
  </div>

  <div class="controls">
    <button type="button" class="secondary" onclick={() => goToStep(0)} aria-label="Start">
      Start
    </button>
    <button type="button" class="secondary" onclick={() => goToStep(stepIndex - 1)} disabled={stepIndex === 0} aria-label="Back">
      Back
    </button>
    {#if autoplayAllowed}
      <button type="button" class="primary" onclick={togglePlay} aria-label={playing ? 'Pause' : 'Play'}>
        {playing ? 'Pause' : 'Play'}
      </button>
    {/if}
    <button type="button" class="primary" onclick={() => goToStep(stepIndex + 1)} disabled={stepIndex >= totalSteps - 1} aria-label="Next">
      Next
    </button>
    <button type="button" class="secondary" onclick={() => goToStep(totalSteps - 1)} aria-label="End">
      End
    </button>
  </div>
</div>

<style>
  .playback-timeline {
    padding: var(--space-4) var(--space-5);
    background: var(--surface-primary);
    border: 1px solid var(--line-soft);
    border-radius: var(--radius-md);
  }

  .progress-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-4);
    margin-bottom: var(--space-3);
  }

  .step-label {
    font-size: var(--text-sm);
    font-weight: 500;
    color: var(--ink-secondary);
    white-space: nowrap;
  }

  .dots {
    display: flex;
    gap: var(--space-2);
    flex: 1;
    justify-content: center;
  }

  .dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: var(--line-medium);
  }

  .dot.done {
    background: var(--flow-teal);
    opacity: 0.5;
  }

  .dot.active {
    background: var(--brand-blue);
    transform: scale(1.25);
  }

  .controls {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-2);
    justify-content: center;
  }

  .controls button {
    padding: var(--space-2) var(--space-4);
    border-radius: var(--radius-sm);
    font-size: var(--text-sm);
    font-weight: 500;
    cursor: pointer;
    border: 1px solid var(--line-medium);
    background: var(--surface-primary);
    color: var(--ink-primary);
  }

  .controls button.primary {
    background: var(--brand-blue);
    color: white;
    border-color: var(--brand-blue);
  }

  .controls button:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
</style>
