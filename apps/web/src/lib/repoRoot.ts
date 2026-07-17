import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const moduleDir = path.dirname(fileURLToPath(import.meta.url));

/** Monorepo root where `fixtures/` and `content/` live. */
export const repoRoot = path.resolve(moduleDir, '../../../..');

export function assertRepoRoot(root: string = repoRoot): string {
  if (!existsSync(path.join(root, 'fixtures', 'accumulate', 'source.py'))) {
    throw new Error(
      `Repo root not found at ${root}. Start the web app with pnpm --filter web dev from the monorepo root.`,
    );
  }
  return root;
}
