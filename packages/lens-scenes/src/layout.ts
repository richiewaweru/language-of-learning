import type { LayoutNode } from '@lol/lens-contracts';
import type { GraphNode, GraphRelation, LayoutResult, SemanticGraph } from './types.js';

export const GRID = 28;
export const MAX_NESTING = 3;

const SIZE: Record<string, { w: number; h: number }> = {
  function: { w: 16 * GRID, h: 2 * GRID },
  binding: { w: 4 * GRID, h: GRID },
  collection: { w: 5 * GRID, h: 2 * GRID },
  value: { w: 2 * GRID, h: GRID },
  loop: { w: 12 * GRID, h: 2 * GRID },
  branch: { w: 10 * GRID, h: 2 * GRID },
  operation: { w: 5 * GRID, h: GRID },
  mutation: { w: 4 * GRID, h: GRID },
  return: { w: 4 * GRID, h: GRID },
  call: { w: 4 * GRID, h: GRID },
  'builtin-call': { w: 6 * GRID, h: 2 * GRID },
  sequence: { w: 8 * GRID, h: GRID },
  effect: { w: 4 * GRID, h: GRID },
};

export class LayoutError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'LayoutError';
  }
}

function containsMap(relations: GraphRelation[]): Map<string, string[]> {
  const map = new Map<string, string[]>();
  for (const rel of relations) {
    if (rel.type !== 'contains') continue;
    const list = map.get(rel.from) ?? [];
    list.push(rel.to);
    map.set(rel.from, list);
  }
  return map;
}

function nodeSize(node: GraphNode): { w: number; h: number } {
  if (node.kind === 'binding' && node.role === 'state') {
    return { w: 5 * GRID, h: 2 * GRID };
  }
  return SIZE[node.kind] ?? { w: 3 * GRID, h: GRID };
}

type Placed = LayoutNode & { depth: number };

function layoutSubtree(
  nodeId: string,
  byId: Map<string, GraphNode>,
  childrenOf: Map<string, string[]>,
  originX: number,
  originY: number,
  depth: number,
  out: Placed[],
): { width: number; height: number } {
  if (depth > MAX_NESTING) {
    throw new LayoutError(`Nesting depth exceeds ${MAX_NESTING} at ${nodeId}`);
  }
  const node = byId.get(nodeId);
  if (!node) throw new LayoutError(`Missing node ${nodeId}`);

  const childIds = childrenOf.get(nodeId) ?? [];
  const size = nodeSize(node);
  const pad = GRID;
  let cursorY = originY + size.h + pad / 2;
  let maxChildRight = originX + size.w;
  let contentBottom = originY + size.h;

  for (const childId of childIds) {
    const child = byId.get(childId);
    if (!child) continue;
    // Leave value literals out of structural nesting column (they hug bindings)
    if (child.kind === 'value') continue;
    const placed = layoutSubtree(
      childId,
      byId,
      childrenOf,
      originX + pad,
      cursorY,
      depth + 1,
      out,
    );
    cursorY += placed.height + pad / 2;
    maxChildRight = Math.max(maxChildRight, originX + pad + placed.width);
    contentBottom = cursorY - pad / 2;
  }

  // Place value nodes to the right of their sibling bindings on the same band
  for (const childId of childIds) {
    const child = byId.get(childId);
    if (!child || child.kind !== 'value') continue;
    const vs = nodeSize(child);
    out.push({
      id: child.id,
      kind: child.kind,
      x: maxChildRight + pad / 2,
      y: originY + size.h + pad / 2,
      width: vs.w,
      height: vs.h,
      depth: depth + 1,
    });
    maxChildRight += vs.w + pad / 2;
  }

  const width = Math.max(size.w, maxChildRight - originX + pad);
  const height = Math.max(size.h, contentBottom - originY + pad / 2);

  const isContainer = ['function', 'loop', 'branch', 'builtin-call'].includes(node.kind);
  out.push({
    id: node.id,
    kind: node.kind,
    x: originX,
    y: originY,
    width,
    height: isContainer ? height : size.h,
    depth,
  });

  return { width, height: isContainer ? height : size.h };
}

/** AABB overlap: siblings must not overlap; containment nesting is allowed. */
export function assertNoOverlap(layout: LayoutNode[]): void {
  for (let i = 0; i < layout.length; i++) {
    for (let j = i + 1; j < layout.length; j++) {
      const a = layout[i]!;
      const b = layout[j]!;
      const overlaps =
        a.x < b.x + b.width &&
        a.x + a.width > b.x &&
        a.y < b.y + b.height &&
        a.y + a.height > b.y;
      if (!overlaps) continue;
      const aContainsB =
        a.x <= b.x &&
        a.y <= b.y &&
        a.x + a.width >= b.x + b.width &&
        a.y + a.height >= b.y + b.height;
      const bContainsA =
        b.x <= a.x &&
        b.y <= a.y &&
        b.x + b.width >= a.x + a.width &&
        b.y + b.height >= a.y + a.height;
      if (aContainsB || bContainsA) continue;
      throw new LayoutError(`Overlap between ${a.id} and ${b.id}`);
    }
  }
}

export function layoutGraph(graph: SemanticGraph): LayoutResult {
  const functions = graph.nodes.filter((n) => n.kind === 'function');
  if (functions.length !== 1) {
    throw new LayoutError('Layout requires exactly one function node');
  }
  const fn = functions[0]!;
  const byId = new Map(graph.nodes.map((n) => [n.id, n]));
  const childrenOf = containsMap(graph.relations);
  const placed: Placed[] = [];
  const box = layoutSubtree(fn.id, byId, childrenOf, GRID, GRID, 0, placed);

  // Nodes not reached via contains (e.g. iterator bindings) — place under function row
  const placedIds = new Set(placed.map((p) => p.id));
  let orphanX = GRID * 2;
  const orphanY = GRID * 2;
  for (const node of graph.nodes) {
    if (placedIds.has(node.id)) continue;
    if (node.kind === 'value') continue;
    const size = nodeSize(node);
    placed.push({
      id: node.id,
      kind: node.kind,
      x: orphanX,
      y: orphanY,
      width: size.w,
      height: size.h,
      depth: 1,
    });
    orphanX += size.w + GRID / 2;
    placedIds.add(node.id);
  }

  const layout: LayoutNode[] = placed.map(({ id, kind, x, y, width, height }) => ({
    id,
    kind,
    x,
    y,
    width,
    height,
  }));

  assertNoOverlap(layout);

  const nestingDepth = Math.max(...placed.map((p) => p.depth), 0);
  const width = Math.max(...layout.map((n) => n.x + n.width), box.width) + GRID;
  const height = Math.max(...layout.map((n) => n.y + n.height), box.height) + GRID;

  return { layout, width, height, nestingDepth };
}
