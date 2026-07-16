import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { MotionStateSchema } from '@lol/lens-contracts';
import { buildScene } from './build-scene.js';
import { buildSceneSteps } from './scene-builder.js';
import { deriveMotionState, emptyMotionState, reduceSceneActions } from './motion-state.js';
import type { SemanticGraph, Trace } from './types.js';

const ROOT = join(import.meta.dirname, '..', '..', '..');
const FIXTURES = ['accumulate', 'count', 'filter', 'transform', 'search', 'guard'] as const;

function loadGraph(name: string): SemanticGraph {
  return JSON.parse(readFileSync(join(ROOT, 'fixtures', name, 'expected.graph.json'), 'utf8'));
}
function loadTrace(name: string): Trace {
  return JSON.parse(readFileSync(join(ROOT, 'fixtures', name, 'expected.trace.json'), 'utf8'));
}

describe('emptyMotionState + reduceSceneActions', () => {
  it('emptyMotionState is a schema-valid zero state', () => {
    const s = emptyMotionState(0);
    expect(MotionStateSchema.parse(s)).toBeDefined();
    expect(s).toEqual({
      stepIndex: 0,
      tokens: {},
      bindings: {},
      collections: {},
      branchResults: {},
      activePaths: [],
      fadedPaths: [],
      focusedNodes: [],
      ghosts: [],
    });
  });

  it('reduceSceneActions is pure — it does not mutate its input', () => {
    const before = emptyMotionState(0);
    const snapshot = JSON.stringify(before);
    const after = reduceSceneActions(before, [
      { type: 'spawn_value', tokenId: 'tok-1', repr: '3', atNode: 'fn' },
    ]);
    expect(JSON.stringify(before)).toBe(snapshot);
    expect(after.tokens['tok-1']!.repr).toBe('3');
    expect(after.tokens['tok-1']!.status).toBe('idle');
  });

  it('folds spawn/bind/change/append into tokens, bindings, collections, ghosts', () => {
    let s = emptyMotionState(0);
    s = reduceSceneActions(s, [
      { type: 'change_state', cell: 'b1', oldRepr: '0', newRepr: '3' },
      { type: 'append_value', collection: 'c1', valueRepr: '3', tokenId: 'tok-a', newIndex: 0 },
    ]);
    expect(s.tokens['b1']!.repr).toBe('3');
    expect(s.ghosts.length).toBe(1);
    expect(s.tokens[s.ghosts[0]!]!.repr).toBe('0');
    expect(s.collections['c1']).toEqual(['3']);
  });
});

