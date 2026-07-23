import { error } from '@sveltejs/kit';
import { normalizeSemanticScene } from '@lol/lens-scenes';
import {
  course,
  examples,
  executableExampleIdsForLesson,
  lessons,
  lessonsById,
} from '$lib/pilot/course';
import '$lib/pilot/validation';
import { loadPilotExamplePack } from '$lib/pilot/server';
import { loadLessonDefinition } from '$lib/lesson-foundation/definitions';

export async function load({ params }: { params: { pathway: string; lesson: string } }) {
  if (params.pathway !== course.id) error(404, 'Pathway not found');
  const lesson = lessonsById[params.lesson];
  if (!lesson) error(404, 'Lesson not found');
  const phase2Definition = loadLessonDefinition(params.lesson);
  if (phase2Definition) {
    return {
      renderer: 'phase2' as const,
      definition: phase2Definition,
      lesson,
    };
  }
  const index = lessons.findIndex((entry) => entry.id === lesson.id);
  const packs = Object.fromEntries(
    await Promise.all(
      executableExampleIdsForLesson(lesson.id).map(async (id) => {
        const pack = await loadPilotExamplePack(id);
        return [
          id,
          {
            ...pack,
            semanticScene: normalizeSemanticScene(pack.graph, pack.trace, {
              sceneId: `semantic-pilot-${id}`,
            }),
          },
        ];
      }),
    ),
  );
  return {
    renderer: 'pilot' as const,
    course,
    lesson,
    lessons,
    examples,
    packs,
    previousLessonId: lessons[index - 1]?.id ?? null,
    nextLessonId: lessons[index + 1]?.id ?? null,
  };
}
