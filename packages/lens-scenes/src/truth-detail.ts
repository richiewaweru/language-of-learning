import type { Selection, Scene } from '@lol/lens-contracts';
import type { SemanticGraph, Trace, TraceStep } from './types.js';
import { deriveLearnerCaption } from './learner-labels.js';
import { resolveSelection } from './selection.js';

export type TruthDetail = {
  what: string;
  currentValue?: string;
  origin?: string;
  changedBy?: string;
  destination?: string;
  whyActive?: string;
  /** Technical evidence (optional toggle) */
  nodeId?: string;
  sourceRange?: { startLine: number; endLine: number; startCol: number; endCol: number };
  traceEvent?: string;
  bindingSnapshot?: Record<string, string>;
  sceneAction?: string;
  stepIndex?: number;
  line?: number;
};

function stepAt(trace: Trace, stepIndex: number): TraceStep | undefined {
  return trace.steps[stepIndex];
}

export function resolveTruthDetail(
  selection: Selection,
  graph: SemanticGraph,
  trace: Trace,
  scene: Scene,
  stepIndex: number,
): TruthDetail | null {
  const resolved = resolveSelection(
    { ...selection, stepIndex },
    graph,
    trace,
    scene.layout,
  );
  const step = stepAt(trace, stepIndex);
  const sceneStep = scene.steps[stepIndex];
  if (!step) return null;

  const primaryId = resolved.primaryNodeId ?? selection.nodeId;
  const bindings = step.bindings;
  const caption = deriveLearnerCaption(graph, step, trace, sceneStep);

  if (primaryId) {
    const node = graph.nodes.find((n) => n.id === primaryId);
    if (node) {
      const detail: TruthDetail = {
        what: `${node.kind}${node.name ? `: ${node.name}` : ''}`,
        currentValue: node.name ? bindings[node.name] : undefined,
        whyActive: caption,
        nodeId: node.id,
        sourceRange: node.sourceRange,
        traceEvent: step.event.type,
        bindingSnapshot: { ...bindings },
        sceneAction: sceneStep?.actions.map((a) => a.type).join(', '),
        stepIndex,
        line: node.sourceRange.startLine,
      };

      if (node.kind === 'binding') {
        if (node.role === 'state') {
          detail.what = `Remembered state: ${node.name}`;
          if (step.event.type === 'state_change' && step.event.binding === node.id) {
            detail.origin = step.event.oldRepr;
            detail.changedBy = `Added ${bindings[graph.nodes.find((n) => n.role === 'iterator')?.name ?? 'item'] ?? '?'}`;
            detail.currentValue = step.event.newRepr;
            detail.destination = node.name;
          }
        } else if (node.role === 'iterator') {
          detail.what = `Current item: ${node.name}`;
          detail.currentValue = bindings[node.name ?? ''];
          detail.origin = 'From the input collection';
        }
      }

      if (node.kind === 'return') {
        detail.what = 'Function result';
        detail.currentValue = trace.result?.repr;
        detail.destination = 'Return path';
      }

      if (node.kind === 'branch') {
        detail.what = 'Condition branch';
        if (step.event.type === 'condition_eval') {
          detail.currentValue = step.event.result ? 'true' : 'false';
          detail.changedBy = 'Condition evaluation';
        }
      }

      return detail;
    }
  }

  if (selection.line !== undefined || resolved.line !== undefined) {
    const line = selection.line ?? resolved.line;
    return {
      what: `Code line ${line}`,
      whyActive: caption,
      line,
      stepIndex,
      traceEvent: step.event.type,
      bindingSnapshot: { ...bindings },
      nodeId: resolved.primaryNodeId,
    };
  }

  return {
    what: 'Current execution step',
    whyActive: caption,
    stepIndex,
    traceEvent: step.event.type,
    bindingSnapshot: { ...bindings },
  };
}
