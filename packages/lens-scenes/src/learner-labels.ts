import type { SceneStep } from '@lol/lens-contracts';
import type { SemanticGraph, Trace, TraceStep } from './types.js';
import { renderCaption } from './scene-builder.js';

function byId(graph: SemanticGraph): Map<string, { kind: string; name?: string; role?: string }> {
  return new Map(graph.nodes.map((n) => [n.id, n]));
}

function stateBinding(graph: SemanticGraph): string | undefined {
  return graph.nodes.find((n) => n.kind === 'binding' && n.role === 'state')?.name;
}

function iteratorBinding(graph: SemanticGraph): string | undefined {
  return graph.nodes.find((n) => n.kind === 'binding' && n.role === 'iterator')?.name;
}

function functionName(graph: SemanticGraph, step: TraceStep): string {
  if (step.event.type === 'call_enter') {
    const fn = byId(graph).get(step.event.functionId);
    return fn?.name ?? 'the function';
  }
  const fn = graph.nodes.find((n) => n.kind === 'function');
  return fn?.name ?? 'the function';
}

/** Learner-facing progress label for a trace step. */
export function deriveStepLabel(graph: SemanticGraph, step: TraceStep, trace: Trace): string {
  const event = step.event;
  const stateName = stateBinding(graph) ?? 'state';
  const itemName = iteratorBinding(graph) ?? 'item';

  switch (event.type) {
    case 'call_enter':
      return 'Starting the function';
    case 'bind_param':
      return 'Receiving the input';
    case 'state_init':
      return `Creating the running ${stateName}`;
    case 'loop_advance': {
      const priorAdvances = trace.steps
        .filter((s) => s.index < step.index && s.event.type === 'loop_advance')
        .length;
      return priorAdvances === 0 ? `Taking the first ${itemName}` : `Taking the next ${itemName}`;
    }
    case 'state_change':
      return `Updating the ${stateName}`;
    case 'condition_eval':
      return 'Checking the condition';
    case 'collection_append':
      return 'Adding to the collection';
    case 'return_exit':
      return 'Returning the result';
    case 'effect_fire':
      return 'Running an effect';
    default:
      return 'Next step';
  }
}

/** Learner-facing explanation using exact trace values. */
export function deriveLearnerCaption(
  graph: SemanticGraph,
  step: TraceStep,
  _trace: Trace,
  sceneStep?: SceneStep,
): string {
  const event = step.event;
  const stateName = stateBinding(graph) ?? 'total';
  const itemName = iteratorBinding(graph) ?? 'number';
  const bindings = step.bindings;

  switch (event.type) {
    case 'call_enter':
      return `The program enters ${functionName(graph, step)}.`;
    case 'bind_param':
      return `The parameter ${event.name} receives the value ${event.repr}.`;
    case 'state_init':
      return `The running ${stateName} starts at ${event.repr}.`;
    case 'loop_advance':
      return `The current ${itemName} is ${event.itemRepr}. The ${stateName} is still ${bindings[stateName] ?? 'unchanged'}.`;
    case 'state_change':
      return `The current ${itemName} is ${bindings[itemName] ?? '?'}. Add it to the running ${stateName} of ${event.oldRepr}. The new ${stateName} is ${event.newRepr}.`;
    case 'condition_eval':
      return `The condition evaluates to ${event.result ? 'true' : 'false'}.`;
    case 'collection_append':
      return `Keep ${event.valueRepr} in the collection.`;
    case 'return_exit':
      return `The function returns ${event.repr}.`;
    case 'effect_fire':
      return `An effect runs: ${event.repr}.`;
    default:
      return sceneStep ? renderCaption(sceneStep.caption) : 'Execution continues.';
  }
}
