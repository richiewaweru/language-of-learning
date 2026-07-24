import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import {
  createBrowserLensPersistence,
  lensSessionStorageKey,
} from '../../apps/web/src/lib/lens/storage';
import {
  parseLensArgs,
  sourceHasModuleEntry,
} from '../../apps/web/src/lib/lens/input';
import { createRunCoordinator } from '../../apps/web/src/lib/lens/run-coordinator';
import { parseLensSessionSnapshot } from '@lol/lens-contracts';

describe('Lens workspace contracts', () => {
  it('creates distinct, versioned keys for every session identity', () => {
    const decode = lensSessionStorageKey({ kind: 'decode', ownerId: 'default' });
    const lesson = lensSessionStorageKey({
      kind: 'lesson',
      ownerId: 'python-values',
      sessionId: 'attempt-1',
    });
    expect(decode).toBe('lens:v1:decode:default');
    expect(lesson).toBe('lens:v1:lesson:python-values:attempt-1');
    expect(decode).not.toBe(lesson);
  });

  it('rejects unsafe key segments', () => {
    expect(() =>
      lensSessionStorageKey({ kind: 'harness', ownerId: '../shared' }),
    ).toThrow(/Invalid ownerId/);
  });

  it('round-trips valid snapshots and exposes malformed storage for contract validation', async () => {
    const values = new Map<string, string>();
    const persistence = createBrowserLensPersistence({
      getItem: (key) => values.get(key) ?? null,
      setItem: (key, value) => values.set(key, value),
      removeItem: (key) => void values.delete(key),
    });
    const stored = {
      schemaVersion: 1 as const,
      id: 'a',
      kind: 'harness' as const,
      source: 'x = 1',
      argsText: '',
      activeView: 'flow' as const,
      selection: { stepIndex: 0 },
      updatedAt: '2026-07-23T00:00:00.000Z',
    };
    await persistence.save('valid', stored);
    expect(await persistence.load('valid')).toEqual(stored);
    values.set('invalid', '{"schemaVersion":0}');
    const invalid = await persistence.load('invalid');
    expect(
      parseLensSessionSnapshot(invalid, {
        id: 'a',
        kind: 'harness',
        enabledViews: ['flow'],
      }).success,
    ).toBe(false);
  });

  it('parses nested argument representations and detects module entry', () => {
    expect(parseLensArgs('[1, 2], {"name": "a,b"}, "x,y"')).toEqual([
      '[1, 2]',
      '{"name": "a,b"}',
      '"x,y"',
    ]);
    expect(sourceHasModuleEntry('def double(value):\n    return value * 2')).toBe(false);
    expect(sourceHasModuleEntry('value = 2')).toBe(true);
  });

  it('rejects stale and reset-invalidated analysis generations', () => {
    const runs = createRunCoordinator();
    const first = runs.begin();
    const second = runs.begin();
    expect(runs.isCurrent(first)).toBe(false);
    expect(runs.isCurrent(second)).toBe(true);
    runs.invalidate();
    expect(runs.isCurrent(second)).toBe(false);
  });

  it('keeps engine and workspace boundaries route-agnostic', () => {
    const root = path.resolve('apps/web/src/lib/lens');
    const engine = readFileSync(path.join(root, 'engine.ts'), 'utf8');
    const workspace = readFileSync(path.join(root, 'LensWorkspace.svelte'), 'utf8');
    expect(engine).not.toMatch(/routes\/|lessonMode|isLesson|localStorage/);
    expect(workspace).not.toMatch(/routes\/decode|lessonMode|isLesson|localStorage/);
  });

  it('routes all foundational lessons through the shared lesson player', () => {
    const routeRoot = path.resolve('apps/web/src/routes/learn/[pathway]/[lesson]');
    const server = readFileSync(path.join(routeRoot, '+page.server.ts'), 'utf8');
    const page = readFileSync(path.join(routeRoot, '+page.svelte'), 'utf8');
    expect(server).toContain('loadLessonDefinition');
    expect(server).not.toContain("renderer: 'pilot'");
    expect(page).toContain('LessonPlayer');
    expect(page).not.toContain('LessonRenderer');
  });
});
