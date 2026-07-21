<script lang="ts">
  let { caption, label = 'Current step' }: { caption: string; label?: string } = $props();
</script>

<div class="explanation-panel" data-testid="explanation-panel" aria-live="polite">
  <p class="eyebrow">{label}</p>
  <p class="caption">{caption}</p>
</div>

<style>
  .explanation-panel {
    background: var(--surface-paper);
    border: var(--border-w) solid var(--line-default);
    border-radius: var(--radius-panel);
    box-shadow: var(--shadow-sm);
    padding: var(--space-5) var(--space-6);
  }

  .eyebrow {
    font: var(--eyebrow);
    letter-spacing: 0.12em;
    text-transform: uppercase;
    font-size: 11px;
    color: var(--ink-muted);
    margin: 0 0 var(--space-3);
  }

  .caption {
    font-size: var(--text-lg);
    line-height: 1.5;
    color: var(--ink-strong);
    margin: 0;
    max-width: 65ch;
  }
</style>
