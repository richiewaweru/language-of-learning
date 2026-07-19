import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const MARKER = path.join('fixtures', 'accumulate', 'source.py');

/** Walk upward from `start` until the monorepo marker file is found. */
export function findRepoRootFrom(start: string): string | null {
  let dir = path.resolve(start);
  while (true) {
    if (existsSync(path.join(dir, MARKER))) return dir;
    const parent = path.dirname(dir);
    if (parent === dir) return null;
    dir = parent;
  }
}

function resolveRepoRoot(): string {
  const starts = [path.dirname(fileURLToPath(import.meta.url)), process.cwd()];
  for (const start of starts) {
    const root = findRepoRootFrom(start);
    if (root) return root;
  }
  throw new Error(
    'Repo root not found. Run the web app from the monorepo checkout that contains fixtures/.',
  );
}

/** Monorepo root where `fixtures/` and `content/` live. */
export const repoRoot = resolveRepoRoot();

export function assertRepoRoot(root: string = repoRoot): string {
  if (!existsSync(path.join(root, MARKER))) {
    throw new Error(`Repo root not found at ${root}.`);
  }
  return root;
}
