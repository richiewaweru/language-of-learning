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

  it.each([
    ['section', 'sections'],
    ['program', 'programs'],
    ['scenario', 'scenarios'],
    ['variation', 'variations'],
    ['cue', 'cues'],
    ['verification', 'verifications'],
    ['assessment', 'assessments'],
  ] as const)('rejects duplicate %s IDs', (label, collection) => {
    const lesson = structuredClone(loadLessonDefinition('conditions-and-branches'))!;
    lesson[collection].push(structuredClone(lesson[collection][0]) as never);
    const result = LessonDefinitionV4Schema.safeParse(lesson);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.map((issue) => issue.message)).toContain(
        `Duplicate ${label} id: ${lesson[collection][0].id}.`,
      );
    }
  });

  it('rejects duplicate response IDs and orphaned response records in either direction', () => {
    const duplicate = structuredClone(loadLessonDefinition('values-and-variables'))!;
    const responseBlock = duplicate.sections
      .flatMap((section) => section.blocks)
      .find((block) => 'responseId' in block)!;
    duplicate.sections[1].blocks.push(structuredClone(responseBlock));
    const duplicateResult = LessonDefinitionV4Schema.safeParse(duplicate);
    expect(duplicateResult.success).toBe(false);
    if (!duplicateResult.success) {
      expect(duplicateResult.error.issues.map((issue) => issue.message)).toContain(
        `Duplicate response id: ${responseBlock.responseId}.`,
      );
    }

    const orphanResponse = structuredClone(loadLessonDefinition('values-and-variables'))!;
    const orphanedResponseId = orphanResponse.assessments[0].responseId;
    orphanResponse.assessments = orphanResponse.assessments.slice(1);
    const responseResult = LessonDefinitionV4Schema.safeParse(orphanResponse);
    expect(responseResult.success).toBe(false);
    if (!responseResult.success) {
      expect(responseResult.error.issues.map((issue) => issue.message)).toContain(
        `Response ${orphanedResponseId} has no assessment record.`,
      );
    }

    const orphanAssessment = structuredClone(loadLessonDefinition('values-and-variables'))!;
    orphanAssessment.assessments[0].responseId = 'missing-response';
    const assessmentResult = LessonDefinitionV4Schema.safeParse(orphanAssessment);
    expect(assessmentResult.success).toBe(false);
    if (!assessmentResult.success) {
      expect(assessmentResult.error.issues.map((issue) => issue.message)).toContain(
        'Assessment references unknown response missing-response.',
      );
    }
  });

  it('validates all cue, variation, reveal, and assessment references', () => {
    const lesson = structuredClone(loadLessonDefinition('conditions-and-branches'))!;
    lesson.sections[0].lensCueId = 'missing-cue';
    lesson.cues[0].programId = 'missing-program';
    lesson.cues[1].revealPolicy = {
      responseId: 'missing-reveal',
      unlockAt: 'committed',
      concealedViews: ['state'],
      preCommitFrame: 'start',
    };
    lesson.variations[0].programId = 'missing-variation-program';
    lesson.variations[0].verificationIds = ['missing-verification'];
    const result = LessonDefinitionV4Schema.safeParse(lesson);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.map((issue) => issue.message)).toEqual(expect.arrayContaining([
        'Unknown Lens cue missing-cue.',
        'Unknown program missing-program.',
        'Unknown reveal response missing-reveal.',
        'Unknown variation program missing-variation-program.',
        'Unknown verification missing-verification.',
      ]));
    }
  });

  it('rejects an assessment whose type does not match its response block', () => {
    const lesson = structuredClone(loadLessonDefinition('values-and-variables'))!;
    const responseId = lesson.assessments[0].responseId;
    lesson.assessments[0] = {
      id: lesson.assessments[0].id,
      responseId,
      type: 'transfer',
      phase: 'pre',
      expectedOptionId: 'anything',
      successFeedback: 'Recorded.',
      retryFeedback: 'Recorded.',
    };
    const result = LessonDefinitionV4Schema.safeParse(lesson);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.map((issue) => issue.message)).toContain(
        `Assessment type transfer does not match value-prediction response ${responseId}.`,
      );
    }
  });

  it('keeps every complete lesson definition in its own V4 module', async () => {
    const modules = await Promise.all([
      import('../../apps/web/src/lib/lesson-foundation/lessons/values-and-variables'),
      import('../../apps/web/src/lib/lesson-foundation/lessons/functions-and-returns'),
      import('../../apps/web/src/lib/lesson-foundation/lessons/conditions-and-branches'),
      import('../../apps/web/src/lib/lesson-foundation/lessons/loops-over-lists'),
    ]);
    expect(modules.map((module) => module.lesson.schemaVersion)).toEqual([4, 4, 4, 4]);
  });
});
