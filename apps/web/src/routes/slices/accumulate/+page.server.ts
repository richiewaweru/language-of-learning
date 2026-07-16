import path from 'node:path';
import { loadAccumulateVariants } from '$lib/loadSlice';

export async function load() {
  const root = path.resolve(process.cwd(), '..', '..');
  const variants = await loadAccumulateVariants(root);
  return { variants, pattern: 'ACCUMULATE' };
}
