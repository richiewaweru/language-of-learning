import { buildScene, normalizeSemanticScene } from '@lol/lens-scenes';
import type { SemanticGraph, Trace } from '@lol/lens-scenes';
import { assertRepoRoot, repoRoot } from '$lib/repoRoot';
import { readFile } from 'node:fs/promises';
import path from 'node:path';

export type DemoPack = {
  id: string;
  title: string;
  source: string;
  argsRepr: string[];
  graph: SemanticGraph;
  trace: Trace;
  scene: ReturnType<typeof buildScene>;
  semanticScene: ReturnType<typeof normalizeSemanticScene>;
};

export async function loadDemoPack(root: string = assertRepoRoot(repoRoot)): Promise<DemoPack> {
  const base = path.join(root, 'fixtures', 'accumulate');
  const [source, graphText, traceText, callText] = await Promise.all([
    readFile(path.join(base, 'source.py'), 'utf8'),
    readFile(path.join(base, 'expected.graph.json'), 'utf8'),
    readFile(path.join(base, 'expected.trace.json'), 'utf8'),
    readFile(path.join(base, 'call.json'), 'utf8'),
  ]);
  const graph = JSON.parse(graphText) as SemanticGraph;
  const trace = JSON.parse(traceText) as Trace;
  const call = JSON.parse(callText) as { argsRepr: string[] };
  const scene = buildScene(graph, trace, { sceneId: 'scene-flagship-demo' });
  const semanticScene = normalizeSemanticScene(graph, trace, { sceneId: 'semantic-flagship-demo' });
  return {
    id: 'flagship-accumulate',
    title: 'How a loop builds a result',
    source: source.trimEnd(),
    argsRepr: call.argsRepr,
    graph,
    trace,
    scene,
    semanticScene,
  };
}
