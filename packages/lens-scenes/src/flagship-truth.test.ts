import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { buildScene, deriveMotionState, deriveLearnerCaption, renderCaption } from './index.js';
import type { SemanticGraph, Trace } from './types.js';

const repoRoot = path.resolve(fileURLToPath(new URL('../../..', import.meta.url)));

function loadAccumulate() {
  const base = path.join(repoRoot, 'fixtures', 'accumulate');
  const graph = JSON.parse(readFileSync(path.join(base, 'expected.graph.json'), 'utf8')) as SemanticGraph;
  const trace = JSON.parse(readFileSync(path.join(base, 'expected.trace.json'), 'utf8')) as Trace;
  const scene = buildScene(graph, trace, { sceneId: 'scene-flagship' });
  return { graph, trace, scene };
}

describe('flagship truth — accumulate', () => {
  const { graph, trace, scene } = loadAccumulate();

  it.each(trace.steps.map((s) => [s.index, s] as const))(
    'step %i agreement',
    (i, step) => {
      const sceneStep = scene.steps[i];
      expect(sceneStep).toBeDefined();
      expect(sceneStep!.line).toBe(step.line);
      expect(sceneStep!.focus).toEqual(step.focus);

      const caption = deriveLearnerCaption(graph, step, trace, sceneStep);
      expect(caption.length).toBeGreaterThan(0);

      const motion = deriveMotionState(scene, graph, trace, i);
      expect(motion).toBeDefined();

      if (step.event.type === 'return_exit') {
        expect(step.event.repr).toBe(trace.result?.repr);
      }

      if (step.event.type === 'state_change') {
        const ev = step.event;
        expect(step.bindings).toHaveProperty(
          graph.nodes.find((n) => n.id === ev.binding)?.name ?? 'total',
          ev.newRepr,
        );
      }
    },
  );

  it('final return is 10', () => {
    expect(trace.result?.repr).toBe('10');
    const last = trace.steps[trace.steps.length - 1]!;
    expect(last.event.type).toBe('return_exit');
    expect(renderCaption(scene.steps[last.index]!.caption)).toContain('10');
  });
});
