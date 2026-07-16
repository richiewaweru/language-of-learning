import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { ContractSchemas } from '@lol/lens-contracts';

const FIXTURES_ROOT = join(import.meta.dirname, '..', '..', 'fixtures');
const PATTERNS = ['accumulate', 'count', 'filter', 'transform', 'search', 'guard'] as const;

const REQUIRED_FILES = [
  'source.py',
  'call.json',
  'expected.graph.json',
  'expected.trace.json',
  'expected.pattern.json',
  'expected.scene-actions.json',
] as const;

describe('golden fixture loader', () => {
  it('discovers six pattern directories with required files', () => {
    const dirs = readdirSync(FIXTURES_ROOT, { withFileTypes: true })
      .filter((d) => d.isDirectory() && d.name !== 'hostile')
      .map((d) => d.name)
      .sort();

    expect(dirs).toEqual([...PATTERNS].sort());
  });

  for (const pattern of PATTERNS) {
    it(`validates ${pattern} fixture shape`, () => {
      const dir = join(FIXTURES_ROOT, pattern);

      for (const file of REQUIRED_FILES) {
        expect(existsSync(join(dir, file)), `${pattern}/${file} missing`).toBe(true);
      }

      const graph = JSON.parse(readFileSync(join(dir, 'expected.graph.json'), 'utf8'));
      const trace = JSON.parse(readFileSync(join(dir, 'expected.trace.json'), 'utf8'));
      const patternHit = JSON.parse(readFileSync(join(dir, 'expected.pattern.json'), 'utf8'));
      const sceneActions = JSON.parse(
        readFileSync(join(dir, 'expected.scene-actions.json'), 'utf8'),
      );
      const call = JSON.parse(readFileSync(join(dir, 'call.json'), 'utf8'));

      expect(ContractSchemas.semanticGraph.parse(graph)).toBeDefined();
      expect(ContractSchemas.trace.parse(trace)).toBeDefined();
      expect(ContractSchemas.patternHit.parse(patternHit)).toBeDefined();
      expect(ContractSchemas.sceneActionsFixture.parse(sceneActions)).toBeDefined();
      expect(call).toHaveProperty('argsRepr');
      expect(Array.isArray(call.argsRepr)).toBe(true);
    });
  }

  it('reports 6/6 shape-valid fixtures', () => {
    let valid = 0;
    for (const pattern of PATTERNS) {
      const dir = join(FIXTURES_ROOT, pattern);
      const allPresent = REQUIRED_FILES.every((f) => existsSync(join(dir, f)));
      if (!allPresent) continue;
      try {
        ContractSchemas.semanticGraph.parse(
          JSON.parse(readFileSync(join(dir, 'expected.graph.json'), 'utf8')),
        );
        ContractSchemas.trace.parse(
          JSON.parse(readFileSync(join(dir, 'expected.trace.json'), 'utf8')),
        );
        ContractSchemas.patternHit.parse(
          JSON.parse(readFileSync(join(dir, 'expected.pattern.json'), 'utf8')),
        );
        ContractSchemas.sceneActionsFixture.parse(
          JSON.parse(readFileSync(join(dir, 'expected.scene-actions.json'), 'utf8')),
        );
        valid += 1;
      } catch {
        // counted as invalid
      }
    }
    expect(valid).toBe(6);
    console.log(`${valid}/6 fixtures shape-valid`);
  });
});

describe('fixture loader failure modes', () => {
  it('fails when a required schema field is invalid', () => {
    const badGraph = {
      version: '0.1',
      source: 'def f(): pass',
      nodes: [],
      relations: [],
      unsupported: [],
    };
    // Missing nodes is ok but invalid node kind should fail
    const invalid = {
      ...badGraph,
      nodes: [{ id: 'x', kind: 'invalid', sourceRange: { startLine: 1, startCol: 0, endLine: 1, endCol: 1 } }],
    };
    expect(ContractSchemas.semanticGraph.safeParse(invalid).success).toBe(false);
  });
});
