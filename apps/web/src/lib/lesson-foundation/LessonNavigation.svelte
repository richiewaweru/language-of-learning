<script lang="ts">
  import type { LessonCheckAction } from './lesson-actions';

  let {
    checkAction,
    canGoBack,
    canGoNext,
    onBack,
    onNext,
  }: {
    checkAction: LessonCheckAction | null;
    canGoBack: boolean;
    canGoNext: boolean;
    onBack: () => void;
    onNext: () => void;
  } = $props();

  let checking = $state(false);

  async function runCheck() {
    if (!checkAction || checkAction.disabled || checking) return;
    checking = true;
    try {
      await checkAction.run();
    } finally {
      checking = false;
    }
  }
</script>

<nav class="lesson-navigation" aria-label="Lesson navigation" data-testid="lesson-navigation">
  <button class="secondary back" type="button" disabled={!canGoBack} onclick={onBack}>
    <span aria-hidden="true">‹</span> Back
  </button>

  <div class="check-slot">
    {#if checkAction}
      <button
        class="check"
        type="button"
        disabled={checkAction.disabled || checking}
        data-testid="lesson-check-action"
        data-action-testid={checkAction.testId}
        onclick={() => void runCheck()}
      >
        <span aria-hidden="true">{checkAction.completed ? '✓' : '◯'}</span>
        {checkAction.completed ? 'Checked' : checking ? 'Checking…' : 'Check My Understanding'}
      </button>
    {/if}
  </div>

  <button class="next" type="button" disabled={!canGoNext} onclick={onNext}>
    Next <span aria-hidden="true">›</span>
  </button>
</nav>

<style>
  .lesson-navigation {
    display: grid;
    grid-template-columns: minmax(120px, 1fr) minmax(230px, 1.4fr) minmax(120px, 1fr);
    gap: 20px;
    align-items: center;
    width: 100%;
    min-height: 88px;
    padding: 15px clamp(18px, 4vw, 64px);
    border-top: 1px solid var(--line-soft);
    background: color-mix(in srgb, #fffdf8 96%, transparent);
    backdrop-filter: blur(12px);
  }
  button { min-height: 48px; border-radius: 9px; font: inherit; font-weight: 700; cursor: pointer; }
  button:disabled { cursor: default; opacity: .42; }
  .secondary { justify-self: start; padding: 0 22px; border: 1px solid var(--line-medium); background: white; color: var(--ink-primary); }
  .check-slot { display: grid; place-items: center; min-height: 48px; }
  .check { width: min(100%, 340px); padding: 0 22px; border: 1px solid #2a765e; background: white; color: #1e664f; }
  .next { justify-self: end; min-width: 170px; padding: 0 24px; border: 1px solid #236b54; background: #236b54; color: white; }
  @media (max-width: 700px) {
    .lesson-navigation { grid-template-columns: 1fr 1fr; gap: 10px; padding: 10px; }
    .check-slot { grid-column: 1 / -1; grid-row: 1; }
    .secondary { grid-column: 1; grid-row: 2; justify-self: stretch; }
    .next { grid-column: 2; grid-row: 2; justify-self: stretch; min-width: 0; }
  }
</style>
