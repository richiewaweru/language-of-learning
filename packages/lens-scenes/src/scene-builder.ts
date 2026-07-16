import type { SceneAction, SceneStep } from '@lol/lens-contracts';
import type { GraphNode, SemanticGraph, Trace, TraceStep } from './types.js';

export type CaptionTemplates = Record<string, string>;

export const CAPTION_TEMPLATES: CaptionTemplates = {
  'call.enter': 'Enter {function}',
  'state.init': 'Set {name} to {repr}',
  'loop.advance': 'Next {item} in the loop',
  'branch.evaluate': 'Check {branch}: {result}',
  'state.change': '{name} changes {old} → {new}',
  'collection.append': 'Append {repr} to {collection}',
  'return.exit': 'Return {repr}',
  'effect.pulse': 'Effect {repr}',
  'bind.param': 'Bind parameter {name} = {repr}',
};

function byId(graph: SemanticGraph): Map<string, GraphNode> {
  return new Map(graph.nodes.map((n) => [n.id, n]));
}

function bindingName(graph: SemanticGraph, bindingId: string): string {
  const node = byId(graph).get(bindingId);
  return node?.name ?? bindingId;
}

function collectionName(graph: SemanticGraph, collectionId: string): string {
  const node = byId(graph).get(collectionId);
  return node?.name ?? collectionId;
}

function findIteratorForAppend(graph: SemanticGraph, step: TraceStep): string | undefined {
  // Prefer focused mutation's collection; value comes from iterator in bindings
  for (const node of graph.nodes) {
    if (node.kind === 'binding' && node.role === 'iterator' && step.bindings[node.name ?? ''] !== undefined) {
      return node.id;
    }
  }
  return undefined;
}

function actionsForStep(graph: SemanticGraph, step: TraceStep): SceneAction[] {
  const event = step.event;
  switch (event.type) {
    case 'state_init':
      return [
        {
          type: 'change_state',
          cell: event.binding,
          oldRepr: '—',
          newRepr: event.repr,
        },
      ];
    case 'state_change':
      return [
        {
          type: 'change_state',
          cell: event.binding,
          oldRepr: event.oldRepr,
          newRepr: event.newRepr,
        },
      ];
    case 'loop_advance':
      return [
        {
          type: 'advance_item',
          loop: event.loop,
          itemIndex: event.itemIndex,
        },
      ];
    case 'condition_eval':
      return [
        {
          type: 'evaluate',
          branch: event.branch,
          result: event.result,
        },
      ];
    case 'collection_append': {
      const fromNode = findIteratorForAppend(graph, step) ?? step.focus[0] ?? event.collection;
      return [
        {
          type: 'move_value',
          repr: event.valueRepr,
          fromNode,
          toNode: event.collection,
        },
      ];
    }
    case 'return_exit': {
      const port = step.focus.find((id) => id.startsWith('ret-')) ?? step.focus[0] ?? 'ret-1';
      return [{ type: 'exit_return', repr: event.repr, port }];
    }
    case 'effect_fire':
      return [{ type: 'pulse_effect', node: event.effect }];
    case 'call_enter':
    case 'bind_param':
      return [];
    default:
      return [];
  }
}

function captionForStep(graph: SemanticGraph, step: TraceStep): SceneStep['caption'] {
  const event = step.event;
  switch (event.type) {
    case 'call_enter':
      return {
        key: 'call.enter',
        params: { function: event.functionId.replace(/^fn-/, '') },
      };
    case 'bind_param':
      return { key: 'bind.param', params: { name: event.name, repr: event.repr } };
    case 'state_init':
      return {
        key: 'state.init',
        params: { name: bindingName(graph, event.binding), repr: event.repr },
      };
    case 'loop_advance':
      return { key: 'loop.advance', params: { item: event.itemRepr } };
    case 'condition_eval':
      return {
        key: 'branch.evaluate',
        params: {
          branch: event.branch,
          result: event.result ? 'true' : 'false',
        },
      };
    case 'state_change':
      return {
        key: 'state.change',
        params: {
          name: bindingName(graph, event.binding),
          old: event.oldRepr,
          new: event.newRepr,
        },
      };
    case 'collection_append':
      return {
        key: 'collection.append',
        params: {
          repr: event.valueRepr,
          collection: collectionName(graph, event.collection),
        },
      };
    case 'return_exit':
      return { key: 'return.exit', params: { repr: event.repr } };
    case 'effect_fire':
      return { key: 'effect.pulse', params: { repr: event.repr } };
    default:
      return { key: 'call.enter', params: {} };
  }
}

export function renderCaption(caption: SceneStep['caption']): string {
  const template = CAPTION_TEMPLATES[caption.key] ?? caption.key;
  return template.replace(/\{(\w+)\}/g, (_, name: string) => caption.params[name] ?? '');
}

export function buildSceneActions(graph: SemanticGraph, trace: Trace): { steps: { index: number; actions: SceneAction[] }[] } {
  return {
    steps: trace.steps.map((step) => ({
      index: step.index,
      actions: actionsForStep(graph, step),
    })),
  };
}

export function buildSceneSteps(graph: SemanticGraph, trace: Trace): SceneStep[] {
  return trace.steps.map((step) => ({
    index: step.index,
    focus: step.focus,
    line: step.line,
    actions: actionsForStep(graph, step),
    caption: captionForStep(graph, step),
  }));
}
