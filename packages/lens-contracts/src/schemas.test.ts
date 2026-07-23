import { describe, expect, it } from 'vitest';
import {
  BindingRoleSchema,
  RelationTypeSchema,
  SemanticGraphSchema,
  SemanticNodeSchema,
} from '../src/graph.js';
import { PatternHitSchema } from '../src/pattern.js';
import { SceneActionSchema, SceneSchema } from '../src/scene.js';
import { TraceSchema } from '../src/trace.js';
import { SelectionSchema } from '../src/selection.js';
import { LessonRevisionSchema } from '../src/lesson.js';

describe('graph schema', () => {
  it('accepts all 12 node kinds', () => {
    const nodes = [
      { id: 'v1', kind: 'value', sourceRange: sr(), repr: '0', pyType: 'int' },
      {
        id: 'b1',
        kind: 'binding',
        sourceRange: sr(),
        name: 'total',
        role: 'state',
        mutable: true,
      },
      { id: 'c1', kind: 'collection', sourceRange: sr(), items: ['v1'] },
      { id: 'f1', kind: 'function', sourceRange: sr(), name: 'fn', params: ['p1'] },
      { id: 'ca1', kind: 'call', sourceRange: sr(), callee: 'len', args: ['c1'] },
      { id: 'o1', kind: 'operation', sourceRange: sr(), expr: 'a + b' },
      { id: 's1', kind: 'sequence', sourceRange: sr(), children: ['b1'] },
      {
        id: 'br1',
        kind: 'branch',
        sourceRange: sr(),
        conditionExpr: 'x > 0',
        trueBody: 's1',
      },
      {
        id: 'l1',
        kind: 'loop',
        sourceRange: sr(),
        iteratorName: 'x',
        collectionRef: 'c1',
        body: 's1',
      },
      { id: 'r1', kind: 'return', sourceRange: sr(), valueRef: 'b1' },
      {
        id: 'm1',
        kind: 'mutation',
        sourceRange: sr(),
        targetRef: 'c1',
        mutationType: 'append',
      },
      { id: 'e1', kind: 'effect', sourceRange: sr(), effectType: 'print' },
    ] as const;

    for (const node of nodes) {
      expect(SemanticNodeSchema.safeParse(node).success).toBe(true);
    }
  });

  it('accepts 5 binding roles and 7 relation types', () => {
    expect(BindingRoleSchema.options).toHaveLength(5);
    expect(RelationTypeSchema.options).toHaveLength(7);
    expect(BindingRoleSchema.safeParse('constant').success).toBe(true);
    expect(RelationTypeSchema.safeParse('mutates').success).toBe(true);
    expect(RelationTypeSchema.safeParse('triggers').success).toBe(false);
  });

  it('validates a minimal semantic graph envelope', () => {
    const graph = {
      version: '0.1',
      source: 'def fn(): pass',
      nodes: [
        {
          id: 'f1',
          kind: 'function',
          sourceRange: sr(),
          name: 'fn',
          params: [],
        },
      ],
      relations: [],
      unsupported: [],
    };
    expect(SemanticGraphSchema.parse(graph)).toEqual(graph);
  });
});

describe('trace schema', () => {
  it('accepts closed event set', () => {
    const trace = {
      scope: {
        kind: 'function' as const,
        id: 'f1',
        functionId: 'f1',
        label: 'example',
        argsRepr: ['[1, 2]'],
      },
      call: { functionId: 'f1', argsRepr: ['[1, 2]'] },
      steps: [
        {
          index: 0,
          line: 1,
          focus: ['f1'],
          bindings: {},
          event: { type: 'call_enter', functionId: 'f1' },
        },
        {
          index: 1,
          line: 3,
          focus: ['l1'],
          bindings: { x: '1' },
          event: { type: 'loop_advance', loop: 'l1', itemIndex: 0, itemRepr: '1' },
        },
        {
          index: 2,
          line: 4,
          focus: ['br1'],
          bindings: { x: '1' },
          event: { type: 'condition_eval', branch: 'br1', result: true },
        },
        {
          index: 3,
          line: 5,
          focus: ['b1'],
          bindings: { total: '1' },
          event: {
            type: 'state_change',
            binding: 'b1',
            oldRepr: '0',
            newRepr: '1',
          },
        },
      ],
      result: { repr: '1' },
      truncated: false,
    };
    expect(TraceSchema.parse(trace)).toEqual(trace);
  });

  it('accepts additive Structural Lens v1 factual events and violations', () => {
    const events = [
      { type: 'indexed_selection', collection: 'values', indexRepr: '0', valueRepr: '3' },
      { type: 'indexed_mutation', collection: 'values', indexRepr: '0', oldRepr: '3', newRepr: '9' },
      { type: 'supported_call', callee: 'len', argsRepr: ['[3]'], resultRepr: '1' },
      { type: 'loop_test', loop: 'loop-1', iteration: 0, result: true },
      { type: 'unsupported', construct: 'recursion', message: 'Deferred in v1.' },
    ];
    const trace = {
      scope: {
        kind: 'function' as const,
        id: 'f1',
        functionId: 'f1',
        label: 'example',
        argsRepr: [],
      },
      call: { functionId: 'f1', argsRepr: [] },
      steps: events.map((event, index) => ({
        index,
        line: 1,
        focus: [],
        bindings: {},
        event,
      })),
      violation: { construct: 'recursion', message: 'Deferred in v1.' },
      truncated: false,
    };
    expect(TraceSchema.safeParse(trace).success).toBe(true);
  });

  it('accepts a module trace without legacy call metadata', () => {
    expect(
      TraceSchema.safeParse({
        scope: { kind: 'module', id: 'module:main', label: 'Program' },
        steps: [],
        truncated: false,
      }).success,
    ).toBe(true);
  });

  it('rejects invalid or incomplete execution scopes', () => {
    expect(
      TraceSchema.safeParse({
        scope: { kind: 'script', id: 'module:main', label: 'Program' },
        steps: [],
        truncated: false,
      }).success,
    ).toBe(false);
    expect(
      TraceSchema.safeParse({
        scope: { kind: 'function', id: 'f1', label: 'example' },
        steps: [],
        truncated: false,
      }).success,
    ).toBe(false);
  });
});

describe('pattern schema', () => {
  it('accepts v0.1 pattern hit', () => {
    const hit = {
      pattern: 'ACCUMULATE',
      confidence: 'deterministic',
      memberNodes: ['l1', 'b1'],
      related: ['COUNT', 'FILTER'],
    };
    expect(PatternHitSchema.parse(hit)).toEqual(hit);
  });
});

describe('scene schema', () => {
  it('accepts declarative actions only', () => {
    expect(
      SceneActionSchema.safeParse({
        type: 'change_state',
        cell: 'b1',
        oldRepr: '0',
        newRepr: '3',
      }).success,
    ).toBe(true);
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
    expect(SceneSchema.parse(scene)).toEqual({ ...scene, edges: [] });
  });
});

describe('selection and lesson schemas', () => {
  it('validates selection and lesson revision envelope', () => {
    expect(SelectionSchema.parse({ line: 3, stepIndex: 1 })).toEqual({
      line: 3,
      stepIndex: 1,
    });
    expect(
      LessonRevisionSchema.parse({
        version: '0.1.0',
        slug: 'loops-intro',
        title: 'How loops build results',
        objectives: ['See accumulation'],
        blocks: [{ type: 'text', content: 'Intro' }],
      }),
    ).toMatchObject({ slug: 'loops-intro' });
  });
});

function sr() {
  return { startLine: 1, startCol: 0, endLine: 1, endCol: 10 };
}
