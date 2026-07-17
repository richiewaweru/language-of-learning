import { buildScene } from '@lol/lens-scenes';
import type { SemanticGraph, Trace } from '@lol/lens-scenes';
import { readFile } from 'node:fs/promises';
import path from 'node:path';

export type SliceVariant = {
  id: string;
  label: string;
  source: string;
  argsRepr: string[];
  graph: SemanticGraph;
  trace: Trace;
  scene: ReturnType<typeof buildScene>;
};

async function loadBundle(
  base: string,
  id: string,
  label: string,
): Promise<SliceVariant> {
  const [source, graphText, traceText, callText] = await Promise.all([
    readFile(path.join(base, 'source.py'), 'utf8'),
    readFile(path.join(base, 'expected.graph.json'), 'utf8'),
    readFile(path.join(base, 'expected.trace.json'), 'utf8'),
    readFile(path.join(base, 'call.json'), 'utf8'),
  ]);
  const graph = JSON.parse(graphText) as SemanticGraph;
  const trace = JSON.parse(traceText) as Trace;
  const call = JSON.parse(callText) as { argsRepr: string[] };
  const scene = buildScene(graph, trace, { sceneId: `scene-${id}` });
  return {
    id,
    label,
    source: source.trimEnd(),
    argsRepr: call.argsRepr,
    graph,
    trace,
    scene,
  };
}

export async function loadAccumulateVariants(root: string): Promise<SliceVariant[]> {
  return [
    await loadBundle(path.join(root, 'fixtures', 'accumulate'), 'canonical', 'Canonical [3, 5, 2]'),
  ];
}

export async function loadFilterVariants(root: string): Promise<SliceVariant[]> {
  return [
    await loadBundle(path.join(root, 'fixtures', 'filter'), 'canonical', 'Canonical [-2, 3, 0, 5]'),
  ];
}