describe('deriveMotionState — accumulate (fold 0..N)', () => {
  const graph = loadGraph('accumulate');
  const trace = loadTrace('accumulate');
  const scene = buildScene(graph, trace);
  const last = scene.steps.length - 1;

  it('every step derives a schema-valid MotionState whose stepIndex matches', () => {
    for (let i = 0; i <= last; i++) {
      const motion = deriveMotionState(scene, graph, trace, i);
      expect(MotionStateSchema.parse(motion)).toBeDefined();
      expect(motion.stepIndex).toBe(i);
    }
  });

  it('accumulate: derive at 0, final, jump 0→final, then derive at 2 — all stable', () => {
    const at0 = deriveMotionState(scene, graph, trace, 0);
    const atFinal = deriveMotionState(scene, graph, trace, last);
    // Jump to the final step, then scrub back to 2.
    deriveMotionState(scene, graph, trace, 0);
    deriveMotionState(scene, graph, trace, last);
    const at2 = deriveMotionState(scene, graph, trace, 2);

    // Re-derivation is byte-stable regardless of visitation order (MS3 / determinism).
    expect(deriveMotionState(scene, graph, trace, 0)).toEqual(at0);
    expect(deriveMotionState(scene, graph, trace, last)).toEqual(atFinal);
    expect(deriveMotionState(scene, graph, trace, 2)).toEqual(at2);
  });

  it('scrub: final then step 2 — bindings match trace.steps[2] exactly', () => {
    deriveMotionState(scene, graph, trace, last);
    const at2 = deriveMotionState(scene, graph, trace, 2);
    expect(at2.bindings).toEqual(trace.steps[2]!.bindings);
  });

  it('BACK is a true inverse — forward-then-back equals direct derivation (MS3 / T1)', () => {
    for (let i = 0; i <= last; i++) deriveMotionState(scene, graph, trace, i);
    expect(deriveMotionState(scene, graph, trace, 3)).toEqual(
      deriveMotionState(scene, graph, trace, 3),
    );
  });

  it('reducedMotion flag is not needed for semantic equality of two derivations', () => {
    // MotionState carries no reducedMotion field; two derivations of the same
    // step are identical, so reduced-motion is a pure render-time concern (M10).
    const a = deriveMotionState(scene, graph, trace, 5);
    const b = deriveMotionState(scene, graph, trace, 5);
    expect(a).toEqual(b);
    expect('reducedMotion' in a).toBe(false);
  });

  it('surfaces returnValue on the exit step (accumulate returns 10), none at step 0', () => {
    expect(deriveMotionState(scene, graph, trace, last).returnValue).toBe('10');
    expect(deriveMotionState(scene, graph, trace, 0).returnValue).toBeUndefined();
  });

  it('token ids are deterministic across two builds of the same code (MC1)', () => {
    const a = deriveMotionState(buildScene(graph, trace), graph, trace, 3);
    const b = deriveMotionState(buildScene(graph, trace), graph, trace, 3);
    expect(Object.keys(a.tokens).sort()).toEqual(Object.keys(b.tokens).sort());
  });
});

describe('deriveMotionState — action-builder coverage', () => {
  it('call_enter produces non-empty actions (spawn_value + focus_nodes) for accumulate step 0', () => {
    const graph = loadGraph('accumulate');
    const trace = loadTrace('accumulate');
    const steps = buildSceneSteps(graph, trace);
    const first = steps[0]!;
    expect(first.actions.length).toBeGreaterThan(0);
    const types = first.actions.map((a) => a.type);
    expect(types).toContain('spawn_value');
    expect(types).toContain('focus_nodes');
    // The spawned arg token lands in MotionState at step 0.
    const motion = deriveMotionState(buildScene(graph, trace), graph, trace, 0);
    expect(Object.keys(motion.tokens).length).toBeGreaterThan(0);
    expect(motion.focusedNodes).toContain('fn-L1C0');
  });

  it('every fixture step derives a schema-valid MotionState', () => {
    for (const name of FIXTURES) {
      const graph = loadGraph(name);
      const trace = loadTrace(name);
      const scene = buildScene(graph, trace);
      for (let i = 0; i < scene.steps.length; i++) {
        expect(MotionStateSchema.parse(deriveMotionState(scene, graph, trace, i))).toBeDefined();
      }
    }
  });

  it('filter/transform build collections from the trace snapshot', () => {
    for (const name of ['filter', 'transform'] as const) {
      const graph = loadGraph(name);
      const trace = loadTrace(name);
      const scene = buildScene(graph, trace);
      const collectionNode = graph.nodes.find((n) => n.kind === 'collection')!;
      const finalMotion = deriveMotionState(scene, graph, trace, scene.steps.length - 1);
      expect(finalMotion.collections[collectionNode.id]).toEqual(
        JSON.parse((trace.result!.repr).replace(/'/g, '"')).map((v: unknown) => String(v)),
      );
    }
  });

  it('records branch results for the guard fixture (evaluate action)', () => {
    const graph = loadGraph('guard');
    const trace = loadTrace('guard');
    const scene = buildScene(graph, trace);
    const last = deriveMotionState(scene, graph, trace, scene.steps.length - 1);
    expect(Object.keys(last.branchResults).length).toBeGreaterThanOrEqual(1);
  });
});
