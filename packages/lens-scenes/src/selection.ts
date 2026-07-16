import type { Selection } from '@lol/lens-contracts';
import type { GraphNode, SemanticGraph, Trace } from './types.js';
import type { LayoutNode } from '@lol/lens-contracts';

export type ResolvedSelection = {
  nodeIds: string[];
  primaryNodeId?: string;
  line?: number;
  stepIndices: number[];
  stepIndex?: number;
};

function nodesOnLine(graph: SemanticGraph, line: number): GraphNode[] {
  return graph.nodes.filter(
    (n) => n.sourceRange.startLine <= line && n.sourceRange.endLine >= line,
  );
}

/** Column containment: node A contains point/column of B if A's col range covers B's startCol. */
function columnContains(outer: GraphNode, inner: GraphNode): boolean {
  return (
    outer.sourceRange.startCol <= inner.sourceRange.startCol &&
    outer.sourceRange.endCol >= inner.sourceRange.endCol &&
    outer.sourceRange.startLine <= inner.sourceRange.startLine &&
    outer.sourceRange.endLine >= inner.sourceRange.endLine
  );
}

function nestingDepth(
  node: GraphNode,
  graph: SemanticGraph,
  layoutById: Map<string, LayoutNode>,
): number {
  const layout = layoutById.get(node.id);
  if (layout) {
    // Prefer layout nesting when available
    const parents = graph.relations.filter((r) => r.type === 'contains' && r.to === node.id);
    return parents.length;
  }
  return 0;
}

/**
 * SY2: among co-located nodes, prefer column containment then innermost nesting.
 */
export function pickPrimary(nodes: GraphNode[], graph: SemanticGraph, layout: LayoutNode[] = []): GraphNode | undefined {
  if (nodes.length === 0) return undefined;
  if (nodes.length === 1) return nodes[0];

  const layoutById = new Map(layout.map((n) => [n.id, n]));
  const ranked = [...nodes].sort((a, b) => {
    const aContainsB = columnContains(a, b);
    const bContainsA = columnContains(b, a);
    if (aContainsB && !bContainsA) return 1; // b is more specific
    if (bContainsA && !aContainsB) return -1;
    const depthA = nestingDepth(a, graph, layoutById);
    const depthB = nestingDepth(b, graph, layoutById);
    if (depthA !== depthB) return depthB - depthA; // deeper wins
    // Smaller source span wins
    const spanA =
      (a.sourceRange.endLine - a.sourceRange.startLine) * 1000 +
      (a.sourceRange.endCol - a.sourceRange.startCol);
    const spanB =
      (b.sourceRange.endLine - b.sourceRange.startLine) * 1000 +
      (b.sourceRange.endCol - b.sourceRange.startCol);
    return spanA - spanB;
  });
  return ranked[0];
}

export function resolveSelection(
  selection: Selection,
  graph: SemanticGraph,
  trace: Trace,
  layout: LayoutNode[] = [],
): ResolvedSelection {
  let nodeIds: string[] = [];
  let line = selection.line;
  const stepIndex = selection.stepIndex;

  if (selection.nodeId) {
    nodeIds = [selection.nodeId];
    const node = graph.nodes.find((n) => n.id === selection.nodeId);
    if (node && line === undefined) line = node.sourceRange.startLine;
  } else if (line !== undefined) {
    // SY1: line → many nodes
    nodeIds = nodesOnLine(graph, line).map((n) => n.id);
  }

  if (stepIndex !== undefined) {
    const step = trace.steps[stepIndex];
    if (step) {
      if (nodeIds.length === 0) nodeIds = [...step.focus];
      if (line === undefined) line = step.line;
    }
  }

  // SY3: node ↔ steps via focus
  const stepIndices: number[] = [];
  if (nodeIds.length > 0) {
    for (const step of trace.steps) {
      if (step.focus.some((id) => nodeIds.includes(id))) {
        stepIndices.push(step.index);
      }
    }
  }

  const nodes = nodeIds
    .map((id) => graph.nodes.find((n) => n.id === id))
    .filter((n): n is GraphNode => Boolean(n));
  const primary = pickPrimary(nodes, graph, layout);

  return {
    nodeIds,
    primaryNodeId: primary?.id,
    line,
    stepIndices,
    stepIndex: stepIndex ?? stepIndices[0],
  };
}
