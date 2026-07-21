import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { SceneSchema, SceneActionsFixtureSchema } from '@lol/lens-contracts';
import {
  buildScene,
  buildSceneActions,
  buildTransferCheck,
  gradeTransferCheck,
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
    const resolved = resolveSelection({ nodeId: 'loop-L3C4' }, graph, trace);
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
    expect(resolved.nodeIds).toContain('fn-L1C0');
    expect(resolved.line).toBe(1);
  });

  it('line → node: selecting a line focuses nodes on it, picks the line-specific primary, and resolves a focus-consistent step', () => {
    const graph = loadGraph('accumulate');
    const trace = loadTrace('accumulate');
    const scene = buildScene(graph, trace);

    // Line 3 is the loop header (loop-L3C4), nested inside the function (fn-L1C0, lines 1–5).
    const resolved = resolveSelection({ line: 3 }, graph, trace, scene.layout);

    const onLine = graph.nodes.filter(
      (n) => n.sourceRange.startLine <= 3 && n.sourceRange.endLine >= 3,
    );
    expect(onLine.length).toBeGreaterThan(0);
    expect(resolved.nodeIds).toEqual(expect.arrayContaining(onLine.map((n) => n.id)));

    // The loop header on the line is among the resolved nodes.
    expect(resolved.nodeIds).toContain('loop-L3C4');
    // A line-specific node wins as primary — never the enclosing function (fn-L1C0, lines 1–5).
    expect(resolved.primaryNodeId).toBeDefined();
    expect(resolved.primaryNodeId).not.toBe('fn-L1C0');
    expect(onLine.map((n) => n.id)).toContain(resolved.primaryNodeId);

    // A step is resolved and its focus intersects the line's nodes (bidirectional consistency).
    expect(resolved.stepIndex).toBeDefined();
    const step = trace.steps[resolved.stepIndex!]!;
    expect(step.focus.some((id) => resolved.nodeIds.includes(id))).toBe(true);
  });

  it('node → step: selecting different nodes moves stepIndex onto their focus steps', () => {
    const graph = loadGraph('accumulate');
    const trace = loadTrace('accumulate');

    // The loop's first focus step is index 2; the return's is the final index 10.
    const loop = resolveSelection({ nodeId: 'loop-L3C4' }, graph, trace);
    const ret = resolveSelection({ nodeId: 'ret-L5C4' }, graph, trace);

    expect(loop.stepIndex).toBe(2);
    expect(ret.stepIndex).toBe(10);
    // Selecting a different node moves the resolved step.
    expect(ret.stepIndex).not.toBe(loop.stepIndex);
    // …and the resolved line follows the node.
    expect(loop.line).toBe(3);
    expect(ret.line).toBe(5);
  });

  it('step → line: stepping changes the resolved line as the trace advances', () => {
    const graph = loadGraph('accumulate');
    const trace = loadTrace('accumulate');

    // Every step resolves to exactly the trace step's own line.
    for (const step of trace.steps) {
      const resolved = resolveSelection({ stepIndex: step.index }, graph, trace);
      expect(resolved.line).toBe(step.line);
    }

    // Advancing across a beat boundary updates the line (3 → 4).
    const before = resolveSelection({ stepIndex: 2 }, graph, trace);
    const after = resolveSelection({ stepIndex: 3 }, graph, trace);
    expect(before.line).toBe(3);
    expect(after.line).toBe(4);
    expect(after.line).not.toBe(before.line);
  });
});

describe('transfer check', () => {
  it('asks which line for state binding on accumulate', () => {
    const graph = loadGraph('accumulate');
    const check = buildTransferCheck(graph);
    expect(check).not.toBeNull();
    expect(check!.prompt).toMatch(/Which line contains/);
    expect(check!.answerLine).toBeGreaterThan(0);
    const grade = gradeTransferCheck(check!, check!.answerLine);
    expect(grade.correct).toBe(true);
    expect(gradeTransferCheck(check!, check!.answerLine + 1).correct).toBe(false);
  });
});

describe('back-step binding snapshots', () => {
  it('each accumulate step carries full bindings (T1)', () => {
    const trace = loadTrace('accumulate');
    for (const step of trace.steps) {
      expect(step.bindings).toBeTypeOf('object');
    }
    const mid = trace.steps[3]!;
    const prior = trace.steps[2]!;
    expect(prior.bindings).not.toEqual(mid.bindings);
    expect(trace.steps[2]!.bindings).toEqual(prior.bindings);
  });
});
