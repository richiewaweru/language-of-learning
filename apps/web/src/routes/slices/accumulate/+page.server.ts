import { loadAccumulateVariants } from '$lib/loadSlice';

export async function load() {
  const variants = await loadAccumulateVariants();
  return { variants, pattern: 'ACCUMULATE' };
}
