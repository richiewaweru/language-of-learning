import { course, examples, lessons } from './course';
import { PILOT_STEP_TYPES } from './schema';

export function validatePilot(): string[] {
  const errors: string[] = [];
  if (lessons.length !== 4) errors.push(`Expected exactly 4 lessons, got ${lessons.length}.`);
  if (course.lessonIds.join('|') !== lessons.map((lesson) => lesson.id).join('|')) {
    errors.push('Course lesson order does not match lesson definitions.');
  }
  for (const [index, lesson] of lessons.entries()) {
    if (lesson.order !== index + 1) errors.push(`${lesson.id}: invalid order.`);
    const types = lesson.steps.map((step) => step.type);
    if (types.join('|') !== PILOT_STEP_TYPES.join('|')) {
      errors.push(`${lesson.id}: the nine required steps are missing or out of order.`);
    }
    for (const step of lesson.steps) {
      for (const id of [
        ...(step.exampleId ? [step.exampleId] : []),
        ...(step.mutationIds ?? []),
        ...(step.exampleIds ?? []),
      ]) {
        const fixture = examples[id];
        if (!fixture) errors.push(`${lesson.id}: unknown example ${id}.`);
        else if (fixture.lessonId !== lesson.id) {
          errors.push(`${lesson.id}: example ${id} belongs to ${fixture.lessonId}.`);
        }
      }
    }
  }
  return errors;
}

const errors = validatePilot();
if (errors.length) throw new Error(`Invalid four-lesson pilot:\n${errors.join('\n')}`);
