import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildScene } from '../packages/lens-scenes/src/index.ts';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const fixtures = ['accumulate', 'count', 'filter', 'transform'];
const outDir = join(root, 'content', 'scenes');
mkdirSync(outDir, { recursive: true });

for (const name of fixtures) {
  const graph = JSON.parse(
    readFileSync(join(root, 'fixtures', name, 'expected.graph.json'), 'utf8'),
  );
  const trace = JSON.parse(
    readFileSync(join(root, 'fixtures', name, 'expected.trace.json'), 'utf8'),
  );
  const scene = buildScene(graph, trace, {
    sceneId: `scene-${name}`,
    graphRef: `fixtures/${name}`,
  });
  writeFileSync(join(outDir, `${name}.json`), `${JSON.stringify(scene, null, 2)}\n`);
  console.log(`wrote content/scenes/${name}.json steps=${scene.steps.length}`);
}
