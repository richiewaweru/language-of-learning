import { loadDemoPack } from '$lib/product/loadDemoPack';

export async function load() {
  return { pack: await loadDemoPack() };
}
