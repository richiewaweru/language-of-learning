<script lang="ts">
  let {
    id = 'unsupported',
    x,
    y,
    width,
    height,
    message,
  }: {
    id?: string;
    x: number;
    y: number;
    width: number;
    height: number;
    message: string;
  } = $props();
</script>

<div
  class="vg-node vg-unsupported"
  data-id={id}
  style:left="{x}px"
  style:top="{y}px"
  style:width="{width}px"
  style:height="{height}px"
>
  {message}
</div>
