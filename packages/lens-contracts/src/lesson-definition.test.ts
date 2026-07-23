import { describe, expect, it } from 'vitest';
import { LessonDefinitionV1Schema } from './lesson.js';

const lesson = {
  schemaVersion: 1 as const,
  id: 'values-and-variables',
  slug: 'values-and-variables',
  version: '1.0.0',
  courseId: 'python-foundations',
  title: 'Values and Variables',
  goal: 'See how names preserve and reuse values.',
  sections: [{
    id: 'meet-values',
    heading: 'A value can have a name',
    internalRole: 'introduce' as const,
    blocks: [{ type: 'definition' as const, text: 'A variable is a name bound to a value.' }],
    showLens: false,
  }],
  lens: {
    initialProgram: {
      id: 'price-tax-total',
      language: 'python' as const,
      source: 'price = 100',
      argsText: '',
    },
    initialView: 'flow' as const,
    capabilities: {
      canEditSource: true,
      canPasteSource: true,
      canReplaceProgram: false,
      canRun: true,
      canReset: true,
      canUseFreeformInput: true,
      enabledViews: ['flow', 'state'] as const,
    },
  },
};

describe('LessonDefinitionV1', () => {
  it('accepts a typed lesson definition', () => {
    expect(LessonDefinitionV1Schema.parse(lesson).id).toBe('values-and-variables');
  });

  it('rejects duplicate sections and a disabled initial view', () => {
    expect(
      LessonDefinitionV1Schema.safeParse({
        ...lesson,
        sections: [...lesson.sections, lesson.sections[0]],
        lens: { ...lesson.lens, initialView: 'structure' },
      }).success,
    ).toBe(false);
  });
});
