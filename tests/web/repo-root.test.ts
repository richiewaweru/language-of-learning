import { existsSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { assertRepoRoot, repoRoot } from '../../apps/web/src/lib/repoRoot.ts';

describe('repoRoot', () => {
  it('points at the monorepo root regardless of process.cwd()', () => {
    expect(existsSync(path.join(repoRoot, 'fixtures', 'accumulate', 'source.py'))).toBe(true);
    expect(existsSync(path.join(repoRoot, 'content', 'pathways', 'how-loops-build-results.json'))).toBe(
      true,
    );
    expect(assertRepoRoot()).toBe(repoRoot);
  });
});
