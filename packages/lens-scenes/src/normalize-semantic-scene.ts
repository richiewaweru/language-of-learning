import {
  SEMANTIC_MODEL_VERSION,
  SYMBOL_GRAMMAR_VERSION,
  SemanticSceneSchema,
  type EntitySnapshot,
  type EvidenceConfidence,
  type NormalizedSourceRange,
  type SemanticEntity,
  type SemanticEvent,
  type SemanticEventType,
  type SemanticRole,
  type SemanticScene,
} from '@lol/lens-contracts';
import type { GraphNode, SemanticGraph, Trace, TraceEvent, TraceStep } from './types.js';

function normalizeRange(
  range: GraphNode['sourceRange'] | undefined,
  kind?: string,
): NormalizedSourceRange | undefined {
  if (!range) return undefined;
  return {
    startLine: range.startLine,
    startColumn: range.startCol,
    endLine: range.endLine,
    // Raw v0.1 kept operation/loop end columns inclusive for fixture
    // compatibility; semantic v1 uses the normal exclusive slice boundary.
    endColumn: range.endCol + (kind === 'operation' || kind === 'loop' ? 1 : 0),
  };
}

function entityRole(
  node: GraphNode,
  referenceNames: Set<string>,
  cursorNodeIds: Set<string>,
): SemanticRole {
  if (node.kind === 'value') return 'value';
  if (node.kind === 'collection') return 'collection';
  if (node.kind === 'function') return 'call-frame';
  if (node.kind === 'return') return 'result';
  if (node.kind === 'loop') return 'range';
  if (node.kind === 'binding') {
    if (node.name && referenceNames.has(node.name)) return 'reference';
    if (cursorNodeIds.has(node.id)) return 'cursor';
    if (node.role === 'state') return 'state';
    if (node.role === 'iterator') return 'cursor';
    return 'binding';
  }
  return 'generic';
}

function entityLabel(node: GraphNode): string {
  if (node.name) return node.name;
  if (node.iteratorName) return node.iteratorName;
  if (node.expr) return node.expr;
  if (node.kind === 'return') return 'result';
  if (node.kind === 'function') return 'call frame';
  return node.kind.replaceAll('-', ' ');
}

function entitiesFromGraph(graph: SemanticGraph, trace: Trace): SemanticEntity[] {
  const referenceNames = new Set<string>();
  for (const step of trace.steps) {
    const groups = new Map<string, string[]>();
    for (const [name, objectId] of Object.entries(step.objectIds ?? {})) {
      groups.set(objectId, [...(groups.get(objectId) ?? []), name]);
    }
    for (const names of groups.values()) {
      if (names.length > 1) names.forEach((name) => referenceNames.add(name));
    }
  }
  const cursorNodeIds = new Set(
    graph.nodes
      .filter((node) => node.kind === 'binding' && node.role === 'iterator')
      .map((node) => node.id),
  );
  for (const loop of graph.nodes.filter((node) => node.kind === 'loop')) {
    const condition = graph.nodes.find((node) => node.id === loop.collectionRef);
    if (condition?.kind === 'operation') {
      graph.relations
        .filter((relation) => relation.from === condition.id && relation.type === 'reads')
        .forEach((relation) => cursorNodeIds.add(relation.to));
    }
  }
  for (const selection of graph.nodes.filter(
    (node) => node.kind === 'operation' && node.expr?.includes('['),
  )) {
    graph.relations
      .filter((relation) => relation.from === selection.id && relation.type === 'reads')
      .forEach((relation) => cursorNodeIds.add(relation.to));
  }
  const entities: SemanticEntity[] = graph.nodes.map((node) => ({
    id: node.id,
    role: entityRole(node, referenceNames, cursorNodeIds),
    label: entityLabel(node),
    sourceNodeId: node.id,
    sourceRange: normalizeRange(node.sourceRange, node.kind),
    confidence: 'verified',
    properties: {
      semanticKind: node.kind,
      ...(node.role ? { bindingRole: node.role } : {}),
      ...(node.expr ? { expression: node.expr } : {}),
      ...(node.mutationType ? { mutationType: node.mutationType } : {}),
      ...(node.controlFlow ? { controlFlow: node.controlFlow, loopRef: node.loopRef } : {}),
    },
  }));

  graph.unsupported.forEach((region, index) => {
    const candidate = region as {
      sourceRange?: GraphNode['sourceRange'];
      construct?: string;
      message?: string;
    };
    entities.push({
      id: 'unsupported-' + index,
      role: 'unsupported',
      label: candidate.construct ?? 'unsupported',
      sourceRange: normalizeRange(candidate.sourceRange),
      confidence: 'unsupported',
      properties: {
        construct: candidate.construct ?? 'unknown',
        message: candidate.message ?? 'This behavior is not supported.',
      },
    });
  });
  return entities;
}

