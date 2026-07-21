import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildScene } from '../../packages/lens-scenes/src/build-scene.ts';
import type { SemanticGraph, Trace } from '../../packages/lens-scenes/src/types.ts';
import { deriveLearnerProjection } from '../../apps/web/src/lib/learner-ui/projection/deriveLearnerProjection.ts';

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

describe('learner projection', () => {
  it('derives flow steps from accumulate trace without node ids in labels', () => {
    const base = path.join(repoRoot, 'fixtures', 'accumulate');
    const graph = JSON.parse(
      readFileSync(path.join(base, 'expected.graph.json'), 'utf8'),
    ) as SemanticGraph;
    const trace = JSON.parse(
      readFileSync(path.join(base, 'expected.trace.json'), 'utf8'),
    ) as Trace;
    const scene = buildScene(graph, trace, { sceneId: 'test' });
    const projection = deriveLearnerProjection(graph, trace, scene, 3);
    expect(projection.flowSteps.length).toBeGreaterThanOrEqual(4);
    expect(projection.flowSteps.some((s) => s.kind === 'input')).toBe(true);
    expect(projection.flowSteps.some((s) => s.kind === 'state')).toBe(true);
    const labelText = projection.flowSteps.map((s) => s.label).join(' ');
    expect(labelText).not.toMatch(/fn-|bind-|loop-L/);
  });
});

describe('homepage contract', () => {
  it('homepage svelte has audience copy not skeleton', () => {
    const home = readFileSync(
      path.join(repoRoot, 'apps/web/src/routes/+page.svelte'),
      'utf8',
    );
    expect(home).toContain('Learn by seeing');
    expect(home).not.toContain('v0.1 skeleton');
  });

  it('AppHeader has Learn Decode Library nav', () => {
    const header = readFileSync(
      path.join(repoRoot, 'apps/web/src/lib/learner-ui/shell/AppHeader.svelte'),
      'utf8',
    );
    expect(header).toContain('Learn');
    expect(header).toContain('Decode');
    expect(header).toContain('Library');
    expect(header).not.toContain('Graph inspector');
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
    'apps/web/src/routes/learn/[pathway]/[module]/[lesson]/+page.svelte',
    'apps/web/src/routes/decode/+page.svelte',
    'apps/web/src/routes/library/+page.svelte',
    'apps/web/src/routes/internal/style-gallery/+page.svelte',
  ];

  it.each(routes)('%s exists', (route) => {
    expect(() => readFileSync(path.join(repoRoot, route), 'utf8')).not.toThrow();
  });
});

describe('route redirects', () => {
  it('hooks.server defines legacy pathway redirects', () => {
    const hooks = readFileSync(
      path.join(repoRoot, 'apps/web/src/hooks.server.ts'),
      'utf8',
    );
    expect(hooks).toContain('/learn/how-loops-build-results/accumulate');
    expect(hooks).toContain('/learn/python-foundations/loops/accumulate');
  });
});

describe('design tokens', () => {
  it('includes learner UI brand tokens', () => {
    const tokens = readFileSync(path.join(repoRoot, 'docs/design-tokens.css'), 'utf8');
    expect(tokens).toContain('--brand-blue:');
    expect(tokens).toContain('#faf9f6');
    expect(tokens).toContain('Source Serif 4');
  });
});
