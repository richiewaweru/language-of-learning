import type { SemanticGraph, Trace } from '@lol/lens-scenes';
import type { Scene } from '@lol/lens-contracts';

export type VisualGroup = {
  id: string;
  label: string;
  nodeIds: string[];
};

export interface LearnerProjection {
  visibleNodeIds: string[];
  groups: VisualGroup[];
  labels: Record<string, string>;
  emphasis: string[];
  hiddenTechnicalNodes: string[];
  flowSteps: LearnerFlowStep[];
}

export type LearnerFlowStep = {
  id: string;
  label: string;
  value: string;
  kind: 'input' | 'current' | 'work' | 'state' | 'return' | 'other';
  active: boolean;
};

function collectionRepr(graph: SemanticGraph, trace: Trace, stepIndex: number): string {
  const coll = graph.nodes.find((n) => n.kind === 'collection');
  const bindings = trace.steps[stepIndex]?.bindings ?? {};
  if (coll) {
    for (const [name, repr] of Object.entries(bindings)) {
      const bind = graph.nodes.find((n) => n.kind === 'binding' && 'name' in n && n.name === name);
      if (
        bind &&
        graph.relations?.some((r) => r.type === 'contains' && r.to === coll.id && r.from === bind.id)
      ) {
        return repr;
      }
    }
  }
  const parameterValue = Object.entries(bindings).find(([name, repr]) => {
    if (!repr.startsWith('[') || !repr.endsWith(']')) return false;
    return graph.nodes.some(
      (node) =>
        node.kind === 'binding' &&
        'role' in node &&
        node.role === 'parameter' &&
        'name' in node &&
        node.name === name,
    );
  });
  if (parameterValue) return parameterValue[1];
  if (!coll) return '';
  if ('items' in coll && Array.isArray((coll as { items?: unknown[] }).items)) {
    const items = (coll as { items: Array<{ repr?: string }> }).items;
    return `[${items.map((i) => i.repr ?? '?').join(', ')}]`;
  }
  return '';
}

function stateRepr(graph: SemanticGraph, trace: Trace, stepIndex: number): string {
  const state = graph.nodes.find((n) => n.kind === 'binding' && 'role' in n && n.role === 'state');
  if (!state || !('name' in state) || typeof state.name !== 'string') return '';
  return trace.steps[stepIndex]?.bindings[state.name] ?? '';
}

function currentItemRepr(graph: SemanticGraph, trace: Trace, stepIndex: number): string {
  const iter = graph.nodes.find((n) => n.kind === 'binding' && 'role' in n && n.role === 'iterator');
  if (!iter || !('name' in iter) || typeof iter.name !== 'string') return '';
  return trace.steps[stepIndex]?.bindings[iter.name] ?? '';
}

function returnRepr(trace: Trace): string {
  return trace.result?.repr ?? '';
}

/**
 * Derives a learner-facing projection from engine truth — never hand-authored per frame.
 */
export function deriveLearnerProjection(
  graph: SemanticGraph,
  trace: Trace,
  scene: Scene,
  stepIndex: number,
): LearnerProjection {
  const focus = new Set(scene.steps[stepIndex]?.focus ?? []);
  const emphasis = [...focus];

  const hiddenTechnicalNodes: string[] = [];
  for (const node of graph.nodes) {
    if (
      node.kind === 'binding' &&
      'role' in node &&
      (node.role === 'local' || node.role === 'parameter')
    ) {
      hiddenTechnicalNodes.push(node.id);
    }
  }

  const inputVal = collectionRepr(graph, trace, stepIndex);
  const currentVal = currentItemRepr(graph, trace, stepIndex);
  const stateVal = stateRepr(graph, trace, stepIndex);
  const resultVal = returnRepr(trace);
  const operation = graph.nodes.find((node) => node.kind === 'operation');
  const operationVal =
    operation && 'expr' in operation && typeof operation.expr === 'string'
      ? operation.expr
      : '';

  const eventType = trace.steps[stepIndex]?.event?.type ?? '';
  const workActive = eventType === 'state_change';
  const returnActive = eventType === 'return_exit' || stepIndex === trace.steps.length - 1;

  const flowSteps: LearnerFlowStep[] = [
    {
      id: 'input',
      label: 'Input collection',
      value: inputVal,
      kind: 'input',
      active: stepIndex === 0 || eventType === 'call_enter' || eventType === 'bind_param',
    },
    {
      id: 'current',
      label: 'Current item',
      value: currentVal,
      kind: 'current',
      active: eventType === 'loop_advance' || eventType === 'state_change',
    },
    {
      id: 'work',
      label: 'Operation',
      value: operationVal,
      kind: 'work',
      active: workActive,
    },
    {
      id: 'state',
      label: 'Running total',
      value: stateVal,
      kind: 'state',
      active: Boolean(stateVal) && workActive,
    },
    {
      id: 'return',
      label: 'Returned result',
      value: resultVal,
      kind: 'return',
      active: returnActive,
    },
  ];

  const visibleNodeIds = graph.nodes
    .map((n) => n.id)
    .filter((id) => !hiddenTechnicalNodes.includes(id));

  const labels: Record<string, string> = {};
  for (const node of graph.nodes) {
    if (node.kind === 'loop') labels[node.id] = 'Loop body';
    if (node.kind === 'collection') labels[node.id] = 'Input collection';
    if (node.kind === 'binding' && 'role' in node && node.role === 'state')
      labels[node.id] = 'Running total';
    if (node.kind === 'binding' && 'role' in node && node.role === 'iterator')
      labels[node.id] = 'Current item';
    if (node.kind === 'return') labels[node.id] = 'Returned result';
    if (node.kind === 'function') labels[node.id] = 'Function';
  }

  const groups: VisualGroup[] = [
    { id: 'flow', label: 'Execution flow', nodeIds: visibleNodeIds },
  ];

  return {
    visibleNodeIds,
    groups,
    labels,
    emphasis,
    hiddenTechnicalNodes,
    flowSteps,
  };
}

export function eventToLearnerLabel(eventType: string): string {
  const map: Record<string, string> = {
    state_change: 'The running total changed',
    loop_advance: 'The loop moved to the next item',
    loop_enter: 'The loop started',
    condition_eval: 'The program checked the condition',
    return_exit: 'The function returned its result',
    bind_value: 'A value was stored',
    operation_eval: 'An operation ran',
  };
  return map[eventType] ?? 'The program advanced';
}
