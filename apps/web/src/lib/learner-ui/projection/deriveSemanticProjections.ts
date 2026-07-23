import type { NormalizedSceneStep, SemanticEntity, SemanticScene } from '@lol/lens-contracts';

export type FlowProjection = {
  collection: { label: string; items: string[] };
  cursor: { label: string; value?: string; index?: number; active: boolean };
  work: {
    label: string;
    expression: string;
    inputs: { label: string; value?: string }[];
    active: boolean;
  };
  state: {
    label: string;
    value?: string;
    previousValue?: string;
    changing: boolean;
  };
  result: { value?: string; visible: boolean; active: boolean };
  scopeKind: 'module' | 'function';
  eventType: NormalizedSceneStep['activeEvent']['type'];
};

function snapshotValue(
  step: NormalizedSceneStep,
  entity: SemanticEntity | undefined,
): string | undefined {
  if (!entity) return undefined;
  const value = step.snapshots.find((snapshot) => snapshot.entityId === entity.id)?.value;
  return value === undefined ? undefined : String(value);
}

function previousSnapshotValue(
  step: NormalizedSceneStep,
  entity: SemanticEntity | undefined,
): string | undefined {
  if (!entity) return undefined;
  const value = step.snapshots.find((snapshot) => snapshot.entityId === entity.id)?.previousValue;
  return value === undefined ? undefined : String(value);
}

function listItems(repr: string | undefined): string[] {
  if (!repr?.startsWith('[') || !repr.endsWith(']')) return [];
  return repr
    .slice(1, -1)
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

export function deriveFlowProjection(
  scene: SemanticScene,
  stepIndex: number,
): FlowProjection {
  const step = scene.steps[stepIndex] ?? scene.steps[0];
  if (!step) throw new Error('Cannot derive Flow without a semantic step');

  const scopeKind = scene.entities.some(
    (entity) =>
      entity.role === 'call-frame' &&
      entity.properties.semanticKind === 'module',
  )
    ? 'module'
    : 'function';
  const writtenEntityId =
    typeof step.activeEvent.payload.binding === 'string'
      ? step.activeEvent.payload.binding
      : undefined;
  const state =
    scene.entities.find((entity) => entity.id === writtenEntityId) ??
    scene.entities.find((entity) => entity.role === 'state');
  const cursor = scene.entities.find((entity) => entity.role === 'cursor');
  const result = scene.entities.find((entity) => entity.role === 'result');
  const operation = scene.entities.find(
    (entity) =>
      step.activeEntityIds.includes(entity.id) &&
      entity.properties.semanticKind === 'operation',
  );
  const explicitCollection = scene.entities.find((entity) => entity.role === 'collection');
  const listBinding = scene.entities.find((entity) => {
    if (entity.role !== 'binding') return false;
    return listItems(snapshotValue(step, entity)).length > 0;
  });
  const collection = explicitCollection ?? listBinding;
  const event = step.activeEvent;

  const latestSelection = [...scene.steps]
    .slice(0, stepIndex + 1)
    .reverse()
    .find((candidate) => candidate.activeEvent.type === 'select')?.activeEvent;
  const cursorEvent = event.type === 'select' ? event : latestSelection;
  const itemIndex =
    typeof cursorEvent?.payload.itemIndex === 'number' ? cursorEvent.payload.itemIndex : undefined;
  const itemValue =
    typeof cursorEvent?.payload.itemValue === 'string'
      ? cursorEvent.payload.itemValue
      : snapshotValue(step, cursor);
  const resultValue = snapshotValue(step, result);
  const expression =
    typeof operation?.properties.expression === 'string'
      ? operation.properties.expression
      : step.activeEvent.type === 'bind'
        ? 'assign the value'
        : 'supported operation';
  const expressionInputs = scene.entities
    .filter(
      (entity) =>
        ['binding', 'state', 'reference', 'cursor'].includes(entity.role) &&
        expression.includes(entity.label),
    )
    .map((entity) => ({
      label: entity.label,
      value: snapshotValue(step, entity),
    }));
  for (const literal of expression.match(/(?<![\w.])\d+(?:\.\d+)?/g) ?? []) {
    if (!expressionInputs.some((input) => input.label === literal)) {
      expressionInputs.push({ label: literal, value: literal });
    }
  }

  return {
    collection: {
      label: collection?.label ?? 'Input collection',
      items: listItems(snapshotValue(step, collection)),
    },
    cursor: {
      label: cursor?.label ?? 'Current item',
      ...(itemValue ? { value: itemValue } : {}),
      ...(itemIndex !== undefined ? { index: itemIndex } : {}),
      active: event.type === 'select' || event.type === 'update',
    },
    work: {
      label: 'Operation',
      expression,
      inputs: expressionInputs,
      active:
        event.type === 'bind' ||
        event.type === 'calculate' ||
        event.type === 'update',
    },
    state: {
      label:
        state?.label
          ? scopeKind === 'module'
            ? state.label
            : 'Running ' + state.label
          : 'State',
      value: snapshotValue(step, state),
      previousValue: previousSnapshotValue(step, state),
      changing: event.type === 'update',
    },
    result: {
      ...(resultValue !== undefined ? { value: resultValue } : {}),
      visible: event.type === 'return' && resultValue !== undefined,
      active: event.type === 'return',
    },
    scopeKind,
    eventType: event.type,
  };
}

export function semanticEventHeadline(step: NormalizedSceneStep, total: number): string {
  const labels: Record<string, string> = {
    bind: 'Bind a value',
    read: 'Read a value',
    select: 'Select the current item',
    move: 'Move a value',
    calculate: 'Calculate a result',
    compare: 'Compare values',
    branch: 'Choose a branch',
    repeat: 'Repeat the loop',
    update: 'Update state',
    insert: 'Insert a value',
    remove: 'Remove a value',
    swap: 'Swap values',
    call: 'Enter a call frame',
    return: 'Return the result',
    effect: 'Run an external effect',
    generic: 'Run a supported operation',
    unsupported: 'Unsupported behavior',
  };
  return 'Step ' + (step.index + 1) + ' of ' + total + ' — ' + (labels[step.activeEvent.type] ?? 'Execution step');
}
