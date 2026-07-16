import { writeFileSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildSceneActions } from '../src/scene-builder.ts';
import type { SemanticGraph, Trace } from '../src/types.ts';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
const fixtures = ['accumulate', 'count', 'filter', 'transform', 'search', 'guard'];

for (const name of fixtures) {
  const graph = JSON.parse(
    readFileSync(join(root, 'fixtures', name, 'expected.graph.json'), 'utf8'),
  ) as SemanticGraph;
  const trace = JSON.parse(
    readFileSync(join(root, 'fixtures', name, 'expected.trace.json'), 'utf8'),
  ) as Trace;
  const actions = buildSceneActions(graph, trace);
  writeFileSync(
    join(root, 'fixtures', name, 'expected.scene-actions.json'),
    `${JSON.stringify(actions, null, 2)}\n`,
    'utf8',
  );
  console.log(`rewrote ${name}/expected.scene-actions.json (${actions.steps.length} steps)`);
}
