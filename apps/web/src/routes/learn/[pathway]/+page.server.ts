import { error } from '@sveltejs/kit';
import { listLessonDefinitions } from '$lib/lesson-foundation/registry';

const pathway = {
  id: 'python-foundations',
  title: 'Python Foundations',
  summary: 'Four foundational lessons for reading, predicting, varying, recognizing, and building supported Python.',
};

export function load({ params }: { params: { pathway: string } }) {
  if (params.pathway !== pathway.id) error(404, 'Pathway not found');
  return {
    pathway,
    lessons: listLessonDefinitions().map((lesson, index) => ({
      id: lesson.slug,
      order: index + 1,
      title: lesson.title,
      summary: lesson.subtitle ?? lesson.goal,
    })),
  };
}
