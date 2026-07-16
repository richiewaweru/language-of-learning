<script lang="ts">
  /**
   * PM4 — branch route treatment (M5). The taken route is emphasized; the
   * untaken route fades to --dim-opacity but stays on canvas (never deleted).
   * `result` comes from `motion.branchResults` for this branch node.
   */
  let {
    x,
    y,
    width,
    height,
    result,
    reducedMotion = false,
  }: {
    x: number;
    y: number;
    width: number;
    height: number;
    result?: boolean;
    reducedMotion?: boolean;
  } = $props();
</script>

<div
  class="vg-branch-route"
  class:reduced={reducedMotion}
  data-testid="branch-route"
  style:left="{x + width}px"
  style:top="{y + height / 2}px"
>
  <span
    class="route true"
    data-route="true"
    data-active={result === true}
    data-dim={result === false}>true</span
  >
  <span
    class="route false"
    data-route="false"
    data-active={result === false}
    data-dim={result === true}>false</span
  >
</div>

<style>
  .vg-branch-route {
    position: absolute;
    transform: translate(0.5rem, -50%);
    display: flex;
    flex-direction: column;
    gap: 0.2rem;
    pointer-events: none;
    z-index: 2;
  }

  .route {
    padding: 0.05rem 0.4rem;
    border-radius: 3px;
    border: var(--border-w) solid var(--branch-magenta);
    background: color-mix(in srgb, var(--branch-magenta) 8%, var(--paper));
    color: var(--branch-magenta);
    font: 600 10px/1.2 var(--font-mono);
    transition: var(--move-focus);
  }

  .route[data-active='true'] {
    font-weight: 700;
    box-shadow: var(--focus-glow);
    opacity: 1;
  }

  .route[data-dim='true'] {
    opacity: var(--dim-opacity);
  }

  .vg-branch-route.reduced .route {
    transition: none;
  }
</style>