function eventType(event: TraceEvent): SemanticEventType {
  switch (event.type) {
    case 'call_enter':
      return 'call';
    case 'bind_param':
    case 'state_init':
      return 'bind';
    case 'loop_advance':
      return 'select';
    case 'condition_eval':
      return 'compare';
    case 'state_change':
      return 'update';
    case 'collection_append':
      return 'insert';
    case 'indexed_selection':
      return 'select';
    case 'indexed_mutation':
      return 'update';
    case 'supported_call':
      return 'call';
    case 'loop_test':
      return 'repeat';
    case 'loop-exit':
      return 'exit';
    case 'loop-skip':
      return 'skip';
    case 'effect_fire':
      return 'effect';
    case 'unsupported':
      return 'unsupported';
    case 'return_exit':
      return 'return';
  }
}

function eventPayload(event: TraceEvent, step: TraceStep): Record<string, unknown> {
  switch (event.type) {
    case 'call_enter':
      return { functionId: event.functionId };
    case 'bind_param':
      return { name: event.name, value: event.repr, writes: [event.name] };
    case 'state_init':
      return { binding: event.binding, value: event.repr, writes: [event.binding] };
    case 'loop_advance':
      return {
        loop: event.loop,
        itemIndex: event.itemIndex,
        itemValue: event.itemRepr,
        values: step.bindings,
      };
    case 'condition_eval':
      return { branch: event.branch, result: event.result, values: step.bindings };
    case 'state_change':
      return {
        binding: event.binding,
        previousValue: event.oldRepr,
        value: event.newRepr,
        reads: step.bindings,
        writes: [event.binding],
      };
    case 'collection_append':
      return { collection: event.collection, value: event.valueRepr, writes: [event.collection] };
    case 'indexed_selection':
      return {
        collection: event.collection,
        index: event.indexRepr,
        value: event.valueRepr,
        reads: [event.collection],
      };
    case 'indexed_mutation':
      return {
        collection: event.collection,
        index: event.indexRepr,
        previousValue: event.oldRepr,
        value: event.newRepr,
        writes: [event.collection],
      };
    case 'supported_call':
      return { callee: event.callee, args: event.argsRepr, value: event.resultRepr };
    case 'loop_test':
      return { loop: event.loop, iteration: event.iteration, result: event.result };
    case 'loop-exit':
    case 'loop-skip':
      return { loop: event.loopId, reason: event.reason, iteration: event.iteration };
    case 'effect_fire':
      return { effect: event.effect, value: event.repr };
    case 'unsupported':
      return { construct: event.construct, message: event.message };
    case 'return_exit':
      return { value: event.repr };
  }
}

function findEntityId(
  graph: SemanticGraph,
  reference: string | undefined,
): string | undefined {
  if (!reference) return undefined;
  if (graph.nodes.some((node) => node.id === reference)) return reference;
  return graph.nodes.find((node) => node.name === reference)?.id;
}

function activeEntityIds(graph: SemanticGraph, step: TraceStep): string[] {
  const ids = [...step.focus].filter((id) => graph.nodes.some((node) => node.id === id));
  const add = (value: string | undefined) => {
    const id = findEntityId(graph, value);
    if (id && !ids.includes(id)) ids.push(id);
  };

  const event = step.event;
  if (event.type === 'call_enter') add(event.functionId);
  if (event.type === 'state_init' || event.type === 'state_change') add(event.binding);
  if (event.type === 'loop_advance') {
    add(event.loop);
    add(graph.nodes.find((node) => node.kind === 'binding' && node.role === 'iterator')?.id);
  }
  if (event.type === 'condition_eval') add(event.branch);
  if (event.type === 'collection_append') add(event.collection);
  if (event.type === 'indexed_selection' || event.type === 'indexed_mutation') add(event.collection);
  if (event.type === 'loop_test') add(event.loop);
  if (event.type === 'loop-exit' || event.type === 'loop-skip') add(event.loopId);
  if (event.type === 'unsupported') {
    const regionIndex = graph.unsupported.findIndex((region) => {
      const candidate = region as { construct?: string };
      return candidate.construct === event.construct;
    });
    if (graph.unsupported.length > 0) {
      ids.push('unsupported-' + (regionIndex >= 0 ? regionIndex : 0));
    }
  }
  if (event.type === 'return_exit') add(graph.nodes.find((node) => node.kind === 'return')?.id);
  return ids;
}

