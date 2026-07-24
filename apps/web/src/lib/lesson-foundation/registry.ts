import type { LessonDefinitionV4 } from '@lol/lens-contracts';
import { lesson as valuesAndVariables } from './lessons/values-and-variables';
import { lesson as functionsAndReturns } from './lessons/functions-and-returns';
import { lesson as conditionsAndBranches } from './lessons/conditions-and-branches';
import { lesson as loopsOverLists } from './lessons/loops-over-lists';

const lessons = Object.freeze([
  valuesAndVariables,
  functionsAndReturns,
  conditionsAndBranches,
  loopsOverLists,
] satisfies LessonDefinitionV4[]);

const lessonRegistry = new Map(lessons.map((lesson) => [lesson.slug, lesson]));

export function loadLessonDefinition(slug: string): LessonDefinitionV4 | null {
  return lessonRegistry.get(slug) ?? null;
}

export function listLessonDefinitions(): LessonDefinitionV4[] {
  return [...lessons];
}
