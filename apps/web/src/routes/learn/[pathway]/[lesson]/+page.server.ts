import { error } from '@sveltejs/kit';
import { loadLessonDefinition } from '$lib/lesson-foundation/definitions';

export function load({ params }: { params: { pathway: string; lesson: string } }) {
  const definition = loadLessonDefinition(params.lesson);
  if (!definition || definition.courseId !== params.pathway) {
    error(404, 'Lesson not found');
  }
  return { definition };
}
