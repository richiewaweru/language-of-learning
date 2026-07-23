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

/** Deterministic token id: `tok-S{step}-{eventType}-{ordinal}`. */
function tokenId(step: TraceStep, eventType: string, ordinal: number): string {
  return `tok-S${step.index}-${eventType}-${ordinal}`;
}

function functionNodeId(graph: SemanticGraph): string | undefined {
  return graph.nodes.find((n) => n.kind === 'function')?.id;
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

/** Parse a Python-style list repr (`"[3, 5]"`) into element reprs. */
function parseListRepr(repr: string | undefined): string[] {
  if (repr === undefined) return [];
  const trimmed = repr.trim();
  if (!trimmed.startsWith('[') || !trimmed.endsWith(']')) return [];
  const inner = trimmed.slice(1, -1).trim();
  if (inner === '') return [];
  return inner.split(',').map((part) => part.trim());
}

/** Index of the just-appended element, derived from the trace collection snapshot. */
function appendNewIndex(graph: SemanticGraph, step: TraceStep, collectionId: string): number {
  const name = byId(graph).get(collectionId)?.name;
  const repr = name ? step.bindings[name] : undefined;
  return Math.max(0, parseListRepr(repr).length - 1);
}

function actionsForStep(graph: SemanticGraph, step: TraceStep, trace: Trace): SceneAction[] {
  const event = step.event;
  switch (event.type) {
    case 'call_enter': {
      const fnId = event.functionId;
      const params = byId(graph).get(fnId)?.params ?? [];
      const args =
        trace.scope.kind === 'function'
          ? trace.scope.argsRepr
          : (trace.call?.argsRepr ?? []);
      const count = Math.max(params.length, args.length);
      const actions: SceneAction[] = [];
      for (let i = 0; i < count; i++) {
        const repr = args[i];
        if (repr === undefined) continue;
        actions.push({
          type: 'spawn_value',
          tokenId: tokenId(step, 'call_enter', i),
          repr,
          atNode: fnId,
        });
      }
      actions.push({ type: 'focus_nodes', primary: fnId });
      return actions;
    }
    case 'bind_param': {
      const bindingNode =
        graph.nodes.find((n) => n.kind === 'binding' && n.name === event.name)?.id ??
        step.focus[0] ??
        event.name;
      return [
        {
          type: 'bind_value',
          tokenId: tokenId(step, 'bind_param', 0),
          bindingNode,
          repr: event.repr,
        },
      ];
    }
    case 'state_init':
      return [
        {
          type: 'change_state',
          cell: event.binding,
          oldRepr: '—',
          newRepr: event.repr,
          inputTokenId: tokenId(step, 'state_init', 0),
        },
      ];
    case 'state_change':
      return [
        {
          type: 'change_state',
          cell: event.binding,
          oldRepr: event.oldRepr,
          newRepr: event.newRepr,
          inputTokenId: tokenId(step, 'state_change', 0),
        },
      ];
    case 'loop_advance': {
      const collection = byId(graph).get(event.loop)?.collectionRef;
      const base = {
        type: 'advance_item' as const,
        loop: event.loop,
        itemIndex: event.itemIndex,
        itemRepr: event.itemRepr,
        tokenId: tokenId(step, 'loop_advance', 0),
      };
      return [collection ? { ...base, collection } : base];
    }
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
      const tok = tokenId(step, 'collection_append', 0);
      return [
        {
          type: 'move_value',
          repr: event.valueRepr,
          fromNode,
          toNode: event.collection,
          tokenId: tok,
        },
        {
          type: 'append_value',
          collection: event.collection,
          valueRepr: event.valueRepr,
          tokenId: tok,
          newIndex: appendNewIndex(graph, step, event.collection),
        },
      ];
    }
    case 'return_exit': {
      const port = step.focus.find((id) => id.startsWith('ret-')) ?? step.focus[0] ?? 'ret-1';
      const fnId = functionNodeId(graph);
      const base = {
        type: 'exit_return' as const,
        repr: event.repr,
        port,
        tokenId: tokenId(step, 'return_exit', 0),
        returnNode: port,
      };
      return [fnId ? { ...base, functionNode: fnId } : base];
    }
    case 'effect_fire': {
      const effectType = byId(graph).get(event.effect)?.effectType;
      return [
        {
          type: 'pulse_effect',
          node: event.effect,
          ...(effectType ? { effectType } : {}),
          repr: event.repr,
        },
      ];
    }
    default:
      return [];
  }
}

function captionForStep(graph: SemanticGraph, step: TraceStep): SceneStep['caption'] {
  const event = step.event;
  switch (event.type) {
    case 'call_enter': {
      const fn = byId(graph).get(event.functionId);
      return {
        key: 'call.enter',
        params: { function: fn?.name ?? event.functionId },
      };
    }
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

export function buildSceneActions(
  graph: SemanticGraph,
  trace: Trace,
): { steps: { index: number; actions: SceneAction[] }[] } {
  return {
    steps: trace.steps.map((step) => ({
      index: step.index,
      actions: actionsForStep(graph, step, trace),
    })),
  };
}

export function buildSceneSteps(graph: SemanticGraph, trace: Trace): SceneStep[] {
  return trace.steps.map((step) => ({
    index: step.index,
    focus: step.focus,
    line: step.line,
    actions: actionsForStep(graph, step, trace),
    caption: captionForStep(graph, step),
  }));
}
