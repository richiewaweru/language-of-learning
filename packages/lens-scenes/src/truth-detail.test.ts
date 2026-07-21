import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { buildScene, resolveSelection, resolveTruthDetail } from './index.js';
import type { SemanticGraph, Trace } from './types.js';

const repoRoot = path.resolve(fileURLToPath(new URL('../../..', import.meta.url)));

function loadAccumulate() {
  const base = path.join(repoRoot, 'fixtures', 'accumulate');
  const graph = JSON.parse(readFileSync(path.join(base, 'expected.graph.json'), 'utf8')) as SemanticGraph;
  const trace = JSON.parse(readFileSync(path.join(base, 'expected.trace.json'), 'utf8')) as Trace;
  const scene = buildScene(graph, trace, { sceneId: 'scene-truth' });
  return { graph, trace, scene };
}

describe('resolveTruthDetail', () => {
  const { graph, trace, scene } = loadAccumulate();

  it('resolves code line selection', () => {
    const stepIndex = 3;
    const line = trace.steps[stepIndex]!.line!;
    const detail = resolveTruthDetail({ line, stepIndex }, graph, trace, scene, stepIndex);
    expect(detail).not.toBeNull();
    expect(detail!.line).toBe(line);
    expect(detail!.whyActive).toBeTruthy();
  });

  it('code and node selection agree on step', () => {
    const stepIndex = 3;
    const line = trace.steps[stepIndex]!.line!;
    const fromLine = resolveSelection({ line, stepIndex }, graph, trace, scene.layout);
    const nodeId = fromLine.primaryNodeId;
    expect(nodeId).toBeTruthy();
    const fromNode = resolveSelection({ nodeId, stepIndex }, graph, trace, scene.layout);
    expect(fromNode.primaryNodeId).toBe(fromLine.primaryNodeId);
  });

  it('state binding detail on state_change step', () => {
    const stepIndex = 3;
    const binding = graph.nodes.find((n) => n.role === 'state');
    expect(binding).toBeDefined();
    const detail = resolveTruthDetail(
      { nodeId: binding!.id, stepIndex },
      graph,
      trace,
      scene,
      stepIndex,
    );
    expect(detail?.what).toContain('total');
    expect(detail?.currentValue).toBe('3');
  });
});
