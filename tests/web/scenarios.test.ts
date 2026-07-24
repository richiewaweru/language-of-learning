import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import type {
  LensArtifacts,
  LessonScenarioV4,
  SemanticGraph,
} from '@lol/lens-contracts';
import {
  hashSource,
  resolveScenarioRoleValue,
  runScenariosAgainstSource,
  sourceForScenario,
} from '../../apps/web/src/lib/lesson-foundation/scenarios';

const range = (startLine: number, startCol: number, endLine: number, endCol: number) => ({
  startLine,
  startCol,
  endLine,
  endCol,
});

function conditionGraph(source: string, readNames = ['age']): SemanticGraph {
  return {
    version: 'test',
    source,
    nodes: [
      { id: 'module', kind: 'module', name: 'Program', sourceRange: range(1, 0, 7, 20) },
      { id: 'noise', kind: 'binding', name: 'noise', role: 'constant', mutable: false, initialRepr: '99', sourceRange: range(1, 0, 1, 10) },
      { id: 'age', kind: 'binding', name: 'age', role: 'constant', mutable: false, initialRepr: '16', sourceRange: range(2, 0, 2, 8) },
      { id: 'limit', kind: 'binding', name: 'limit', role: 'constant', mutable: false, initialRepr: '18', sourceRange: range(3, 0, 3, 10) },
      { id: 'branch', kind: 'branch', conditionExpr: 'age >= 18', trueBody: 'status', falseBody: 'status', sourceRange: range(4, 0, 7, 20) },
      { id: 'condition', kind: 'operation', expr: 'age >= 18', sourceRange: range(4, 3, 4, 12) },
      { id: 'status', kind: 'binding', name: 'status', role: 'state', mutable: true, sourceRange: range(5, 4, 5, 20) },
    ],
    relations: [
      { from: 'module', type: 'contains', to: 'noise' },
      { from: 'module', type: 'contains', to: 'age' },
      { from: 'module', type: 'contains', to: 'limit' },
      { from: 'module', type: 'contains', to: 'branch' },
      { from: 'branch', type: 'contains', to: 'condition' },
      { from: 'branch', type: 'contains', to: 'status' },
      ...readNames.map((name) => ({ from: 'condition', type: 'reads' as const, to: name })),
    ],
    unsupported: [],
  };
}

function loopGraph(source: string): SemanticGraph {
  return {
    version: 'test',
    source,
    nodes: [
      { id: 'module', kind: 'module', name: 'Program', sourceRange: range(1, 0, 5, 32) },
      { id: 'unused', kind: 'collection', name: 'unused', items: ['9'], sourceRange: range(1, 0, 1, 12) },
      { id: 'values', kind: 'collection', name: 'values', items: ['2', '4', '6'], sourceRange: range(2, 0, 2, 18) },
      { id: 'sum', kind: 'binding', name: 'sum_value', role: 'state', mutable: true, sourceRange: range(3, 0, 3, 13) },
      { id: 'loop', kind: 'loop', iteratorName: 'item', collectionRef: 'values', body: 'update', sourceRange: range(4, 0, 5, 32) },
      { id: 'item', kind: 'binding', name: 'item', role: 'iterator', mutable: false, sourceRange: range(4, 4, 4, 8) },
      { id: 'update', kind: 'operation', expr: 'sum_value + item', sourceRange: range(5, 16, 5, 32) },
    ],
    relations: [
      { from: 'module', type: 'contains', to: 'unused' },
      { from: 'module', type: 'contains', to: 'values' },
      { from: 'module', type: 'contains', to: 'sum' },
      { from: 'module', type: 'contains', to: 'loop' },
      { from: 'loop', type: 'iterates', to: 'values' },
      { from: 'loop', type: 'contains', to: 'update' },
      { from: 'update', type: 'reads', to: 'sum' },
      { from: 'update', type: 'reads', to: 'item' },
      { from: 'update', type: 'writes', to: 'sum' },
    ],
    unsupported: [],
  };
}

function artifacts(graph: SemanticGraph, bindings: Record<string, string>): LensArtifacts {
  return {
    graph,
    trace: {
      version: 'test',
      graphVersion: 'test',
      scope: { kind: 'module', id: 'module' },
      steps: [{
        index: 0,
        event: { type: 'condition_eval', nodeId: 'branch', expression: 'age >= 18', result: true },
        bindings,
      }],
      truncated: false,
    } as LensArtifacts['trace'],
    violation: null,
    diagnostics: [],
    pattern: null,
    scene: null,
    semanticScene: null,
    transfer: null,
  };
}

