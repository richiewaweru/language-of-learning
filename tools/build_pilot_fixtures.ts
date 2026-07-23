import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { examples, executableExampleIdsForLesson, lessons } from '../apps/web/src/lib/pilot/course';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outputRoot = path.join(root, 'fixtures', 'pilot');
const temporaryRoot = path.join(root, '.codex-tmp', 'pilot-fixture-build');

await mkdir(outputRoot, { recursive: true });
await mkdir(temporaryRoot, { recursive: true });

const fixtureIds = new Set(lessons.flatMap((lesson) => executableExampleIdsForLesson(lesson.id)));

for (const fixture of Object.values(examples).filter((entry) => fixtureIds.has(entry.id))) {
  const fixtureRoot = path.join(outputRoot, fixture.id);
  const inputPath = path.join(temporaryRoot, `${fixture.id}.input.json`);
  const outputPath = path.join(temporaryRoot, `${fixture.id}.output.json`);
  await mkdir(fixtureRoot, { recursive: true });
  await writeFile(
    path.join(fixtureRoot, 'expect.json'),
    `${JSON.stringify(
      {
        lessonId: fixture.lessonId,
        exampleId: fixture.id,
        expectedNodeKinds: fixture.expectedNodeKinds ?? [],
        expectedFinalBindings: fixture.expectedFinalBindings ?? {},
      },
      null,
      2,
    )}\n`,
  );
  if (process.argv.includes('--missing')) {
    try {
      const [source, scene] = await Promise.all([
        readFile(path.join(fixtureRoot, 'source.py'), 'utf8'),
        readFile(path.join(fixtureRoot, 'expected.scene.json'), 'utf8'),
      ]);
      if (source.trimEnd() === fixture.code && scene.trim()) {
        process.stdout.write(`kept ${fixture.id}\n`);
        continue;
      }
    } catch {
      // Build the missing or incomplete fixture below.
    }
  }
  await writeFile(
    inputPath,
    JSON.stringify({ source: fixture.code, argsRepr: [], sceneId: `pilot-${fixture.id}` }, null, 2),
  );
  const result = spawnSync('python', ['tools/build_artifacts.py', inputPath, outputPath], {
    cwd: root,
    encoding: 'utf8',
    shell: false,
  });
  if (result.status !== 0) {
    throw new Error(`${fixture.id}: ${result.stderr || result.stdout}`);
  }
  const artifacts = JSON.parse(await readFile(outputPath, 'utf8'));
  await Promise.all([
    writeFile(path.join(fixtureRoot, 'source.py'), `${fixture.code}\n`),
    writeFile(path.join(fixtureRoot, 'call.json'), '{\n  "argsRepr": []\n}\n'),
    writeFile(
      path.join(fixtureRoot, 'expected.graph.json'),
      `${JSON.stringify(artifacts.graph, null, 2)}\n`,
    ),
    writeFile(
      path.join(fixtureRoot, 'expected.trace.json'),
      `${JSON.stringify(artifacts.trace, null, 2)}\n`,
    ),
    writeFile(
      path.join(fixtureRoot, 'expected.scene.json'),
      `${JSON.stringify(artifacts.scene, null, 2)}\n`,
    ),
  ]);
  process.stdout.write(`built ${fixture.id}\n`);
}
