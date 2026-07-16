import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildSceneActions } from '../packages/lens-scenes/src/scene-builder.ts';
import type { SemanticGraph, Trace } from '../packages/lens-scenes/src/types.ts';
import { detectPattern } from '../packages/lens-patterns/src/detect.ts';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const fixtures = ['accumulate', 'count', 'filter', 'transform', 'search', 'guard'];

for (const name of fixtures) {
  const dir = join(root, 'fixtures', name);
  const graph = JSON.parse(readFileSync(join(dir, 'expected.graph.json'), 'utf8')) as SemanticGraph;
  const trace = JSON.parse(readFileSync(join(dir, 'expected.trace.json'), 'utf8')) as Trace;

  const actions = buildSceneActions(graph, trace);
  writeFileSync(
    join(dir, 'expected.scene-actions.json'),
    `${JSON.stringify(actions, null, 2)}\n`,
    'utf8',
  );

  const hit = detectPattern(graph);
  if (!hit) {
    throw new Error(`No pattern detected for fixture ${name}`);
  }
  const pattern = {
    pattern: hit.pattern,
    confidence: hit.confidence,
    memberNodes: hit.memberNodes,
    related: hit.related,
  };
  writeFileSync(
    join(dir, 'expected.pattern.json'),
    `${JSON.stringify(pattern, null, 2)}\n`,
    'utf8',
  );

  console.log(`  ${name}: ${actions.steps.length} scene steps, pattern ${hit.pattern}`);
}
