<script lang="ts">
  /**
   * PM5 — return exit (M1/M3). When a return value has settled (exit_return),
   * show the result token at the return port and a label placed *outside* the
   * function boundary, communicating what leaves the function.
   *
   * Note: the analyzer/trace emit `return_exit` but no `effect_fire` for the
   * v0.1 subset, so no effect token travels here; `pulse_effect` remains
   * supported visually via the existing EffectPulse component.
   */
  let {
    port,
    boundary,
    returnValue,
    reducedMotion = false,
  }: {
    port: { x: number; y: number; width: number; height: number };
    boundary?: { x: number; y: number; width: number; height: number };
    returnValue: string;
    reducedMotion?: boolean;
  } = $props();

  const tokenX = $derived(port.x + port.width / 2);
  const tokenY = $derived(port.y + port.height / 2);
  const labelX = $derived(boundary ? boundary.x + boundary.width : port.x + port.width);
  const labelY = $derived(boundary ? boundary.y + boundary.height / 2 : tokenY);
</script>

<div class="vg-return-exit" class:reduced={reducedMotion} data-testid="return-exit">
  <div
    class="vg-runtime-token"
    data-token=""
    data-status="returned"
    data-testid="return-token"
    style:left="{tokenX}px"
    style:top="{tokenY}px"
  >
    {returnValue}
  </div>
  <div
    class="return-label"
    data-testid="return-label"
    style:left="{labelX}px"
    style:top="{labelY}px"
  >
    → {returnValue}
  </div>
</div>

<style>
  .vg-return-exit {
    position: absolute;
    inset: 0;
    pointer-events: none;
  }

  .return-label {
    position: absolute;
    transform: translate(0.75rem, -50%);
    padding: 0.15rem 0.5rem;
    border-radius: 4px;
    border: var(--border-w) solid var(--exit-green);
    background: color-mix(in srgb, var(--exit-green) 12%, var(--paper));
    color: var(--exit-green);
    font: 700 12px/1.2 var(--font-mono);
    white-space: nowrap;
    z-index: 4;
    transition: var(--move-token);
  }

  .vg-return-exit.reduced .return-label,
  .vg-return-exit.reduced .vg-runtime-token {
    transition: none;
  }
</style>
