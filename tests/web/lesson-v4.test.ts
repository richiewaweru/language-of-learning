import { describe, expect, it } from 'vitest';
import {
  LessonDefinitionBlockV4Schema,
  LessonDefinitionV4Schema,
} from '@lol/lens-contracts';
import {
  listLessonDefinitions,
  loadLessonDefinition,
} from '../../apps/web/src/lib/lesson-foundation/registry';

describe('V4 lesson assessment boundary', () => {
  it('exposes exactly four registry-backed lessons', () => {
    const lessons = listLessonDefinitions();
    expect(lessons).toHaveLength(4);
    expect(lessons.map((lesson) => lesson.slug)).toEqual([
      'values-and-variables',
      'functions-and-returns',
      'conditions-and-branches',
      'loops-over-lists',
    ]);
    for (const lesson of lessons) {
      expect(LessonDefinitionV4Schema.parse(lesson)).toBeTruthy();
      expect(loadLessonDefinition(lesson.slug)).toBe(lesson);
    }
  });

  it('keeps grading keys out of presentation blocks', () => {
    for (const lesson of listLessonDefinitions()) {
      for (const block of lesson.sections.flatMap((section) => section.blocks)) {
        expect('expected' in block).toBe(false);
        expect('expectedRole' in block).toBe(false);
        expect('successFeedback' in block).toBe(false);
        expect('retryFeedback' in block).toBe(false);
        expect('verificationIds' in block).toBe(false);
      }
    }
  });

  it('strictly rejects answer keys added to a presentation block', () => {
    expect(LessonDefinitionBlockV4Schema.safeParse({
      type: 'value-prediction',
      responseId: 'prediction',
      prompt: 'Predict.',
      fields: [{ id: 'answer', label: 'answer' }],
      expected: { answer: 4 },
    }).success).toBe(false);
  });

  it('uses failing scaffolds and role-based Build assessments', () => {
    const sources = Object.fromEntries(listLessonDefinitions().map((lesson) => {
      const build = lesson.sections.flatMap((section) => section.blocks)
        .find((block) => block.type === 'build');
      const program = build?.type === 'build'
        ? lesson.programs.find((item) => item.id === build.programId)
        : undefined;
      const assessment = build?.type === 'build'
        ? lesson.assessments.find((item) => item.responseId === build.responseId)
        : undefined;
      expect(assessment?.type).toBe('build');
      if (assessment?.type === 'build') expect(assessment.namePolicy).toBe('role-based');
      return [lesson.id, program?.source ?? ''];
    }));
    expect(sources['values-and-variables']).toContain('result = 0');
    expect(sources['functions-and-returns']).toContain('result = 0');
    expect(sources['conditions-and-branches']).toContain('status = ""');
    expect(sources['loops-over-lists']).toContain('total = total');
  });

  it('uses branch IDs rather than numeric branch prediction', () => {
    const lesson = loadLessonDefinition('conditions-and-branches');
    const block = lesson?.sections.flatMap((section) => section.blocks)
      .find((item) => item.type === 'prediction');
    expect(block?.type).toBe('prediction');
    if (block?.type === 'prediction') {
      expect(block.options.map((option) => option.id)).toEqual(['if-branch', 'else-branch']);
    }
  });
});
