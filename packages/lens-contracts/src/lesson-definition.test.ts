import { describe, expect, it } from 'vitest';
import {
  LessonDefinitionV1Schema,
  LessonDefinitionV2Schema,
  LessonDefinitionV3Schema,
} from './lesson.js';

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

const lessonV2 = {
  schemaVersion: 2 as const,
  id: 'values',
  slug: 'values',
  version: '2.0.0',
  courseId: 'python',
  title: 'Values',
  goal: 'Follow values.',
  sections: [{
    id: 'predict',
    heading: 'Predict',
    internalRole: 'predict' as const,
    lensCueId: 'predict-cue',
    blocks: [{
      type: 'value-prediction' as const,
      responseId: 'prediction',
      prompt: 'Predict x.',
      fields: [{ id: 'x', label: 'x', expected: 1 }],
    }],
  }],
  programs: [{ id: 'base', source: 'x = 1', argsText: '' }],
  variations: [],
  cues: [{
    id: 'predict-cue',
    sectionId: 'predict',
    apply: 'initialize-once' as const,
    presentation: 'quiet' as const,
    mode: 'observe' as const,
    programId: 'base',
    editing: 'locked' as const,
  }],
  verifications: [],
};

describe('LessonDefinitionV2', () => {
  it('accepts a referenced cue and structured response', () => {
    expect(LessonDefinitionV2Schema.parse(lessonV2).schemaVersion).toBe(2);
  });

  it('rejects duplicate ids and unresolved references', () => {
    const result = LessonDefinitionV2Schema.safeParse({
      ...lessonV2,
      programs: [...lessonV2.programs, lessonV2.programs[0]],
      sections: [{ ...lessonV2.sections[0], lensCueId: 'missing' }],
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.map((issue) => issue.message)).toEqual(
        expect.arrayContaining(['Duplicate program id: base', 'Unknown Lens cue.']),
      );
    }
  });

  it.each([
    ['observe', 'free'],
    ['guided', 'authored-variations'],
    ['explore', 'locked'],
    ['build', 'locked'],
  ] as const)('rejects %s mode with %s editing', (mode, editing) => {
    expect(LessonDefinitionV2Schema.safeParse({
      ...lessonV2,
      cues: [{ ...lessonV2.cues[0], mode, editing }],
    }).success).toBe(false);
  });

  it('forbids a second production editor', () => {
    expect(LessonDefinitionV2Schema.safeParse({
      ...lessonV2,
      sections: [{
        ...lessonV2.sections[0],
        blocks: [{ type: 'production', prompt: 'Build', scaffold: 'x = ' }],
      }],
    }).success).toBe(false);
  });

  it('rejects cross-section cues, unresolved prediction references, and resetting guide cues', () => {
    const result = LessonDefinitionV2Schema.safeParse({
      ...lessonV2,
      sections: [
        lessonV2.sections[0],
        {
          ...lessonV2.sections[0],
          id: 'guide',
          lensCueId: 'guide-cue',
          blocks: [{ type: 'observation', text: 'Guide.' }],
        },
      ],
      variations: [{
        id: 'variant',
        label: 'Variant',
        programId: 'base',
        predictionId: 'missing-response',
      }],
      cues: [
        { ...lessonV2.cues[0], sectionId: 'guide' },
        {
          id: 'guide-cue',
          sectionId: 'guide',
          apply: 'guide-without-reset',
          presentation: 'visible',
          mode: 'guided',
          programId: 'base',
          editing: 'locked',
        },
      ],
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.map((issue) => issue.message)).toEqual(
        expect.arrayContaining([
          'Lens cue belongs to a different section.',
          'Unknown prediction response.',
          'guide-without-reset cannot replace the current program.',
        ]),
      );
    }
  });
});

const lessonV3 = {
  schemaVersion: 3 as const,
  id: 'generic',
  slug: 'generic',
  version: '3.0.0',
  courseId: 'python',
  title: 'Generic lesson',
  goal: 'Use definition-driven behavior.',
  lens: { initialProgramId: 'base', initialView: 'flow' as const },
  sections: [{
    id: 'predict',
    heading: 'Predict',
    internalRole: 'predict' as const,
    lensCueId: 'predict-cue',
    blocks: [{
      type: 'value-prediction' as const,
      responseId: 'prediction',
      prompt: 'Predict x.',
      fields: [{ id: 'x', label: 'x', expected: 1 }],
    }],
  }],
  programs: [
    { id: 'base', source: 'x = 1', argsText: '' },
    { id: 'changed', source: 'x = 2', argsText: '' },
  ],
  scenarios: [{
    id: 'changed-scenario',
    label: 'Changed',
    programId: 'changed',
    verificationIds: ['changed-value'],
  }],
  variations: [{
    id: 'changed',
    label: 'Changed',
    applyLabel: 'Apply changed value',
    programId: 'changed',
    predictionId: 'prediction',
    verificationIds: ['changed-value'],
    comparison: {
      kind: 'bindings' as const,
      baselineProgramId: 'base',
      fields: [{ key: 'x', label: 'x' }],
    },
    successFeedback: 'Changed as expected.',
    retryFeedback: 'Compare the values.',
  }],
  cues: [{
    id: 'predict-cue',
    sectionId: 'predict',
    apply: 'initialize-once' as const,
    presentation: 'quiet' as const,
    mode: 'observe' as const,
    programId: 'base',
    editing: 'locked' as const,
    revealPolicy: {
      responseId: 'prediction',
      unlockAt: 'committed' as const,
      concealedViews: ['state' as const, 'explain' as const, 'structure' as const],
      preCommitFrame: 'start' as const,
    },
  }],
  verifications: [{
    id: 'changed-value',
    type: 'binding-values' as const,
    expectedBindings: { x: '2' },
  }],
};

describe('LessonDefinitionV3', () => {
  it('accepts explicit initial ownership and definition-driven references', () => {
    expect(LessonDefinitionV3Schema.parse(lessonV3).schemaVersion).toBe(3);
  });

  it('rejects a missing initial program', () => {
    const result = LessonDefinitionV3Schema.safeParse({
      ...lessonV3,
      lens: { ...lessonV3.lens, initialProgramId: 'missing' },
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.map((issue) => issue.message)).toContain(
        'Initial program does not exist.',
      );
    }
  });

  it('rejects invalid scenario, comparison, and verification references', () => {
    const result = LessonDefinitionV3Schema.safeParse({
      ...lessonV3,
      scenarios: [{
        ...lessonV3.scenarios[0],
        programId: 'missing',
        verificationIds: ['missing'],
      }],
      variations: [{
        ...lessonV3.variations[0],
        verificationIds: ['missing'],
        comparison: {
          ...lessonV3.variations[0].comparison,
          baselineProgramId: 'missing',
        },
      }],
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.map((issue) => issue.message)).toEqual(
        expect.arrayContaining([
          'Unknown scenario program.',
          'Unknown verification: missing',
          'Unknown baseline program.',
        ]),
      );
    }
  });

  it('rejects reveal policies on Build cues', () => {
    expect(LessonDefinitionV3Schema.safeParse({
      ...lessonV3,
      cues: [{
        ...lessonV3.cues[0],
        mode: 'build',
        editing: 'free',
      }],
    }).success).toBe(false);
  });
});
