import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { ContractSchemas, type LessonRevision, type Pathway } from '@lol/lens-contracts';
import type { Scene } from '@lol/lens-contracts';
import type { SemanticGraph, Trace } from '@lol/lens-scenes';
import { assertRepoRoot, repoRoot } from '$lib/repoRoot';

const root = () => assertRepoRoot(repoRoot);

export async function loadPathway(slug: string): Promise<Pathway> {
  const raw = await readFile(
    path.join(root(), 'content', 'pathways', `${slug}.json`),
    'utf8',
  );
  return ContractSchemas.pathway.parse(JSON.parse(raw));
}

export async function loadLesson(slug: string): Promise<LessonRevision> {
  const raw = await readFile(path.join(root(), 'content', 'lessons', `${slug}.json`), 'utf8');
  return ContractSchemas.lessonRevision.parse(JSON.parse(raw));
}

export async function loadScene(sceneId: string): Promise<Scene> {
  const index = JSON.parse(
    await readFile(path.join(root(), 'content', 'scene-index.json'), 'utf8'),
  ) as Record<string, { fixture: string }>;
  const meta = index[sceneId];
  if (!meta) throw new Error(`Unknown sceneId ${sceneId}`);
  const raw = await readFile(
    path.join(root(), 'content', 'scenes', `${meta.fixture}.json`),
    'utf8',
  );
  return ContractSchemas.scene.parse(JSON.parse(raw));
}

export async function loadExample(sceneId: string): Promise<{
  source: string;
  graph: SemanticGraph;
  trace: Trace;
  fixture: string;
  argsRepr: string[];
}> {
  const index = JSON.parse(
    await readFile(path.join(root(), 'content', 'scene-index.json'), 'utf8'),
  ) as Record<string, { fixture: string; examplePath: string }>;
  const meta = index[sceneId];
  if (!meta) throw new Error(`Unknown sceneId ${sceneId}`);
  const base = path.join(root(), meta.examplePath);
  const [source, graph, trace, call] = await Promise.all([
    readFile(path.join(base, 'source.py'), 'utf8'),
    readFile(path.join(base, 'expected.graph.json'), 'utf8'),
    readFile(path.join(base, 'expected.trace.json'), 'utf8'),
    readFile(path.join(base, 'call.json'), 'utf8'),
  ]);
  const callParsed = JSON.parse(call) as { argsRepr: string[] };
  return {
    source: source.trimEnd(),
    graph: JSON.parse(graph) as SemanticGraph,
    trace: JSON.parse(trace) as Trace,
    fixture: meta.fixture,
    argsRepr: callParsed.argsRepr,
  };
}
