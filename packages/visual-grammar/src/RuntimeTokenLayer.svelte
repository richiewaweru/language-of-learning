<script lang="ts">
  import type { LayoutEdge, LayoutNode, MotionState } from '@lol/lens-contracts';

  let {
    motion,
    layout,
    edges = [],
    reducedMotion = false,
  }: {
    motion: MotionState;
    layout: LayoutNode[];
    edges?: LayoutEdge[];
    reducedMotion?: boolean;
  } = $props();

  const nodeById = $derived(new Map(layout.map((n) => [n.id, n])));
  const edgeById = $derived(new Map(edges.map((e) => [e.id, e])));

  type Placed = {
    id: string;
    repr: string;
    status: string;
    x: number;
    y: number;
  };

  function edgeMidpoint(edge: LayoutEdge): { x: number; y: number } | null {
    if ('x1' in edge.path) {
      return { x: (edge.path.x1 + edge.path.x2) / 2, y: (edge.path.y1 + edge.path.y2) / 2 };
    }
    return null;
  }

  const placedTokens = $derived.by<Placed[]>(() => {
    const out: Placed[] = [];
    for (const id of Object.keys(motion.tokens).sort()) {
      const token = motion.tokens[id]!;
      if (!token.visible) continue;
      // Returned values are owned by the ReturnExit overlay (PM5).
      if (token.status === 'returned') continue;
      let point: { x: number; y: number } | null = null;
      if (token.edgeId) {
        const edge = edgeById.get(token.edgeId);
        if (edge) point = edgeMidpoint(edge);
      }
      if (!point && token.nodeId) {
        const node = nodeById.get(token.nodeId);
        if (node) point = { x: node.x + node.width / 2, y: node.y + node.height / 2 };
      }
      if (!point) continue;
      out.push({ id, repr: token.repr, status: token.status, x: point.x, y: point.y });
    }
    return out;
  });
</script>

<div class="vg-runtime-layer" class:reduced={reducedMotion} data-testid="runtime-token-layer">
  {#each placedTokens as token (token.id)}
    <div
      class="vg-runtime-token"
      data-token=""
      data-token-id={token.id}
      data-status={token.status}
      style:left="{token.x}px"
      style:top="{token.y}px"
    >
      {token.repr}
    </div>
  {/each}
</div>

<style>
  .vg-runtime-layer {
    position: absolute;
    inset: 0;
    pointer-events: none;
  }
</style>
