<script lang="ts">
  type Option = { id: string; label: string };

  let {
    prompt,
    options,
    correctId,
    onAnswer,
    feedback = '',
  }: {
    prompt: string;
    options: Option[];
    correctId: string;
    onAnswer?: (optionId: string, correct: boolean) => void;
    feedback?: string;
  } = $props();

  let selected = $state<string | null>(null);
  let answered = $state(false);

  function choose(id: string) {
    if (answered) return;
    selected = id;
    answered = true;
    onAnswer?.(id, id === correctId);
  }
</script>

<section class="prediction" data-testid="prediction-prompt">
  <h2>What happens next?</h2>
  <p class="prompt">{prompt}</p>
  <div class="options" role="group" aria-label="Prediction choices">
    {#each options as opt}
      <button
        type="button"
        class:selected={selected === opt.id}
        class:correct={answered && opt.id === correctId}
        class:wrong={answered && selected === opt.id && opt.id !== correctId}
        disabled={answered}
        onclick={() => choose(opt.id)}
      >
        {opt.label}
      </button>
    {/each}
  </div>
  {#if feedback}
    <p class="feedback" role="status">{feedback}</p>
  {/if}
</section>

<style>
  .prediction {
    padding: var(--space-6);
    background: var(--surface-paper);
    border: var(--border-w) solid var(--line-default);
    border-radius: var(--radius-panel);
    margin: var(--space-4) 0;
  }

  h2 {
    font-size: var(--text-lg);
    margin: 0 0 var(--space-3);
  }

  .prompt {
    color: var(--ink-body);
    margin: 0 0 var(--space-4);
  }

  .options {
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
  }

  .options button {
    text-align: left;
    padding: var(--space-3) var(--space-4);
    border: var(--border-w) solid var(--line-default);
    border-radius: var(--radius-sm);
    background: var(--surface-raised);
    cursor: pointer;
    font-size: var(--text-sm);
  }

  .options button.correct {
    border-color: var(--exit-green);
    font-weight: 600;
  }

  .options button.wrong {
    border-color: var(--alert-orange);
  }

  .feedback {
    margin: var(--space-4) 0 0;
    font-size: var(--text-sm);
    color: var(--ink-body);
  }
</style>
