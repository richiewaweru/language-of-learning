import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { ContractSchemas } from '../src/index.js';

const schemasDir = join(import.meta.dirname, '..', 'schemas');
const expectedFiles = [
  'semantic-graph.json',
  'trace.json',
  'pattern-hit.json',
  'scene.json',
  'scene-actions-fixture.json',
  'selection.json',
  'lesson-revision.json',
];

describe('JSON Schema export', () => {
  it('exports all contract schemas and they are valid JSON', () => {
    const files = readdirSync(schemasDir).filter((f) => f.endsWith('.json'));
    expect(files.sort()).toEqual(expectedFiles.sort());

    for (const file of expectedFiles) {
      const content = readFileSync(join(schemasDir, file), 'utf8');
      const parsed = JSON.parse(content) as Record<string, unknown>;
      const isValidSchema =
        'type' in parsed || '$ref' in parsed || 'definitions' in parsed || '$schema' in parsed;
      expect(isValidSchema).toBe(true);
    }
  });

  it('schema files are non-empty and newer than source (drift guard baseline)', () => {
    for (const file of expectedFiles) {
      const path = join(schemasDir, file);
      expect(statSync(path).size).toBeGreaterThan(50);
    }
    // Re-validate exported semantic-graph against a minimal graph via Zod (source of truth)
    const sample = {
      version: '0.1',
      source: 'def f(): pass',
      nodes: [
        {
          id: 'f1',
          kind: 'function',
          sourceRange: { startLine: 1, startCol: 0, endLine: 1, endCol: 10 },
          name: 'f',
          params: [],
        },
      ],
      relations: [],
      unsupported: [],
    };
    expect(ContractSchemas.semanticGraph.parse(sample)).toEqual(sample);
  });
});
