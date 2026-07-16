import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { PatternHitSchema } from '@lol/lens-contracts';
import { detectPattern, RULE_VERSION } from '../src/index.js';
import type { SemanticGraph } from '../src/types.js';

const ROOT = join(import.meta.dirname, '..', '..', '..');
const FIXTURES = ['accumulate', 'count', 'filter', 'transform', 'search', 'guard'] as const;
const NEGATIVE_ROOT = join(ROOT, 'fixtures', 'negative');

function loadGraph(fixture: string): SemanticGraph {
  return JSON.parse(
    readFileSync(join(ROOT, 'fixtures', fixture, 'expected.graph.json'), 'utf8'),
  ) as SemanticGraph;
}

function loadExpectedPattern(fixture: string) {
  return JSON.parse(
    readFileSync(join(ROOT, 'fixtures', fixture, 'expected.pattern.json'), 'utf8'),
  );
}

describe('lens-patterns positive fixtures', () => {
  for (const fixture of FIXTURES) {
    it(`detects ${fixture} deterministically`, () => {
      const expected = loadExpectedPattern(fixture);
      const actual = detectPattern(loadGraph(fixture));
      expect(actual).not.toBeNull();
      const parsed = PatternHitSchema.parse(actual);
      expect(parsed.pattern).toBe(expected.pattern);
      expect(parsed.confidence).toBe('deterministic');
      expect(parsed.memberNodes).toEqual(expected.memberNodes);
      expect(parsed.related).toEqual(expected.related);
      expect(parsed.ruleVersion).toBe(RULE_VERSION);
    });
  }

  it('matches all six expected.pattern.json files (100% precision on positives)', () => {
    let matched = 0;
    for (const fixture of FIXTURES) {
      const expected = loadExpectedPattern(fixture);
      const actual = detectPattern(loadGraph(fixture));
      expect(actual?.pattern).toBe(expected.pattern);
      matched += 1;
    }
    expect(matched).toBe(6);
  });
});

describe('lens-patterns negative fixtures', () => {
  it('discovers negative fixture directories', () => {
    expect(existsSync(NEGATIVE_ROOT)).toBe(true);
    const dirs = readdirSync(NEGATIVE_ROOT, { withFileTypes: true })
      .filter((d) => d.isDirectory())
      .map((d) => d.name);
    expect(dirs.length).toBeGreaterThanOrEqual(2);
  });

  it('rejects lookalikes with zero false positives', () => {
    const dirs = readdirSync(NEGATIVE_ROOT, { withFileTypes: true })
      .filter((d) => d.isDirectory())
      .map((d) => d.name)
      .sort();

    let checked = 0;
    for (const name of dirs) {
      const dir = join(NEGATIVE_ROOT, name);
      const graph = JSON.parse(
        readFileSync(join(dir, 'expected.graph.json'), 'utf8'),
      ) as SemanticGraph;
      const expectation = JSON.parse(
        readFileSync(join(dir, 'expected.none.json'), 'utf8'),
      ) as { mustNotMatch: string[] };
      const hit = detectPattern(graph);
      for (const forbidden of expectation.mustNotMatch) {
        expect(hit?.pattern, `${name} must not match ${forbidden}`).not.toBe(forbidden);
      }
      checked += 1;
    }
    expect(checked).toBe(dirs.length);
    console.log(`negative precision 100% (${checked}/${checked} lookalikes rejected)`);
  });
});

describe('lens-patterns confidence contract', () => {
  it('never emits candidate confidence', () => {
    for (const fixture of FIXTURES) {
      const hit = detectPattern(loadGraph(fixture));
      expect(hit?.confidence).toBe('deterministic');
    }
  });

  it('has no candidate generation path in source', () => {
    const source = readFileSync(
      join(import.meta.dirname, '..', 'src', 'detect.ts'),
      'utf8',
    );
    expect(source).not.toMatch(/confidence:\s*['"]candidate['"]/);
    expect(source).not.toMatch(/generateCandidate|llm|openai|anthropic/i);
  });
});
