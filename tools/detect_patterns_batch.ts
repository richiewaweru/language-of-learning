import { readFileSync, writeFileSync } from 'node:fs';
import { detectPattern } from '../packages/lens-patterns/src/detect.ts';
import type { SemanticGraph } from '../packages/lens-patterns/src/types.ts';

const inputPath = process.argv[2];
const outputPath = process.argv[3];
if (!inputPath || !outputPath) {
  throw new Error('usage: detect_patterns_batch.ts <input.json> <output.json>');
}

const graphs = JSON.parse(readFileSync(inputPath, 'utf8')) as Record<string, SemanticGraph>;
const result: Record<string, string | null> = {};
for (const [name, graph] of Object.entries(graphs)) {
  result[name] = detectPattern(graph)?.pattern ?? null;
}
writeFileSync(outputPath, JSON.stringify(result, null, 2), 'utf8');
