import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { SemanticSceneSchema } from '@lol/lens-contracts';
import { normalizeSemanticScene } from './normalize-semantic-scene.js';
import type { SemanticGraph, Trace } from './types.js';

const ROOT = join(import.meta.dirname, '..', '..', '..');

function load(name: string): { graph: SemanticGraph; trace: Trace } {
  const base = join(ROOT, 'fixtures', name);
  return {
    graph: JSON.parse(readFileSync(join(base, 'expected.graph.json'), 'utf8')) as SemanticGraph,
    trace: JSON.parse(readFileSync(join(base, 'expected.trace.json'), 'utf8')) as Trace,
  };
}

describe('semantic v1 normalization', () => {
  it('produces a deterministic, reference-valid accumulation scene', () => {
    const { graph, trace } = load('accumulate');
    const first = normalizeSemanticScene(graph, trace);
    const second = normalizeSemanticScene(graph, trace);
    expect(SemanticSceneSchema.parse(first)).toEqual(first);
    expect(JSON.stringify(first)).toBe(JSON.stringify(second));
    expect(first.semanticModelVersion).toBe('1.0.0');
    expect(first.grammarVersion).toBe('1.0.0');
    expect(first.steps.map((step) => step.index)).toEqual(
      first.steps.map((_, index) => index),
    );
  });

  it('derives exact previous/current state and does not reveal a result early', () => {
    const { graph, trace } = load('accumulate');
    const scene = normalizeSemanticScene(graph, trace);
    const state = scene.entities.find((entity) => entity.role === 'state');
    const result = scene.entities.find((entity) => entity.role === 'result');
    expect(state).toBeDefined();
    expect(result).toBeDefined();

    const update = scene.steps.find((step) => step.activeEvent.type === 'update');
    const stateSnapshot = update?.snapshots.find((snapshot) => snapshot.entityId === state?.id);
    expect(stateSnapshot).toMatchObject({
      previousValue: '0',
      value: '2',
      status: 'changing',
    });
    for (const step of scene.steps.slice(0, -1)) {
      expect(step.snapshots.find((snapshot) => snapshot.entityId === result?.id)?.value).toBeUndefined();
    }
    expect(scene.steps.at(-1)?.activeEvent.type).toBe('return');
  });

  it.each(['count', 'filter', 'transform', 'search', 'guard'])(
    'normalizes the existing %s fixture without raw-contract changes',
    (name) => {
      const { graph, trace } = load(name);
      expect(() => normalizeSemanticScene(graph, trace)).not.toThrow();
    },
  );

  it('normalizes indexed facts and an honest unsupported event', () => {
    const graph: SemanticGraph = {
      version: '0.1',
      source: 'def f(values): return values[0]',
      nodes: [
        { id: 'f1', kind: 'function', name: 'f', params: ['b1'], sourceRange: range(1, 0, 1, 31) },
        { id: 'b1', kind: 'binding', name: 'values', role: 'parameter', sourceRange: range(1, 6, 1, 12) },
        { id: 'o1', kind: 'operation', expr: 'values[0]', sourceRange: range(1, 22, 1, 30) },
      ],
      relations: [{ from: 'o1', type: 'reads', to: 'b1' }],
      unsupported: [
        { construct: 'recursion', message: 'Deferred in v1.', sourceRange: range(1, 0, 1, 31) },
      ],
    };
    const trace: Trace = {
      call: { functionId: 'f1', argsRepr: ['[3]'] },
      steps: [
        {
          index: 0,
          line: 1,
          focus: ['o1'],
          bindings: { values: '[3]' },
          event: { type: 'indexed_selection', collection: 'b1', indexRepr: '0', valueRepr: '3' },
        },
        {
          index: 1,
          line: 1,
          focus: [],
          bindings: { values: '[3]' },
          event: { type: 'unsupported', construct: 'recursion', message: 'Deferred in v1.' },
        },
      ],
      truncated: false,
    };
    const scene = normalizeSemanticScene(graph, trace);
    expect(scene.steps[0].activeEvent.type).toBe('select');
    expect(scene.steps[0].activeSourceRange?.endColumn).toBe(31);
    expect(scene.steps[1].activeEvent).toMatchObject({
      type: 'unsupported',
      confidence: 'unsupported',
      entityIds: ['unsupported-0'],
    });
    expect(scene.steps[1].activeSourceRange).toBeDefined();
  });
});

function range(startLine: number, startCol: number, endLine: number, endCol: number) {
  return { startLine, startCol, endLine, endCol };
}
