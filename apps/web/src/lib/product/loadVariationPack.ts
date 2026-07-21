import { buildScene } from '@lol/lens-scenes';
import type { SemanticGraph, Trace } from '@lol/lens-scenes';
import { assertRepoRoot, repoRoot } from '$lib/repoRoot';
import { execFileSync } from 'node:child_process';
import path from 'node:path';

export type VariationPack = {
  id: string;
  source: string;
  argsRepr: string[];
  graph: SemanticGraph;
  trace: Trace;
  scene: ReturnType<typeof buildScene>;
};

export function loadVariationPack(
  variationId: string,
  root: string = assertRepoRoot(repoRoot),
): VariationPack {
  const script = path.join(root, 'tools', 'export_variation_pack.py');
  const raw = execFileSync('python', [script, variationId], {
    cwd: root,
    encoding: 'utf8',
    maxBuffer: 10 * 1024 * 1024,
  });
  const payload = JSON.parse(raw) as {
    id: string;
    source: string;
    argsRepr: string[];
    graph: SemanticGraph;
    trace: Trace;
  };
  const scene = buildScene(payload.graph, payload.trace, { sceneId: `var-${payload.id}` });
  return { ...payload, scene };
}
