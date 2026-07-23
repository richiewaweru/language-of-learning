import { readFile } from 'node:fs/promises';
import path from 'node:path';
import type { Scene } from '@lol/lens-contracts';
import type { SemanticGraph, Trace } from '@lol/lens-scenes';
import { assertRepoRoot, repoRoot } from '$lib/repoRoot';
import { examples } from './course';

export type PilotExamplePack = {
  id: string;
  title: string;
  source: string;
  argsRepr: string[];
  graph: SemanticGraph;
  trace: Trace;
  scene: Scene;
};

export async function loadPilotExamplePack(id: string): Promise<PilotExamplePack> {
  const definition = examples[id];
  if (!definition?.executable) throw new Error(`Pilot example ${id} is not executable.`);
  const base = path.join(assertRepoRoot(repoRoot), 'fixtures', 'pilot', id);
  const [source, graph, trace, scene] = await Promise.all([
    readFile(path.join(base, 'source.py'), 'utf8'),
    readFile(path.join(base, 'expected.graph.json'), 'utf8'),
    readFile(path.join(base, 'expected.trace.json'), 'utf8'),
    readFile(path.join(base, 'expected.scene.json'), 'utf8'),
  ]);
  const loadedSource = source.trimEnd();
  if (loadedSource !== definition.code) {
    throw new Error(`Pilot example ${id} drifted from its authored source.`);
  }
  return {
    id,
    title: definition.title,
    source: loadedSource,
    argsRepr: [],
    graph: JSON.parse(graph) as SemanticGraph,
    trace: JSON.parse(trace) as Trace,
    scene: JSON.parse(scene) as Scene,
  };
}
