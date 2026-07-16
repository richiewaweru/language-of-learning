/**
 * Deterministic SVG captures for PM7 visual regression.
 * Includes motion-state annotations (returnValue, token count, branch results).
 */
import { mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildScene } from '../packages/lens-scenes/src/build-scene.ts';
import { deriveMotionState } from '../packages/lens-scenes/src/motion-state.ts';
import type { SemanticGraph, Trace } from '../packages/lens-scenes/src/types.ts';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const outDir = join(root, 'BUILD-LOG', 'assets', 'pm7');
mkdirSync(outDir, { recursive: true });

const HUE: Record<string, string> = {
  function: '#7653D6',
  binding: '#3757D5',
  collection: '#3757D5',
  loop: '#0E8A8A',
  branch: '#B0388A',
  operation: '#0E8A8A',
  mutation: '#B68428',
  return: '#2F7F58',
  value: '#3757D5',
  effect: '#D98E1F',
};

function load(name: string) {
  const base = join(root, 'fixtures', name);
  const graph = JSON.parse(readFileSync(join(base, 'expected.graph.json'), 'utf8')) as SemanticGraph;
  const trace = JSON.parse(readFileSync(join(base, 'expected.trace.json'), 'utf8')) as Trace;
  const scene = buildScene(graph, trace, { sceneId: name });
  return { graph, trace, scene };
}

function escapeXml(s: string) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function svgFor(name: string, phase: 'initial' | 'mid' | 'final' | 'reduced') {
  const { scene, graph, trace } = load(name);
  const stepIndex =
    phase === 'initial' || phase === 'reduced'
      ? 0
      : phase === 'final'
        ? scene.steps.length - 1
        : Math.floor(scene.steps.length / 2);
  const motion = deriveMotionState(scene, graph, trace, stepIndex);
  const step = scene.steps[stepIndex]!;
  const focus = new Set(step.focus);
  const bindings = trace.steps[stepIndex]?.bindings ?? {};
  const width = Math.max(...scene.layout.map((n) => n.x + n.width), 200) + 28;
  const height = Math.max(...scene.layout.map((n) => n.y + n.height), 120) + 48;

  const rects = scene.layout
    .map((n) => {
      const node = graph.nodes.find((g) => g.id === n.id);
      const stroke = HUE[n.kind] ?? '#17191F';
      const sw = focus.has(n.id) ? 3 : 1.5;
      const label = node?.name ?? node?.expr ?? n.kind;
      const value =
        node?.kind === 'binding' && node.name && bindings[node.name] !== undefined
          ? ` = ${bindings[node.name]}`
          : '';
      return `<g>
  <rect x="${n.x}" y="${n.y}" width="${n.width}" height="${n.height}" fill="#FFFDF8" stroke="${stroke}" stroke-width="${sw}" />
  <text x="${n.x + 6}" y="${n.y + 18}" font-family="ui-monospace,monospace" font-size="11" fill="${stroke}">${escapeXml(String(label) + value)}</text>
</g>`;
    })
    .join('\n');

  const meta = `tokens=${Object.keys(motion.tokens).length} return=${motion.returnValue ?? '—'} branches=${Object.keys(motion.branchResults).length}`;

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <rect width="100%" height="100%" fill="#F6F4EF"/>
  <text x="12" y="16" font-family="ui-monospace,monospace" font-size="10" fill="#6F7280">${name} · ${phase} · step ${stepIndex} · ${escapeXml(meta)}</text>
  ${rects}
</svg>
`;
}

const files: string[] = [];
for (const name of ['accumulate', 'filter'] as const) {
  for (const phase of ['initial', 'mid', 'final', 'reduced'] as const) {
    const file = `${name}-${phase}.svg`;
    writeFileSync(join(outDir, file), svgFor(name, phase), 'utf8');
    files.push(file);
  }
}

// Semantic asserts for accumulate final
{
  const { scene, graph, trace } = load('accumulate');
  const final = deriveMotionState(scene, graph, trace, scene.steps.length - 1);
  if (final.returnValue !== '10') {
    throw new Error(`accumulate final returnValue expected 10, got ${final.returnValue}`);
  }
  const mid = deriveMotionState(scene, graph, trace, 2);
  if (mid.returnValue !== undefined) {
    throw new Error('accumulate mid should not have returnValue yet');
  }
}

console.log(`Wrote ${files.length} SVGs to ${outDir}`);
files.forEach((f) => console.log(' ', f));
