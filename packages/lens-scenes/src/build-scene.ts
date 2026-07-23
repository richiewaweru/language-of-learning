import type { LayoutEdge, LayoutEdgeKind, LayoutNode, Scene } from '@lol/lens-contracts';
import { layoutGraph } from './layout.js';
import { buildSceneSteps } from './scene-builder.js';
import type { SemanticGraph, Trace } from './types.js';

/** Graph relations that become drawable layout edges, and their arrow grammar (LE2). */
const RELATION_EDGE_KIND: Record<string, LayoutEdgeKind> = {
  contains: 'control',
  reads: 'data',
  writes: 'data',
  iterates: 'repeat',
  mutates: 'data',
  returns: 'return',
};

/**
 * Minimal PM1 layout edges: straight lines between the centres of related
 * layout nodes (LE1 — anchors come from the computed layout, never hand-placed).
 */
function buildEdges(graph: SemanticGraph, layout: LayoutNode[]): LayoutEdge[] {
  const byId = new Map(layout.map((n) => [n.id, n]));
  const edges: LayoutEdge[] = [];
  const seen = new Set<string>();
  for (const rel of graph.relations) {
    const kind = RELATION_EDGE_KIND[rel.type];
    if (!kind) continue;
    const from = byId.get(rel.from);
    const to = byId.get(rel.to);
    if (!from || !to) continue;
    const id = `edge-${rel.from}-${rel.to}-${rel.type}`;
    if (seen.has(id)) continue;
    seen.add(id);
    edges.push({
      id,
      fromNode: rel.from,
      toNode: rel.to,
      kind,
      path: {
        x1: from.x + from.width / 2,
        y1: from.y + from.height / 2,
        x2: to.x + to.width / 2,
        y2: to.y + to.height / 2,
      },
    });
  }
  return edges;
}

export function buildScene(
  graph: SemanticGraph,
  trace: Trace,
  options: { sceneId?: string; graphRef?: string } = {},
): Scene {
  const { layout } = layoutGraph(graph);
  const steps = buildSceneSteps(graph, trace);
  return {
    id:
      options.sceneId ??
      `scene-${trace.scope.kind === 'function' ? trace.scope.functionId : trace.scope.id}`,
    graphRef: options.graphRef ?? graph.version,
    motionVersion: '0.2',
    layout,
    edges: buildEdges(graph, layout),
    steps,
  };
}
