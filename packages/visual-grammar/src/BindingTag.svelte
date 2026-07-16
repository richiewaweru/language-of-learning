<script lang="ts">
  let {
    id,
    x,
    y,
    width,
    height,
    name,
    role = 'local',
    value,
    ghost,
    focused = false,
    dimmed = false,
    onclick,
  }: {
    id: string;
    x: number;
    y: number;
    width: number;
    height: number;
    name: string;
    role?: string;
    value?: string;
    ghost?: string;
    focused?: boolean;
    dimmed?: boolean;
    onclick?: () => void;
  } = $props();
</script>

<div
  class="vg-node vg-binding"
  class:vg-state={role === 'state'}
  data-id={id}
  data-role={role}
  data-focus={focused}
  data-dim={dimmed}
  style:left="{x}px"
  style:top="{y}px"
  style:width="{width}px"
  style:height="{height}px"
  role="button"
  tabindex="0"
  onclick={onclick}
  onkeydown={(e) => e.key === 'Enter' && onclick?.()}
>
  <span>{name}</span>
  {#if ghost}
    <span class="vg-ghost">{ghost}</span>
  {/if}
  {#if value !== undefined}
    <strong style="margin-left:auto">{value}</strong>
  {/if}
</div>
