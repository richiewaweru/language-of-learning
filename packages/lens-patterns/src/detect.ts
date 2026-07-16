import type { PatternHit } from '@lol/lens-contracts';
import type { DetectResult, GraphNode, GraphRelation, PatternId, SemanticGraph } from './types.js';

export const RULE_VERSION = '0.1.0';

const RELATED: Record<PatternId, PatternId[]> = {
  ACCUMULATE: ['COUNT', 'FILTER', 'SEARCH'],
  COUNT: ['ACCUMULATE', 'FILTER'],
  FILTER: ['ACCUMULATE', 'COUNT', 'TRANSFORM'],
  TRANSFORM: ['FILTER', 'ACCUMULATE'],
  SEARCH: ['FILTER', 'GUARD'],
  GUARD: ['SEARCH', 'ACCUMULATE'],
};

type GraphView = {
  nodes: GraphNode[];
  byId: Map<string, GraphNode>;
  relations: GraphRelation[];
  contains: Map<string, string[]>;
};

function view(graph: SemanticGraph): GraphView {
  const byId = new Map(graph.nodes.map((node) => [node.id, node]));
  const contains = new Map<string, string[]>();
  for (const rel of graph.relations) {
    if (rel.type !== 'contains') continue;
    const list = contains.get(rel.from) ?? [];
    list.push(rel.to);
    contains.set(rel.from, list);
  }
  return { nodes: graph.nodes, byId, relations: graph.relations, contains };
}

function ofKind(v: GraphView, kind: string): GraphNode[] {
  return v.nodes.filter((node) => node.kind === kind);
}

function contained(v: GraphView, parentId: string): string[] {
  return v.contains.get(parentId) ?? [];
}

function deepContained(v: GraphView, parentId: string): Set<string> {
  const out = new Set<string>();
  const stack = [...contained(v, parentId)];
  while (stack.length > 0) {
    const id = stack.pop()!;
    if (out.has(id)) continue;
    out.add(id);
    stack.push(...contained(v, id));
  }
  return out;
}

function relationsFrom(v: GraphView, fromId: string, type: string): string[] {
  return v.relations.filter((rel) => rel.from === fromId && rel.type === type).map((rel) => rel.to);
}

function relationsTo(v: GraphView, toId: string, type: string): string[] {
  return v.relations.filter((rel) => rel.to === toId && rel.type === type).map((rel) => rel.from);
}

function hit(pattern: PatternId, memberNodes: string[]): PatternHit {
  return {
    pattern,
    confidence: 'deterministic',
    memberNodes,
    related: RELATED[pattern],
    ruleVersion: RULE_VERSION,
  };
}

function bindingByName(v: GraphView, name: string): GraphNode | undefined {
  return v.nodes.find((node) => node.kind === 'binding' && node.name === name);
}

function detectGuard(v: GraphView): PatternHit | null {
  const functions = ofKind(v, 'function');
  if (functions.length !== 1) return null;
  const fn = functions[0]!;
  for (const childId of contained(v, fn.id)) {
    const branch = v.byId.get(childId);
    if (!branch || branch.kind !== 'branch') continue;
    // GUARD: branch at function head (direct child of function, not inside a loop)
    const insideLoop = ofKind(v, 'loop').some((loop) => deepContained(v, loop.id).has(branch.id));
    if (insideLoop) continue;
    const trueBody = branch.trueBody;
    if (!trueBody) continue;
    const ret = v.byId.get(trueBody);
    if (!ret || ret.kind !== 'return') continue;
    if (!contained(v, branch.id).includes(ret.id) && !deepContained(v, branch.id).has(ret.id)) {
      continue;
    }
    return hit('GUARD', [branch.id, ret.id]);
  }
  return null;
}

function detectSearch(v: GraphView): PatternHit | null {
  for (const loop of ofKind(v, 'loop')) {
    const inside = deepContained(v, loop.id);
    for (const id of inside) {
      const branch = v.byId.get(id);
      if (!branch || branch.kind !== 'branch') continue;
      const trueBody = branch.trueBody;
      if (!trueBody) continue;
      const ret = v.byId.get(trueBody);
      if (!ret || ret.kind !== 'return') continue;
      return hit('SEARCH', [loop.id, branch.id, ret.id]);
    }
  }
  return null;
}

