import { loadFilterVariants } from '$lib/loadSlice';

export async function load() {
  const variants = await loadFilterVariants();
  return { variants, pattern: 'FILTER' };
}
