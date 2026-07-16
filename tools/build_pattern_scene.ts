/**
 * Server-side pattern + scene builder.
 *
 * Reads a JSON file `{ graph, trace, sceneId?, graphRef? }` and writes a JSON
 * file `{ pattern, scene }`. Invoked as a subprocess by tools/build_artifacts.py
 * so the FastAPI save path can recompute pattern + scene from source truth using
 * the same TS engine the client uses — never trusting client-supplied artifacts.
 *
 * usage: tsx tools/build_pattern_scene.ts <input.json> <output.json>
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { detectPattern } from '../packages/lens-patterns/src/index.ts';
import { buildScene } from '../packages/lens-scenes/src/index.ts';
import type { SemanticGraph, Trace } from '../packages/lens-scenes/src/types.ts';

const inputPath = process.argv[2];
const outputPath = process.argv[3];
if (!inputPath || !outputPath) {
  throw new Error('usage: tsx tools/build_pattern_scene.ts <input.json> <output.json>');
}

const input = JSON.parse(readFileSync(inputPath, 'utf8')) as {
  graph: SemanticGraph;
  trace: Trace;
  sceneId?: string | null;
  graphRef?: string | null;
};

const pattern = detectPattern(input.graph);
const options: { sceneId?: string; graphRef?: string } = {};
if (input.sceneId) options.sceneId = input.sceneId;
if (input.graphRef) options.graphRef = input.graphRef;
const scene = buildScene(input.graph, input.trace, options);

writeFileSync(outputPath, JSON.stringify({ pattern, scene }, null, 2), 'utf8');
