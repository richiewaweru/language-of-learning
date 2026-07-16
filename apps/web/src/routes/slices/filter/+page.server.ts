import path from 'node:path';
import { loadFilterVariants } from '$lib/loadSlice';

export async function load() {
  const root = path.resolve(process.cwd(), '..', '..');
  const variants = await loadFilterVariants(root);
  return { variants, pattern: 'FILTER' };
}
