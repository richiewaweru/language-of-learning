import { readFile } from 'node:fs/promises';
import path from 'node:path';

const FIXTURES = ['accumulate', 'count', 'filter', 'transform', 'search', 'guard'] as const;

export async function load() {
  const root = path.resolve(process.cwd(), '..', '..');
  const fixtures = await Promise.all(
    FIXTURES.map(async (name) => {
      const base = path.join(root, 'fixtures', name);
      const [source, graph] = await Promise.all([
        readFile(path.join(base, 'source.py'), 'utf8'),
        readFile(path.join(base, 'expected.graph.json'), 'utf8'),
      ]);
      return {
        name,
        source: source.trimEnd(),
        graph,
      };
    }),
  );

  return { fixtures };
}
