import { loadDemoPack } from '$lib/product/loadDemoPack';

export async function load() {
  const pack = await loadDemoPack();
  return { pack };
}