function detectFilter(v: GraphView): PatternHit | null {
  for (const loop of ofKind(v, 'loop')) {
    const inside = deepContained(v, loop.id);
    for (const id of inside) {
      const branch = v.byId.get(id);
      if (!branch || branch.kind !== 'branch') continue;
      const trueBody = branch.trueBody;
      if (!trueBody) continue;
      const mut = v.byId.get(trueBody);
      if (!mut || mut.kind !== 'mutation' || mut.mutationType !== 'append') continue;
      const collectionId = mut.targetRef ?? relationsFrom(v, mut.id, 'mutates')[0];
      if (!collectionId) continue;
      return hit('FILTER', [loop.id, branch.id, mut.id, collectionId]);
    }
  }
  return null;
}

function detectTransform(v: GraphView): PatternHit | null {
  for (const loop of ofKind(v, 'loop')) {
    const inside = deepContained(v, loop.id);
    const hasBranch = [...inside].some((id) => v.byId.get(id)?.kind === 'branch');
    if (hasBranch) continue;
    for (const id of inside) {
      const mut = v.byId.get(id);
      if (!mut || mut.kind !== 'mutation' || mut.mutationType !== 'append') continue;
      const feeders = relationsTo(v, mut.id, 'feeds');
      if (feeders.length === 0) continue;
      const op = v.byId.get(feeders[0]!);
      if (!op || op.kind !== 'operation') continue;
      const collectionId = mut.targetRef ?? relationsFrom(v, mut.id, 'mutates')[0];
      if (!collectionId) continue;
      return hit('TRANSFORM', [loop.id, op.id, mut.id, collectionId]);
    }
  }
  return null;
}

type StateUpdate = {
  loop: GraphNode;
  op: GraphNode;
  state: GraphNode;
  readsIterator: boolean;
  isPlusOne: boolean;
  branch?: GraphNode;
};

function findStateUpdates(v: GraphView): StateUpdate[] {
  const updates: StateUpdate[] = [];
  for (const loop of ofKind(v, 'loop')) {
    const iterator = bindingByName(v, loop.iteratorName ?? '');
    const inside = deepContained(v, loop.id);
    for (const id of inside) {
      const op = v.byId.get(id);
      if (!op || op.kind !== 'operation') continue;
      const written = relationsFrom(v, op.id, 'writes');
      const read = relationsFrom(v, op.id, 'reads');
      for (const stateId of written) {
        const state = v.byId.get(stateId);
        if (!state || state.kind !== 'binding' || state.role !== 'state') continue;
        if (!read.includes(stateId)) continue;
        const readsIterator = Boolean(iterator && read.includes(iterator.id));
        const isPlusOne =
          op.id === 'op-inc' ||
          Boolean(op.expr && /\+\s*1\s*$/.test(op.expr));
        const branch = [...inside]
          .map((cid) => v.byId.get(cid))
          .find((node) => node?.kind === 'branch' && (node.trueBody === op.id || contained(v, node.id).includes(op.id)));
        updates.push({
          loop,
          op,
          state,
          readsIterator,
          isPlusOne,
          branch: branch?.kind === 'branch' ? branch : undefined,
        });
      }
    }
  }
  return updates;
}

function detectCount(v: GraphView): PatternHit | null {
  for (const update of findStateUpdates(v)) {
    if (!update.isPlusOne || update.readsIterator) continue;
    const members = [update.loop.id, update.state.id, update.op.id];
    if (update.branch) members.push(update.branch.id);
    return hit('COUNT', members);
  }
  return null;
}

function detectAccumulate(v: GraphView): PatternHit | null {
  for (const update of findStateUpdates(v)) {
    if (!update.readsIterator) continue;
    return hit('ACCUMULATE', [update.loop.id, update.state.id, update.op.id]);
  }
  return null;
}

/**
 * Deterministic pattern detection over a semantic graph.
 * Returns a single primary hit, or null when no registry rule fires.
 * Never emits non-deterministic confidence — suggestions are out of v0.1 scope.
 */
export function detectPattern(graph: SemanticGraph): DetectResult {
  const v = view(graph);
  return (
    detectGuard(v) ??
    detectSearch(v) ??
    detectFilter(v) ??
    detectTransform(v) ??
    detectCount(v) ??
    detectAccumulate(v) ??
    null
  );
}

export function detectPatterns(graph: SemanticGraph): PatternHit[] {
  const result = detectPattern(graph);
  return result ? [result] : [];
}
