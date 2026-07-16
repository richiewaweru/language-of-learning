import { loadPathway } from '$lib/content';

export async function load() {
  const pathway = await loadPathway('how-loops-build-results');
  return { pathways: [pathway] };
}
