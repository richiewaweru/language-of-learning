import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import {
  SemanticGraphSchema,
  TraceSchema,
  type LensArtifacts,
  type LessonDefinitionV3,
  type LessonVerification,
} from '@lol/lens-contracts';
import { lesson as valuesAndVariablesLesson } from '../../apps/web/src/lib/lesson-foundation/lessons/values-and-variables';
import { runLessonVerifications } from '../../apps/web/src/lib/lesson-foundation/verification';
import {
  CueTransitionGuard,
  InitializeOnceLedger,
} from '../../apps/web/src/lib/lesson-foundation/orchestration-core';
import { createSubmissionGuard } from '../../apps/web/src/lib/lesson-foundation/submission-guard';

function valueArtifacts(): LensArtifacts {
  const graph = SemanticGraphSchema.parse(JSON.parse(
    readFileSync('fixtures/pilot/values-watch/expected.graph.json', 'utf8'),
  ));
  const trace = TraceSchema.parse(JSON.parse(
    readFileSync('fixtures/pilot/values-watch/expected.trace.json', 'utf8'),
  ));
  return {
    graph,
    trace,
    violation: null,
    diagnostics: [],
    pattern: null,
    scene: null,
    semanticScene: null,
    transfer: null,
  };
}

function fixtureArtifacts(name: string): LensArtifacts {
  const graph = SemanticGraphSchema.parse(JSON.parse(
    readFileSync(`fixtures/${name}/expected.graph.json`, 'utf8'),
  ));
  const trace = TraceSchema.parse(JSON.parse(
    readFileSync(`fixtures/${name}/expected.trace.json`, 'utf8'),
  ));
  return {
    graph,
    trace,
    violation: null,
    diagnostics: [],
    pattern: null,
    scene: null,
    semanticScene: null,
    transfer: null,
  };
}

function definitionWith(verifications: LessonVerification[]): LessonDefinitionV3 {
  return { ...valuesAndVariablesLesson, verifications };
}

describe('definition-driven lesson Build verification', () => {
  it('executes only declared verification IDs against semantic artifacts', () => {
    const results = runLessonVerifications(
      valuesAndVariablesLesson,
      ['build-assignment-count', 'build-dependencies'],
      { source: valueArtifacts().graph.source, artifacts: valueArtifacts() },
    );
    expect(results.map((item) => item.id)).toEqual([
      'build-assignment-count',
      'build-dependencies',
    ]);
    expect(results.every((item) => item.correct)).toBe(false);
  });

  it('accepts configured variation values', () => {
    const artifacts = valueArtifacts();
    const final = artifacts.trace.steps.at(-1);
    if (final) {
      final.bindings = { price: '200', tax: '32.0', total: '232.0' };
    }
    const [verification] = runLessonVerifications(
      valuesAndVariablesLesson,
      ['variation-values'],
      { source: artifacts.graph.source, artifacts },
    );
    expect(verification.correct).toBe(true);
  });

  it('fails honestly when semantic artifacts are unavailable', () => {
    const [verification] = runLessonVerifications(
      valuesAndVariablesLesson,
      ['build-supported'],
      { source: 'first = 1', artifacts: null },
    );
    expect(verification.correct).toBe(false);
  });

  it('verifies function, direct-return, loop, and accumulator semantics with authored names', () => {
    const artifacts = fixtureArtifacts('accumulate');
    const definition = definitionWith([
      { id: 'function', type: 'function-shape', parameterCount: 1, requireModuleCall: false },
      { id: 'return', type: 'return-dependency', parameterNames: ['numbers'] },
      { id: 'loop', type: 'loop-shape', iterator: 'number', accumulator: 'total' },
      { id: 'accumulator', type: 'accumulator-dependency', iterator: 'number', accumulator: 'total' },
    ]);
    const results = runLessonVerifications(
      definition,
      ['function', 'return', 'loop', 'accumulator'],
      { source: artifacts.graph.source, artifacts },
    );
    expect(results.every((item) => item.correct)).toBe(true);
  });

  it('verifies a direct return expression from a parameter', () => {
    const artifacts = fixtureArtifacts('guard');
    const definition = definitionWith([
      { id: 'return', type: 'return-dependency', parameterNames: ['amount'] },
    ]);
    const [verification] = runLessonVerifications(
      definition,
      ['return'],
      { source: artifacts.graph.source, artifacts },
    );
    expect(verification.correct).toBe(true);
  });

  it('rejects renamed semantic requirements that are absent from the graph', () => {
    const artifacts = fixtureArtifacts('accumulate');
    const definition = definitionWith([
      { id: 'loop', type: 'loop-shape', iterator: 'item', accumulator: 'sum_value' },
      { id: 'return', type: 'return-dependency', parameterNames: ['values'] },
    ]);
    const results = runLessonVerifications(
      definition,
      ['loop', 'return'],
      { source: artifacts.graph.source, artifacts },
    );
    expect(results.every((item) => !item.correct)).toBe(true);
  });
});
describe('lesson orchestration guards', () => {
  it('applies initialize-once cues exactly once', () => {
    const ledger = new InitializeOnceLedger();
    expect(ledger.shouldApply('cue-introduce')).toBe(true);
    expect(ledger.shouldApply('cue-introduce')).toBe(false);
  });

  it('marks older asynchronous transitions stale', () => {
    const guard = new CueTransitionGuard();
    const first = guard.begin();
    const second = guard.begin();
    expect(guard.isCurrent(first)).toBe(false);
    expect(guard.isCurrent(second)).toBe(true);
  });

  it('rejects submissions after an edit, restart, or navigation invalidation', () => {
    const submissions = createSubmissionGuard(() => 'submission-1');
    const token = submissions.begin('attempt-1');
    const identity = submissions.bind(token, 'source-a', 4);
    expect(identity).not.toBeNull();
    submissions.invalidate();
    expect(submissions.isCurrent(identity!, identity!)).toBe(false);
  });

  it('rejects older submissions when a newer Build check starts', () => {
    let nextId = 0;
    const submissions = createSubmissionGuard(() => `submission-${++nextId}`);
    const first = submissions.begin('attempt-1');
    const firstIdentity = submissions.bind(first, 'source-a', 4)!;
    const second = submissions.begin('attempt-1');
    const secondIdentity = submissions.bind(second, 'source-a', 4)!;
    expect(submissions.isCurrent(firstIdentity, firstIdentity)).toBe(false);
    expect(submissions.isCurrent(secondIdentity, secondIdentity)).toBe(true);
  });

  it.each([
    ['attempt', { attemptId: 'attempt-2', sourceHash: 'source-a', lensRevision: 4 }],
    ['source hash', { attemptId: 'attempt-1', sourceHash: 'source-b', lensRevision: 4 }],
    ['Lens revision', { attemptId: 'attempt-1', sourceHash: 'source-a', lensRevision: 5 }],
  ])('rejects a stale %s identity', (_label, current) => {
    const submissions = createSubmissionGuard(() => 'submission-1');
    const identity = submissions.bind(
      submissions.begin('attempt-1'),
      'source-a',
      4,
    )!;
    expect(submissions.isCurrent(identity, {
      submissionId: identity.submissionId,
      ...current,
    })).toBe(false);
  });
});
