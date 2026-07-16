<script lang="ts">
  import type { LayoutEdge } from '@lol/lens-contracts';

  let {
    edges = [],
    activePaths = [],
    fadedPaths = [],
    width = 640,
    height = 480,
  }: {
    edges?: LayoutEdge[];
    activePaths?: string[];
    fadedPaths?: string[];
    width?: number;
    height?: number;
  } = $props();

  function pathD(edge: LayoutEdge): string {
    if ('d' in edge.path) return edge.path.d;
    return `M${edge.path.x1} ${edge.path.y1} L${edge.path.x2} ${edge.path.y2}`;
  }

  const activeSet = $derived(new Set(activePaths));
  const fadedSet = $derived(new Set(fadedPaths));
</script>

<svg
  class="vg-motion-path"
  data-testid="motion-path"
  viewBox="0 0 {width} {height}"
  width={width}
  height={height}
  aria-hidden="true"
>
  {#each edges as edge (edge.id)}
    <path
      class="vg-motion-edge"
      data-edge-id={edge.id}
      data-kind={edge.kind}
      data-active={activeSet.has(edge.id)}
      data-faded={fadedSet.has(edge.id)}
      d={pathD(edge)}
    />
  {/each}
</svg>
