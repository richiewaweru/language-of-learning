import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { LayoutEdgeSchema, SceneActionSchema, SceneSchema } from './scene.js';
import { MotionStateSchema } from './motion.js';

const fixturesDir = join(import.meta.dirname, '..', 'fixtures', 'motion-actions');
const validDir = join(fixturesDir, 'valid');
const invalidDir = join(fixturesDir, 'invalid');

function loadJson(path: string): unknown {
  return JSON.parse(readFileSync(path, 'utf8'));
}

describe('motion scene actions', () => {
  const validFiles = readdirSync(validDir).filter((f) => f.endsWith('.json'));
  const invalidFiles = readdirSync(invalidDir).filter((f) => f.endsWith('.json'));

  it('discovers all twelve valid action fixtures', () => {
    expect(validFiles.sort()).toEqual(
      [
        'advance_item.json',
        'append_value.json',
        'bind_value.json',
        'change_state.json',
        'evaluate.json',
        'exit_return.json',
        'fade_path.json',
        'focus_nodes.json',
        'move_value.json',
        'pulse_effect.json',
        'restore_path.json',
        'spawn_value.json',
      ].sort(),
    );
  });

  for (const file of validFiles) {
    it(`valid fixture ${file} parses with SceneActionSchema`, () => {
      const action = loadJson(join(validDir, file));
      const result = SceneActionSchema.safeParse(action);
      expect(result.success, JSON.stringify(result, null, 2)).toBe(true);
    });
  }

  for (const file of invalidFiles) {
    it(`invalid fixture ${file} fails SceneActionSchema parse`, () => {
      const action = loadJson(join(invalidDir, file));
      expect(SceneActionSchema.safeParse(action).success).toBe(false);
    });
  }
});

describe('backward-compatible scene actions', () => {
  it('old move_value without tokenId still parses', () => {
    expect(
      SceneActionSchema.safeParse({
        type: 'move_value',
        repr: '3',
        fromNode: 'a',
        toNode: 'b',
      }).success,
    ).toBe(true);
  });

  it('old change_state without inputTokenId still parses', () => {
    expect(
      SceneActionSchema.safeParse({
        type: 'change_state',
        cell: 'b1',
        oldRepr: '0',
        newRepr: '3',
      }).success,
    ).toBe(true);
  });

  it('old exit_return without extra fields still parses', () => {
    expect(
      SceneActionSchema.safeParse({
        type: 'exit_return',
        repr: '10',
        port: 'ret-1',
      }).success,
    ).toBe(true);
  });
});

describe('LayoutEdgeSchema', () => {
  it('accepts an edge with SVG path data', () => {
    expect(
      LayoutEdgeSchema.safeParse({
        id: 'edge-1',
        fromNode: 'a',
        toNode: 'b',
        kind: 'data',
        path: { d: 'M0 0 L10 10' },
      }).success,
    ).toBe(true);
  });

  it('accepts an edge with straight-line coordinates', () => {
    expect(
      LayoutEdgeSchema.safeParse({
        id: 'edge-2',
        fromNode: 'a',
        toNode: 'b',
        kind: 'true_path',
        path: { x1: 0, y1: 0, x2: 10, y2: 10 },
      }).success,
    ).toBe(true);
  });

  it('rejects an unknown edge kind', () => {
    expect(
      LayoutEdgeSchema.safeParse({
        id: 'edge-3',
        fromNode: 'a',
        toNode: 'b',
        kind: 'sideways',
        path: { d: 'M0 0' },
      }).success,
    ).toBe(false);
  });
});

describe('MotionStateSchema', () => {
  it('accepts a sample motion state', () => {
    const sample = {
      stepIndex: 3,
      tokens: {
        'tok-1': {
          id: 'tok-1',
          repr: '3',
          nodeId: 'bind-L2C4',
          visible: true,
          status: 'bound',
        },
      },
      bindings: { 'bind-L2C4': '3' },
      collections: { 'col-L1C4': ['1', '2', '3'] },
      branchResults: { 'branch-L4C4': true },
      activePaths: ['edge-true'],
      fadedPaths: ['edge-false'],
      focusedNodes: ['loop-L3C4'],
      ghosts: ['tok-0'],
      returnValue: '10',
    };
    expect(MotionStateSchema.parse(sample)).toEqual(sample);
  });
});

describe('SceneSchema with motion', () => {
  it('parses a scene with motionVersion 0.2 and edges', () => {
    const scene = {
      id: 'scene-1',
      graphRef: 'g1',
      motionVersion: '0.2',
      layout: [{ id: 'b1', kind: 'binding', x: 0, y: 0, width: 100, height: 40 }],
      edges: [
        {
          id: 'edge-1',
          fromNode: 'b1',
          toNode: 'b1',
          kind: 'data',
          path: { d: 'M0 0 L10 10' },
        },
      ],
      steps: [
        {
          index: 0,
          focus: ['b1'],
          line: 2,
          actions: [{ type: 'spawn_value', tokenId: 'tok-1', repr: '3', atNode: 'b1' }],
          caption: { key: 'state.init', params: { name: 'total' } },
        },
      ],
    };
    expect(SceneSchema.parse(scene)).toBeDefined();
  });

  it('defaults edges to [] when omitted (backward compatible)', () => {
    const scene = {
      id: 'scene-1',
      graphRef: 'g1',
      layout: [{ id: 'b1', kind: 'binding', x: 0, y: 0, width: 100, height: 40 }],
      steps: [
        {
          index: 0,
          focus: ['b1'],
          line: 2,
          actions: [{ type: 'pulse_effect', node: 'e1' }],
          caption: { key: 'state.init', params: { name: 'total' } },
        },
      ],
    };
    const parsed = SceneSchema.parse(scene);
    expect(parsed.edges).toEqual([]);
  });
});
