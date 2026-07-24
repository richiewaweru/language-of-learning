import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildScene } from '../../packages/lens-scenes/src/build-scene.ts';
import { normalizeSemanticScene } from '../../packages/lens-scenes/src/normalize-semantic-scene.ts';
import type { SemanticGraph, Trace } from '../../packages/lens-scenes/src/types.ts';
import { deriveFlowProjection } from '../../apps/web/src/lib/learner-ui/projection/deriveSemanticProjections.ts';
import {
  isLessonComplete,
  summarizePathwayProgress,
} from '../../apps/web/src/lib/product/lessonProgress.ts';

const repoRoot = path.resolve(fileURLToPath(new URL('../..', import.meta.url)));

describe('flagship demo data', () => {
  it('accumulate flagship fixture has return 20 and 11 steps', () => {
    const base = path.join(repoRoot, 'fixtures', 'accumulate');
    const graph = JSON.parse(
      readFileSync(path.join(base, 'expected.graph.json'), 'utf8'),
    ) as SemanticGraph;
    const trace = JSON.parse(
      readFileSync(path.join(base, 'expected.trace.json'), 'utf8'),
    ) as Trace;
    const scene = buildScene(graph, trace, { sceneId: 'test' });
    expect(trace.result?.repr).toBe('20');
    expect(scene.steps.length).toBe(11);
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
    const semanticScene = normalizeSemanticScene(graph, trace, { sceneId: 'test' });
    const projection = deriveFlowProjection(semanticScene, 3);
    expect(projection.collection.items).toEqual(['2', '4', '6', '8']);
    expect(projection.state.label).toBe('Running total');
    expect(projection.work.expression).toBe('total + number');
    const labelText = [
      projection.collection.label,
      projection.cursor.label,
      projection.state.label,
      projection.work.label,
    ].join(' ');
    expect(labelText).not.toMatch(/fn-|bind-|loop-L/);
  });

  it('keeps the result hidden when print fires', () => {
    const base = path.join(repoRoot, 'fixtures', 'print_total');
    const graph = JSON.parse(readFileSync(path.join(base, 'expected.graph.json'), 'utf8')) as SemanticGraph;
    const trace = JSON.parse(readFileSync(path.join(base, 'expected.trace.json'), 'utf8')) as Trace;
    const semanticScene = normalizeSemanticScene(graph, trace, { sceneId: 'print-test' });
    const projection = deriveFlowProjection(semanticScene, semanticScene.steps.length - 1);
    expect(projection.eventType).toBe('effect');
    expect(projection.result).toEqual({ visible: false, active: false });
  });
});

describe('pathway progress', () => {
  const lessons = [
    {
      slug: 'first',
      blocks: [
        { type: 'prediction' },
        { type: 'transferCheck', questions: [{ id: 'pattern' }] },
      ],
    },
    { slug: 'second', blocks: [{ type: 'prediction' }] },
    { slug: 'third', blocks: [{ type: 'text' }] },
    { slug: 'fourth', blocks: [{ type: 'prediction' }] },
  ];
  const empty = { completedSections: [], predictions: {}, transfers: {} };

  it('requires every trackable section and accepts the existing prediction alias', () => {
    expect(isLessonComplete(lessons[0].blocks, { ...empty, completedSections: ['prediction'] })).toBe(false);
    expect(
      isLessonComplete(lessons[0].blocks, {
        ...empty,
        completedSections: ['prediction', 'transfer-pattern'],
      }),
    ).toBe(true);
  });

  it('derives fresh, partial, and complete pathway summaries', () => {
    expect(summarizePathwayProgress(lessons, () => empty)).toMatchObject({
      completedLessons: 0,
      totalLessons: 4,
      percent: 0,
      currentSlug: 'first',
    });
    const partial = summarizePathwayProgress(lessons, (slug) =>
      slug === 'first'
        ? { ...empty, completedSections: ['prediction', 'transfer-pattern'] }
        : empty,
    );
    expect(partial).toMatchObject({ completedLessons: 1, percent: 25, currentSlug: 'second' });
    const complete = summarizePathwayProgress(lessons, (slug) => ({
      ...empty,
      completedSections:
        slug === 'first' ? ['prediction', 'transfer-pattern'] : ['prediction'],
    }));
    expect(complete).toMatchObject({ completedLessons: 3, percent: 75, currentSlug: 'third' });
  });

  it('has no current lesson when every trackable lesson is complete', () => {
    const trackableLessons = lessons.filter((lesson) => lesson.slug !== 'third');
    const complete = summarizePathwayProgress(trackableLessons, (slug) => ({
      ...empty,
      completedSections:
        slug === 'first' ? ['prediction', 'transfer-pattern'] : ['prediction'],
    }));
    expect(complete).toMatchObject({
      completedLessons: 3,
      totalLessons: 3,
      percent: 100,
      currentSlug: undefined,
    });
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
    expect(header).not.toMatch(/streak|XP/);
  });

  it('pathway page contains no fabricated progress chrome', () => {
    const pathway = readFileSync(
      path.join(repoRoot, 'apps/web/src/routes/learn/[pathway]/+page.svelte'),
      'utf8',
    );
    expect(pathway).not.toMatch(/32%|42 \/ 132|streak|\d+\s+min|locked/);
    expect(pathway).toContain('progress.completedLessonIds');
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
    expect(hooks).toContain('/learn/python-foundations/loops-over-lists');
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
