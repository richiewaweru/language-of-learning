import type { MotionState, RuntimeTokenState, Scene, SceneAction } from '@lol/lens-contracts';
import type { SemanticGraph, Trace } from './types.js';

/**
 * PM1 — pure `MotionState` derivation.
 *
 * `deriveMotionState(scene, graph, trace, stepIndex)` is a deterministic fold of
 * `scene.steps[].actions` over `0..stepIndex` (MC2), with the trace binding
 * snapshot overlaid for that step (T1). Given identical inputs it produces
 * byte-identical output; BACK to step *n* is a re-derivation from scratch, never
 * an inverse tween (MS3 / T1). It invents nothing not present in committed
 * contract data (MS1).
 *
 * `RuntimeTokenState.status` is the closed six-value enum in the motion
 * contract (`idle | moving | bound | consumed | returned | ghost`). The
 * action-level semantic labels used in the P-motion plan (entering / stored /
 * returning / …) map onto that enum here; see BUILD-LOG "DECISION: MotionState
 * token status mapping (PM1)".
 */

function pushUnique(list: string[], value: string): void {
  if (!list.includes(value)) list.push(value);
}

function removeAll(list: string[], values: string[]): string[] {
  return list.filter((v) => !values.includes(v));
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

export function emptyMotionState(stepIndex: number): MotionState {
  return {
    stepIndex,
    tokens: {},
    bindings: {},
    collections: {},
    branchResults: {},
    activePaths: [],
    fadedPaths: [],
    focusedNodes: [],
    ghosts: [],
  };
}

function setToken(state: MotionState, token: RuntimeTokenState): void {
  state.tokens[token.id] = token;
}

/** Apply one declarative action to a MotionState in place. */
function applyAction(state: MotionState, action: SceneAction): void {
  switch (action.type) {
    case 'spawn_value': {
      setToken(state, {
        id: action.tokenId,
        repr: action.repr,
        nodeId: action.atNode,
        visible: true,
        status: 'idle',
      });
      break;
    }
    case 'move_value': {
      if (action.tokenId) {
        const prev = state.tokens[action.tokenId];
        setToken(state, {
          id: action.tokenId,
          repr: action.repr,
          nodeId: action.toNode,
          edgeId: action.viaEdge ?? prev?.edgeId,
          visible: true,
          status: 'moving',
        });
      }
      break;
    }
    case 'bind_value': {
      setToken(state, {
        id: action.tokenId,
        repr: action.repr,
        nodeId: action.bindingNode,
        visible: true,
        status: 'bound',
      });
      state.bindings[action.bindingNode] = action.repr;
      break;
    }
    case 'advance_item': {
      pushUnique(state.focusedNodes, action.loop);
      if (action.tokenId) {
        setToken(state, {
          id: action.tokenId,
          repr: action.itemRepr ?? '',
          nodeId: action.loop,
          visible: true,
          status: 'moving',
        });
      }
      break;
    }
    case 'evaluate': {
      state.branchResults[action.branch] = action.result;
      if (action.activeEdge) {
        pushUnique(state.activePaths, action.activeEdge);
        state.fadedPaths = removeAll(state.fadedPaths, [action.activeEdge]);
      }
      if (action.inactiveEdge) pushUnique(state.fadedPaths, action.inactiveEdge);
      break;
    }
    case 'change_state': {
      const mainId = action.cell;
      setToken(state, {
        id: mainId,
        repr: action.newRepr,
        nodeId: action.cell,
        visible: true,
        status: 'bound',
      });
      state.bindings[action.cell] = action.newRepr;
      if (action.oldRepr && action.oldRepr !== '—') {
        const ghostId = `${action.cell}::ghost`;
        setToken(state, {
          id: ghostId,
          repr: action.oldRepr,
          nodeId: action.cell,
          visible: true,
          status: 'ghost',
        });
        pushUnique(state.ghosts, ghostId);
      }
      break;
    }
    case 'append_value': {
      const list = [...(state.collections[action.collection] ?? [])];
      list[action.newIndex] = action.valueRepr;
      state.collections[action.collection] = list;
      setToken(state, {
        id: action.tokenId,
        repr: action.valueRepr,
        nodeId: action.collection,
        visible: true,
        status: 'bound',
      });
      break;
    }
    case 'exit_return': {
      state.returnValue = action.repr;
      if (action.tokenId) {
        setToken(state, {
          id: action.tokenId,
          repr: action.repr,
          nodeId: action.returnNode ?? action.port,
          visible: true,
          status: 'returned',
        });
      }
      break;
    }
    case 'pulse_effect': {
      pushUnique(state.focusedNodes, action.node);
      break;
    }
    case 'focus_nodes': {
      state.focusedNodes = [action.primary, ...(action.secondary ?? [])];
      break;
    }
    case 'fade_path': {
      state.activePaths = removeAll(state.activePaths, action.edgeIds);
      for (const edgeId of action.edgeIds) pushUnique(state.fadedPaths, edgeId);
      break;
    }
    case 'restore_path': {
      state.fadedPaths = removeAll(state.fadedPaths, action.edgeIds);
      for (const edgeId of action.edgeIds) pushUnique(state.activePaths, edgeId);
      break;
    }
  }
}

/** Fold a step's actions onto a copy of `state` (pure; input is not mutated). */
export function reduceSceneActions(state: MotionState, actions: SceneAction[]): MotionState {
  const next = structuredClone(state);
  for (const action of actions) applyAction(next, action);
  return next;
}

export function deriveMotionState(
  scene: Scene,
  graph: SemanticGraph,
  trace: Trace,
  stepIndex: number,
): MotionState {
  const maxStep = Math.max(scene.steps.length - 1, 0);
  const current = Math.min(Math.max(stepIndex, 0), maxStep);

  // 1–2. Fold declarative actions over steps 0..current.
  let state = emptyMotionState(current);
  for (let i = 0; i <= current; i++) {
    const step = scene.steps[i];
    if (!step) continue;
    state = reduceSceneActions(state, step.actions as SceneAction[]);
  }

  // 3. Overlay the trace binding snapshot for this step (authoritative, T1).
  const traceStep = trace.steps[current];
  if (traceStep) {
    state.bindings = { ...traceStep.bindings };
  }

  // 4. Parse list-like binding values into collections keyed by collection node id.
  for (const node of graph.nodes) {
    if (node.kind !== 'collection') continue;
    const name = node.name;
    if (name === undefined) continue;
    const repr = state.bindings[name];
    if (repr === undefined) continue;
    state.collections[node.id] = parseListRepr(repr);
  }

  // 5. Focus from the current step unless a focus_nodes action already set it.
  const currentStep = scene.steps[current];
  if (currentStep) {
    const hasFocusAction = (currentStep.actions as SceneAction[]).some(
      (a) => a.type === 'focus_nodes',
    );
    if (!hasFocusAction) {
      state.focusedNodes = [...currentStep.focus];
    }
  }

  // 6. Return value: prefer the folded exit_return; else trace result at the final return step.
  if (state.returnValue === undefined) {
    const isLastStep = current === trace.steps.length - 1;
    if (isLastStep && trace.result) {
      state.returnValue = trace.result.repr;
    }
  }

  return state;
}
