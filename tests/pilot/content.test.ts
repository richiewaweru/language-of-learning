import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { describe, expect, test } from 'vitest';
import {
  course,
  examples,
  executableExampleIdsForLesson,
  lessons,
} from '../../apps/web/src/lib/pilot/course';
import { validatePilot } from '../../apps/web/src/lib/pilot/validation';
import { PILOT_STEP_TYPES } from '../../apps/web/src/lib/pilot/schema';

const root = process.cwd();

describe('four-lesson pilot content', () => {
  test('has exactly four lessons and the required nine-step order', () => {
    expect(validatePilot()).toEqual([]);
    expect(course.lessonIds).toEqual([
      'values-and-variables',
      'functions-and-returns',
      'conditions-and-branches',
      'loops-over-lists',
    ]);
    expect(lessons).toHaveLength(4);
    for (const lesson of lessons) {
      expect(lesson.steps.map((step) => step.type)).toEqual(PILOT_STEP_TYPES);
    }
  });

  test('steps 4–6 share the canonical example and authored mutations stay in-lesson', () => {
    for (const lesson of lessons) {
      expect(lesson.steps[3]?.exampleId).toBe(lesson.primaryExampleId);
      expect(lesson.steps[4]?.exampleId).toBe(lesson.primaryExampleId);
      expect(lesson.steps[5]?.exampleId).toBe(lesson.primaryExampleId);
      for (const id of executableExampleIdsForLesson(lesson.id)) {
        expect(examples[id]?.lessonId).toBe(lesson.id);
      }
    }
  });

  test('fixture source is identical to the authored source of truth', async () => {
    for (const lesson of lessons) {
      for (const id of executableExampleIdsForLesson(lesson.id)) {
        const fixtureSource = (
          await readFile(path.join(root, 'fixtures', 'pilot', id, 'source.py'), 'utf8')
        ).trimEnd();
        expect(fixtureSource).toBe(examples[id]?.code);
      }
    }
  });

  test('canonical lessons load unrelated code from no other lesson', () => {
    expect(examples[lessons[0]!.primaryExampleId]!.code).toContain('price = 100');
    expect(examples[lessons[0]!.primaryExampleId]!.code).not.toContain('def ');
    expect(examples[lessons[1]!.primaryExampleId]!.code).toContain('calculate_tax');
    expect(examples[lessons[2]!.primaryExampleId]!.code).toContain('classify_temperature');
    expect(examples[lessons[3]!.primaryExampleId]!.code).toContain('count_passing');
  });
});