describe('learner-source scenarios', () => {
  it('targets the semantic decision input without touching unrelated assignments or learner source', async () => {
    const source = 'noise = 99\nage = 16\nlimit = 18\nif age >= 18:\n    status = "adult"\nelse:\n    status = "minor"';
    const transformed = sourceForScenario(source, {
      id: 'adult',
      label: 'Adult',
      strategy: {
        type: 'replace-input-binding',
        selector: { role: 'first-starting-binding' },
        valueSource: '21',
      },
      expectedBindings: {},
      expectedRoleValues: {},
      expectedBranchOutcome: true,
    }, conditionGraph(source));
    expect(transformed).toContain('noise = 99\nage = 21');
    expect(source).toContain('age = 16');
    expect(await hashSource(source)).toHaveLength(64);
  });

  it('targets the collection iterated by the loop and ignores unrelated lists', () => {
    const source = 'unused = [9]\nvalues = [2, 4, 6]\nsum_value = 0\nfor item in values:\n    sum_value = sum_value + item';
    const transformed = sourceForScenario(source, {
      id: 'odd',
      label: 'Odd',
      strategy: {
        type: 'replace-list-literal',
        selector: { role: 'first-collection-binding' },
        valueSource: '[1, 3, 5]',
      },
      expectedBindings: {},
      expectedRoleValues: {},
    }, loopGraph(source));
    expect(transformed).toContain('unused = [9]\nvalues = [1, 3, 5]');
  });

  it('uses the semantic module call range instead of a textual function-name match', () => {
    const graph = JSON.parse(readFileSync(
      'fixtures/pilot/functions-watch/expected.graph.json',
      'utf8',
    )) as SemanticGraph;
    const transformed = sourceForScenario(graph.source, {
      id: 'arguments',
      label: 'Arguments',
      strategy: {
        type: 'supply-function-arguments',
        functionSelector: 'first',
        argumentsSource: ['200', '0.1'],
      },
      expectedBindings: {},
      expectedRoleValues: {},
    }, graph);
    expect(transformed).toContain('result = calculate_tax(200, 0.1)');
    expect(transformed).toContain('def calculate_tax(price, rate):');
  });

  it('fails honestly when a semantic transform target is ambiguous', () => {
    const source = 'noise = 99\nage = 16\nlimit = 18\nif age >= limit:\n    status = "adult"\nelse:\n    status = "minor"';
    expect(() => sourceForScenario(source, {
      id: 'ambiguous',
      label: 'Ambiguous',
      strategy: {
        type: 'replace-input-binding',
        selector: { role: 'first-starting-binding' },
        valueSource: '21',
      },
      expectedBindings: {},
      expectedRoleValues: {},
    }, conditionGraph(source, ['age', 'limit']))).toThrow(/ambiguous/);

    const graph = JSON.parse(readFileSync(
      'fixtures/pilot/functions-two-calls/expected.graph.json',
      'utf8',
    )) as SemanticGraph;
    expect(() => sourceForScenario(graph.source, {
      id: 'ambiguous-call',
      label: 'Ambiguous call',
      strategy: {
        type: 'supply-function-arguments',
        functionSelector: 'first',
        argumentsSource: ['7'],
      },
      expectedBindings: {},
      expectedRoleValues: {},
    }, graph)).toThrow(/ambiguous/);
  });

  it('checks the branch-result role rather than accepting an unrelated equal value', async () => {
    const source = 'noise = 99\nage = 16\nlimit = 18\nif age >= 18:\n    status = "adult"\nelse:\n    status = "minor"';
    const base = artifacts(conditionGraph(source), { age: '16', status: "'minor'" });
    const scenario: LessonScenarioV4 = {
      id: 'adult',
      label: 'Adult',
      strategy: {
        type: 'replace-input-binding',
        selector: { role: 'first-starting-binding' },
        valueSource: '21',
      },
      expectedBindings: {},
      expectedRoleValues: { 'branch-result': "'adult'" },
      expectedBranchOutcome: true,
    };
    const transformed = sourceForScenario(source, scenario, base.graph);
    const scenarioEvidence = artifacts(
      { ...conditionGraph(transformed), source: transformed },
      { status: "'wrong'", decoy: "'adult'" },
    );
    expect(resolveScenarioRoleValue(scenarioEvidence, 'branch-result')).toEqual({
      bindingName: 'status',
      value: "'wrong'",
    });
    const [result] = await runScenariosAgainstSource({
      source,
      sourceHash: await hashSource(source),
      scenarios: [scenario],
      baseArtifacts: base,
      engine: { analyze: async () => scenarioEvidence },
    });
    expect(result.error).toMatch(/branch-result/);
  });
});
