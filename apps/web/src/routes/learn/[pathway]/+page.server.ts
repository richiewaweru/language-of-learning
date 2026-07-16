import { loadPathway, loadLesson } from '$lib/content';
import { error } from '@sveltejs/kit';

export async function load({ params }: { params: { pathway: string } }) {
  try {
    const pathway = await loadPathway(params.pathway);
    const lessons = await Promise.all(pathway.lessonSlugs.map((slug) => loadLesson(slug)));
    return { pathway, lessons };
  } catch {
    error(404, 'Pathway not found');
  }
}
