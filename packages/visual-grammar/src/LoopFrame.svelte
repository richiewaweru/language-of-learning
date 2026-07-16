<script lang="ts">
  let {
    id,
    x,
    y,
    width,
    height,
    iteratorName,
    itemIndex = 0,
    itemCount = 1,
    focused = false,
    dimmed = false,
    onclick,
  }: {
    id: string;
    x: number;
    y: number;
    width: number;
    height: number;
    iteratorName: string;
    itemIndex?: number;
    itemCount?: number;
    focused?: boolean;
    dimmed?: boolean;
    onclick?: () => void;
  } = $props();

  const markerLeft = $derived(
    itemCount <= 1 ? 0 : Math.min(1, itemIndex / Math.max(itemCount - 1, 1)) * 100,
  );
</script>

<div
  class="vg-node vg-loop"
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
  for {iteratorName}
  <div class="vg-loop-track">
    <div class="vg-loop-marker" style:left="calc({markerLeft}% - 5px)"></div>
  </div>
</div>
