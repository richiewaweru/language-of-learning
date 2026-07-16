<script lang="ts">
  let {
    id,
    x,
    y,
    width,
    height,
    name,
    items = [],
    focused = false,
    dimmed = false,
    onclick,
  }: {
    id: string;
    x: number;
    y: number;
    width: number;
    height: number;
    name?: string;
    items?: string[];
    focused?: boolean;
    dimmed?: boolean;
    onclick?: () => void;
  } = $props();
</script>

<div
  class="vg-node vg-collection"
  data-id={id}
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
  <div>{name ?? 'collection'}</div>
  <div>[{items.join(', ')}]</div>
</div>