function valueForEntity(
  entity: SemanticEntity,
  graph: SemanticGraph,
  step: TraceStep | undefined,
): unknown {
  if (!step) return undefined;
  const node = graph.nodes.find((candidate) => candidate.id === entity.sourceNodeId);
  if (!node) return undefined;
  if (node.kind === 'binding' && node.name) return step.bindings[node.name];
  if (node.kind === 'collection' && node.name) return step.bindings[node.name];
  if (node.kind === 'value') return node.repr;
  if (node.kind === 'operation') return node.expr;
  if (node.kind === 'return' && step.event.type === 'return_exit') return step.event.repr;
  return undefined;
}

function statusFor(
  entity: SemanticEntity,
  step: TraceStep,
  activeIds: string[],
): EntitySnapshot['status'] {
  if (entity.role === 'unsupported') return 'unsupported';
  const event = step.event;
  if (
    event.type === 'state_change' &&
    (event.binding === entity.id || event.binding === entity.label)
  ) {
    return 'changing';
  }
  if (event.type === 'loop_advance' && entity.role === 'cursor') return 'selected';
  if (event.type === 'return_exit' && entity.role === 'result') return 'completed';
  if (activeIds.includes(entity.id)) return 'active';
  return 'idle';
}

function snapshotsForStep(
  entities: SemanticEntity[],
  graph: SemanticGraph,
  trace: Trace,
  step: TraceStep,
  activeIds: string[],
): EntitySnapshot[] {
  const previous = trace.steps[step.index - 1];
  return entities.map((entity) => {
    const value = valueForEntity(entity, graph, step);
    const previousValue = valueForEntity(entity, graph, previous);
    const objectId = entity.label ? step.objectIds?.[entity.label] : undefined;
    return {
      entityId: entity.id,
      ...(value !== undefined ? { value } : {}),
      ...(previousValue !== undefined ? { previousValue } : {}),
      status: statusFor(entity, step, activeIds),
      properties: {
        frameId: step.frameId ?? 'frame-root',
        ...(objectId ? { objectId } : {}),
      },
    };
  });
}

function scalarVariables(payload: Record<string, unknown>): Record<string, string | number | boolean> {
  const variables: Record<string, string | number | boolean> = {};
  for (const [key, value] of Object.entries(payload)) {
    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
      variables[key] = value;
    }
  }
  return variables;
}

function confidenceFor(type: SemanticEventType): EvidenceConfidence {
  if (type === 'generic') return 'generic';
  if (type === 'unsupported') return 'unsupported';
  return 'verified';
}

export function normalizeSemanticScene(
  graph: SemanticGraph,
  trace: Trace,
  options: { sceneId?: string } = {},
): SemanticScene {
  const entities = entitiesFromGraph(graph, trace);
  const nodeRanges = new Map(
    entities.map((entity) => [entity.id, entity.sourceRange]),
  );
  const steps = trace.steps.map((step) => {
    const activeIds = activeEntityIds(graph, step);
    const type = eventType(step.event);
    const sourceRange = activeIds.map((id) => nodeRanges.get(id)).find(Boolean);
    const payload = eventPayload(step.event, step);
    const activeEvent: SemanticEvent = {
      id: 'event-' + step.index + '-' + type,
      type,
      entityIds: activeIds,
      ...(sourceRange ? { sourceRange } : {}),
      stepIndex: step.index,
      confidence: confidenceFor(type),
      payload,
    };
    return {
      index: step.index,
      ...(sourceRange ? { activeSourceRange: sourceRange } : {}),
      activeEntityIds: activeIds,
      activeEvent,
      snapshots: snapshotsForStep(entities, graph, trace, step, activeIds),
      caption: { key: 'event.' + type, variables: scalarVariables(payload) },
    };
  });

  return SemanticSceneSchema.parse({
    id: options.sceneId ?? 'semantic-' + trace.call.functionId,
    graphRef: graph.version,
    semanticModelVersion: SEMANTIC_MODEL_VERSION,
    grammarVersion: SYMBOL_GRAMMAR_VERSION,
    entities,
    steps,
  });
}
