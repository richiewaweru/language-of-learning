import { loadPathway } from '$lib/content';

export async function load() {
  const pathway = await loadPathway('python-foundations');
  return { pathways: [pathway] };
}
