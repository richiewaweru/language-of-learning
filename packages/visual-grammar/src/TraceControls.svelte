<script lang="ts">
  let {
    stepIndex,
    maxStep,
    playing = false,
    onback,
    onstep,
    onplay,
    onpause,
    onreset,
    onscrub,
  }: {
    stepIndex: number;
    maxStep: number;
    playing?: boolean;
    onback: () => void;
    onstep: () => void;
    onplay: () => void;
    onpause: () => void;
    onreset: () => void;
    onscrub: (index: number) => void;
  } = $props();
</script>

<div class="vg-controls" role="toolbar" aria-label="Trace controls">
  <button type="button" onclick={onback} disabled={stepIndex <= 0}>Back</button>
  <button type="button" onclick={onstep} disabled={stepIndex >= maxStep}>Step</button>
  {#if playing}
    <button type="button" onclick={onpause}>Pause</button>
  {:else}
    <button type="button" onclick={onplay} disabled={stepIndex >= maxStep}>Play</button>
  {/if}
  <button type="button" onclick={onreset}>Reset</button>
  <label class="vg-scrub">
    <span class="sr-only">Scrub</span>
    <input
      type="range"
      min="0"
      max={maxStep}
      value={stepIndex}
      oninput={(e) => onscrub(Number(e.currentTarget.value))}
    />
  </label>
  <span>{stepIndex}/{maxStep}</span>
</div>

<style>
  .sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip: rect(0 0 0 0);
  }
</style>
