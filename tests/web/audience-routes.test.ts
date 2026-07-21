import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildScene } from '../../packages/lens-scenes/src/build-scene.ts';
import type { SemanticGraph, Trace } from '../../packages/lens-scenes/src/types.ts';

const repoRoot = path.resolve(fileURLToPath(new URL('../..', import.meta.url)));

describe('flagship demo data', () => {
  it('accumulate fixture has return 10 and 9 steps', () => {
    const base = path.join(repoRoot, 'fixtures', 'accumulate');
    const graph = JSON.parse(
      readFileSync(path.join(base, 'expected.graph.json'), 'utf8'),
    ) as SemanticGraph;
    const trace = JSON.parse(
      readFileSync(path.join(base, 'expected.trace.json'), 'utf8'),
    ) as Trace;
    const scene = buildScene(graph, trace, { sceneId: 'test' });
    expect(trace.result?.repr).toBe('10');
    expect(scene.steps.length).toBe(9);
    expect(readFileSync(path.join(base, 'source.py'), 'utf8')).toContain('numbers');
  });
});

describe('homepage contract', () => {
  it('homepage svelte has audience copy not skeleton', () => {
    const home = readFileSync(
      path.join(repoRoot, 'apps/web/src/routes/+page.svelte'),
      'utf8',
    );
    expect(home).toContain('See what code is doing');
    expect(home).not.toContain('v0.1 skeleton');
  });

  it('ProductHeader has four nav items max', () => {
    const header = readFileSync(
      path.join(repoRoot, 'apps/web/src/lib/product/ProductHeader.svelte'),
      'utf8',
    );
    expect(header).toContain('Learn');
    expect(header).toContain('Try Your Code');
    expect(header).not.toContain('Graph inspector');
    expect(header).not.toContain('slice');
  });
});

describe('public routes exist', () => {
  const routes = [
    'apps/web/src/routes/+page.svelte',
    'apps/web/src/routes/demo/+page.svelte',
    'apps/web/src/routes/how-it-works/+page.svelte',
    'apps/web/src/routes/about/+page.svelte',
    'apps/web/src/routes/learn/[pathway]/+page.svelte',
    'apps/web/src/routes/learn/[pathway]/[lesson]/+page.svelte',
    'apps/web/src/routes/decode/+page.svelte',
  ];

  it.each(routes)('%s exists', (route) => {
    expect(() => readFileSync(path.join(repoRoot, route), 'utf8')).not.toThrow();
  });
});
