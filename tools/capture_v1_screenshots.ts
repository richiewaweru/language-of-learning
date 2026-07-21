/**
 * V1 visual regression — flagship accumulate states.
 */
import { mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildScene, deriveMotionState, deriveLearnerCaption } from '../packages/lens-scenes/src/index.ts';
import type { SemanticGraph, Trace } from '../packages/lens-scenes/src/types.ts';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const outDir = join(root, 'BUILD-LOG', 'assets', 'v1');
mkdirSync(outDir, { recursive: true });

const STEP_NAMES = [
  'initial',
  'function_entered',
  'state_initialized',
  'first_item_active',
  'first_state_update',
  'middle_iteration',
  'final_state',
  'return_exit',
];

function load() {
  const base = join(root, 'fixtures', 'accumulate');
  const graph = JSON.parse(readFileSync(join(base, 'expected.graph.json'), 'utf8')) as SemanticGraph;
  const trace = JSON.parse(readFileSync(join(base, 'expected.trace.json'), 'utf8')) as Trace;
  const scene = buildScene(graph, trace, { sceneId: 'v1-flagship' });
  return { graph, trace, scene };
}

const { graph, trace, scene } = load();
const indices = [0, 0, 1, 2, 3, 5, 7, 8];

indices.forEach((stepIndex, i) => {
  const step = trace.steps[stepIndex]!;
  const motion = deriveMotionState(scene, graph, trace, stepIndex);
  const caption = deriveLearnerCaption(graph, step, trace, scene.steps[stepIndex]);
  const name = STEP_NAMES[i] ?? `step-${stepIndex}`;
  const svg = `<!-- v1 ${name} step=${stepIndex} return=${trace.result?.repr} tokens=${motion.tokens.length} -->
<svg xmlns="http://www.w3.org/2000/svg" width="400" height="120">
  <text x="8" y="24" font-family="monospace" font-size="12">${name}</text>
  <text x="8" y="48" font-family="sans-serif" font-size="11">${caption.slice(0, 80)}</text>
  <text x="8" y="72" font-family="monospace" font-size="10">bindings: ${JSON.stringify(step.bindings)}</text>
</svg>`;
  writeFileSync(join(outDir, `${name}.svg`), svg, 'utf8');
  console.log(`wrote ${name}.svg`);
});

console.log(`V1 captures: ${indices.length} SVGs in BUILD-LOG/assets/v1`);
