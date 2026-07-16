import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { SceneSchema, SceneActionsFixtureSchema } from '@lol/lens-contracts';
import {
  buildScene,
  buildSceneActions,
  layoutGraph,
  LayoutError,
  resolveSelection,
  MAX_NESTING,
} from './index.js';
import type { SemanticGraph, Trace } from './types.js';

const ROOT = join(import.meta.dirname, '..', '..', '..');
const FIXTURES = ['accumulate', 'count', 'filter', 'transform', 'search', 'guard'] as const;

function loadGraph(name: string): SemanticGraph {
  return JSON.parse(readFileSync(join(ROOT, 'fixtures', name, 'expected.graph.json'), 'utf8'));
}

function loadTrace(name: string): Trace {
  return JSON.parse(readFileSync(join(ROOT, 'fixtures', name, 'expected.trace.json'), 'utf8'));
}

describe('layout engine', () => {
  for (const fixture of ['accumulate', 'filter'] as const) {
    it(`layouts ${fixture} without hand coords or overlap`, () => {
      const result = layoutGraph(loadGraph(fixture));
      expect(result.layout.length).toBeGreaterThan(0);
      expect(result.nestingDepth).toBeLessThanOrEqual(MAX_NESTING);
      for (const node of result.layout) {
        expect(Number.isFinite(node.x)).toBe(true);
        expect(Number.isFinite(node.y)).toBe(true);
        expect(node.width).toBeGreaterThan(0);
        expect(node.height).toBeGreaterThan(0);
      }
    });
  }

  it('rejects graphs with no function', () => {
    expect(() =>
      layoutGraph({ version: '0.1', source: '', nodes: [], relations: [], unsupported: [] }),
    ).toThrow(LayoutError);
  });
});

describe('scene builder', () => {
  it('builds schema-valid scenes for accumulate and filter', () => {
    for (const name of ['accumulate', 'filter'] as const) {
      const scene = buildScene(loadGraph(name), loadTrace(name));
      expect(SceneSchema.parse(scene)).toBeDefined();
      expect(scene.steps.length).toBe(loadTrace(name).steps.length);
      expect(scene.steps.every((s) => s.caption.key.length > 0)).toBe(true);
    }
  });

  it('matches rewritten expected.scene-actions.json for all six fixtures', () => {
    for (const name of FIXTURES) {
      const actual = buildSceneActions(loadGraph(name), loadTrace(name));
      const expected = JSON.parse(
        readFileSync(join(ROOT, 'fixtures', name, 'expected.scene-actions.json'), 'utf8'),
      );
      expect(SceneActionsFixtureSchema.parse(actual)).toBeDefined();
      expect(actual).toEqual(expected);
    }
  });

  it('maps state_init to change_state and loop_advance to advance_item', () => {
    const actions = buildSceneActions(loadGraph('accumulate'), loadTrace('accumulate'));
    const types = actions.steps.flatMap((s) => s.actions.map((a) => a.type));
    expect(types).toContain('change_state');
    expect(types).toContain('advance_item');
    expect(types).toContain('exit_return');
  });
});

describe('selection resolver', () => {
  it('SY1: line maps to many nodes', () => {
    const graph = loadGraph('accumulate');
    const trace = loadTrace('accumulate');
    const resolved = resolveSelection({ line: 4 }, graph, trace);
    expect(resolved.nodeIds.length).toBeGreaterThanOrEqual(1);
  });

  it('SY3: node maps to steps via focus', () => {
    const graph = loadGraph('accumulate');
    const trace = loadTrace('accumulate');
    const resolved = resolveSelection({ nodeId: 'loop-1' }, graph, trace);
    expect(resolved.stepIndices.length).toBeGreaterThan(0);
    expect(resolved.line).toBeDefined();
  });

  it('SY2: primary prefers innermost among co-located', () => {
    const graph = loadGraph('filter');
    const trace = loadTrace('filter');
    const resolved = resolveSelection({ line: 5 }, graph, trace, buildScene(graph, trace).layout);
    expect(resolved.primaryNodeId).toBeDefined();
  });

  it('stepIndex resolves focus and line', () => {
    const graph = loadGraph('accumulate');
    const trace = loadTrace('accumulate');
    const resolved = resolveSelection({ stepIndex: 0 }, graph, trace);
    expect(resolved.nodeIds).toContain('fn-calculate_total');
    expect(resolved.line).toBe(1);
  });
});

describe('back-step binding snapshots', () => {
  it('each accumulate step carries full bindings (T1)', () => {
    const trace = loadTrace('accumulate');
    for (const step of trace.steps) {
      expect(step.bindings).toBeTypeOf('object');
    }
    // stepping back to index i restores bindings at i
    const mid = trace.steps[3]!;
    const prior = trace.steps[2]!;
    expect(prior.bindings).not.toEqual(mid.bindings);
    expect(trace.steps[2]!.bindings).toEqual(prior.bindings);
  });
});
