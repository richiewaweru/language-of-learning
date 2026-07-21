import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { buildScene } from './build-scene.js';
import { deriveLearnerCaption, deriveStepLabel } from './learner-labels.js';
import type { SemanticGraph, Trace } from './types.js';

const repoRoot = path.resolve(fileURLToPath(new URL('../../..', import.meta.url)));

function loadAccumulate(): { graph: SemanticGraph; trace: Trace } {
  const base = path.join(repoRoot, 'fixtures', 'accumulate');
  const graph = JSON.parse(readFileSync(path.join(base, 'expected.graph.json'), 'utf8')) as SemanticGraph;
  const trace = JSON.parse(readFileSync(path.join(base, 'expected.trace.json'), 'utf8')) as Trace;
  return { graph, trace };
}

describe('learner labels — accumulate flagship', () => {
  const { graph, trace } = loadAccumulate();
  const scene = buildScene(graph, trace, { sceneId: 'scene-accumulate' });

  it('has 11 trace steps', () => {
    expect(trace.steps.length).toBe(11);
  });

  it('final return value is 20', () => {
    expect(trace.result?.repr).toBe('20');
  });

  const expectedLabels = [
    'Starting the function',
    'Creating the running total',
    'Taking the first number',
    'Updating the total',
    'Taking the next number',
    'Updating the total',
    'Taking the next number',
    'Updating the total',
    'Taking the next number',
    'Updating the total',
    'Returning the result',
  ];

  it.each(trace.steps.map((s, i) => [i, s] as const))(
    'step %i step label',
    (i, step) => {
      expect(deriveStepLabel(graph, step, trace)).toBe(expectedLabels[i]);
    },
  );

  it('state change step 3 mentions values 2 and 0→2', () => {
    const step = trace.steps[3]!;
    const caption = deriveLearnerCaption(graph, step, trace, scene.steps[3]);
    expect(caption).toContain('2');
    expect(caption).toContain('0');
  });

  it('state change step 7 mentions current item 6 and total 12', () => {
    const step = trace.steps[7]!;
    const caption = deriveLearnerCaption(graph, step, trace, scene.steps[7]);
    expect(caption).toContain('6');
    expect(caption).toContain('12');
  });

  it('return step mentions 20', () => {
    const step = trace.steps[10]!;
    const caption = deriveLearnerCaption(graph, step, trace, scene.steps[10]);
    expect(caption).toContain('20');
  });
});
