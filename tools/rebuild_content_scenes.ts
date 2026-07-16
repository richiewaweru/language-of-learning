/**
 * content:rebuild — regenerate content/scenes/*.json from lesson sources via the
 * LIVE engine (not from checked-in fixture goldens).
 *
 * For each scene in content/scene-index.json:
 *   1. read fixtures/<fixture>/source.py + call.json (the lesson source of truth)
 *   2. run the Python analyzer + trace runtime (tools/build_artifacts.py
 *      --engine-only) to recompute graph + trace
 *   3. build the scene with the TS scene builder (@lol/lens-scenes)
 *   4. write content/scenes/<fixture>.json
 *
 * CI runs this then `git diff --exit-code content/` so pre-rendered scenes can
 * never silently drift from the engine.
 */
import { spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildScene } from '../packages/lens-scenes/src/index.ts';
import type { SemanticGraph, Trace } from '../packages/lens-scenes/src/types.ts';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

function runEngine(source: string, argsRepr: string[]): { graph: SemanticGraph; trace: Trace } {
  const tmp = mkdtempSync(join(tmpdir(), 'lol-rebuild-'));
  try {
    const inp = join(tmp, 'in.json');
    const outp = join(tmp, 'out.json');
    writeFileSync(inp, JSON.stringify({ source, argsRepr }), 'utf8');
    const candidates = ['python', 'python3', 'py'];
    let ran = false;
    let lastErr = '';
    for (const py of candidates) {
      const proc = spawnSync(py, ['tools/build_artifacts.py', inp, outp, '--engine-only'], {
        cwd: root,
        encoding: 'utf8',
      });
      if (proc.error) {
        lastErr = String(proc.error);
        continue;
      }
      if (proc.status === 0) {
        ran = true;
        break;
      }
      lastErr = proc.stderr || proc.stdout || `exit ${proc.status}`;
      // A non-zero exit from a resolved interpreter is a real engine failure.
      throw new Error(`engine failed: ${lastErr}`);
    }
    if (!ran) throw new Error(`could not run python engine: ${lastErr}`);
    return JSON.parse(readFileSync(outp, 'utf8')) as { graph: SemanticGraph; trace: Trace };
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }
}

const sceneIndex = JSON.parse(
  readFileSync(join(root, 'content', 'scene-index.json'), 'utf8'),
) as Record<string, { fixture: string; examplePath: string }>;

const outDir = join(root, 'content', 'scenes');
mkdirSync(outDir, { recursive: true });

for (const [sceneId, meta] of Object.entries(sceneIndex)) {
  const fixtureDir = join(root, meta.examplePath);
  const source = readFileSync(join(fixtureDir, 'source.py'), 'utf8');
  const call = JSON.parse(readFileSync(join(fixtureDir, 'call.json'), 'utf8')) as {
    argsRepr: string[];
  };
  const { graph, trace } = runEngine(source, call.argsRepr);
  const scene = buildScene(graph, trace, {
    sceneId,
    graphRef: meta.examplePath,
  });
  writeFileSync(join(outDir, `${meta.fixture}.json`), `${JSON.stringify(scene, null, 2)}\n`);
  console.log(`wrote content/scenes/${meta.fixture}.json steps=${scene.steps.length}`);
}
