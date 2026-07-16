<script lang="ts">
  /**
   * PM3 — state morph overlay (M2/M4). Renders the old repr (ghost) and the new
   * repr together for one beat near the state cell. Purely presentational: it
   * shows contract truth carried by the `change_state` action (oldRepr/newRepr),
   * never an invented value.
   */
  let {
    x,
    y,
    width,
    oldRepr,
    newRepr,
    reducedMotion = false,
  }: {
    x: number;
    y: number;
    width: number;
    oldRepr: string;
    newRepr: string;
    reducedMotion?: boolean;
  } = $props();
</script>

<div
  class="vg-state-transition"
  class:reduced={reducedMotion}
  data-testid="state-transition"
  style:left="{x + width / 2}px"
  style:top="{y}px"
>
  {#if oldRepr && oldRepr !== '—'}
    <span class="old" data-testid="state-old">{oldRepr}</span>
    <span class="arrow" aria-hidden="true">→</span>
  {/if}
  <span class="new" data-testid="state-new">{newRepr}</span>
</div>

<style>
  .vg-state-transition {
    position: absolute;
    transform: translate(-50%, -140%);
    display: flex;
    align-items: center;
    gap: 0.25rem;
    padding: 0.1rem 0.4rem;
    border-radius: var(--radius-pill);
    background: color-mix(in srgb, var(--state-gold) 12%, var(--paper));
    border: var(--border-w) solid var(--state-gold);
    color: var(--state-gold);
    font: 600 11px/1.2 var(--font-mono);
    white-space: nowrap;
    pointer-events: none;
    z-index: 4;
    transition: var(--move-token);
  }

  .old {
    opacity: var(--dim-opacity);
    text-decoration: line-through;
  }

  .arrow {
    opacity: 0.7;
  }

  .new {
    font-weight: 700;
  }

  .vg-state-transition.reduced {
    transition: none;
  }
</style>
