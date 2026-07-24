import { z } from 'zod';
import { LensSessionSnapshotSchema } from './workspace.js';

export const PredictionOptionSchema = z.object({
  id: z.string(),
  label: z.string(),
});

export const ComparisonRowSchema = z.object({
  label: z.string(),
  current: z.string(),
  neighbor: z.string(),
});

export const SummaryFieldSchema = z.object({
  key: z.string(),
  value: z.string(),
});

export const TransferQuestionSchema = z.object({
  id: z.string(),
  prompt: z.string(),
  answerKey: z.string(),
  rubric: z.string().optional(),
});

export const LessonBlockSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('text'), content: z.string() }),
  z.object({ type: z.literal('scene'), sceneId: z.string() }),
  z.object({ type: z.literal('check'), checkId: z.string() }),
  z.object({ type: z.literal('question'), text: z.string() }),
  z.object({ type: z.literal('staticPreview'), sceneId: z.string() }),
  z.object({
    type: z.literal('prediction'),
    sceneId: z.string(),
    prompt: z.string(),
    options: z.array(PredictionOptionSchema),
    correctId: z.string(),
  }),
  z.object({ type: z.literal('execution'), sceneId: z.string() }),
  z.object({
    type: z.literal('patternExplanation'),
    pattern: z.string(),
    steps: z.array(z.string()),
  }),
  z.object({ type: z.literal('variation'), variationId: z.string() }),
  z.object({
    type: z.literal('comparison'),
    neighborPattern: z.string(),
    rows: z.array(ComparisonRowSchema),
  }),
  z.object({
    type: z.literal('transferCheck'),
    variationId: z.string(),
    questions: z.array(TransferQuestionSchema),
  }),
  z.object({
    type: z.literal('summary'),
    fields: z.array(SummaryFieldSchema),
  }),
]);

export const TransferCheckSchema = z.object({
  id: z.string(),
  prompt: z.string(),
  answerKey: z.string(),
  rubric: z.string().optional(),
});

export const VerificationRecordSchema = z.object({
  verified_by: z.string(),
  verified_at: z.string().optional(),
  notes: z.string().optional(),
});

export const LessonRevisionSchema = z.object({
  version: z.string(),
  slug: z.string(),
  title: z.string(),
  difficulty: z.string().optional(),
  objectives: z.array(z.string()),
  prerequisites: z.array(z.string()).default([]),
  blocks: z.array(LessonBlockSchema),
  checks: z.array(TransferCheckSchema).default([]),
  verification: VerificationRecordSchema.optional(),
});

export type LessonRevision = z.infer<typeof LessonRevisionSchema>;
export type LessonBlock = z.infer<typeof LessonBlockSchema>;

export const LessonPedagogicalRoleSchema = z.enum([
  'introduce',
  'structural-model',
  'predict',
  'syntax-map',
  'observe',
  'guided-explore',
  'variation',
  'recognize',
  'produce',
]);

const LessonDefinitionBlockSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('prose'), paragraphs: z.array(z.string().min(1)).min(1) }),
  z.object({ type: z.literal('definition'), text: z.string().min(1) }),
  z.object({
    type: z.literal('code'),
    language: z.literal('python'),
    source: z.string(),
    caption: z.string().optional(),
  }),
  z.object({
    type: z.literal('code-shape'),
    title: z.string().optional(),
    rows: z.array(z.object({
      label: z.string().min(1),
      code: z.string(),
      explanation: z.string().min(1),
      tone: z.enum(['name', 'input', 'work', 'output', 'value']).optional(),
    })).min(1),
  }),
  z.object({
    type: z.literal('assignment-shape'),
    title: z.string().optional(),
    lines: z.array(z.object({
      source: z.string().min(1),
      target: z.string().min(1),
      operator: z.literal('='),
      expression: z.string().min(1),
      dependencies: z.array(z.string()),
    })).min(1),
  }),
  z.object({
    type: z.literal('callout'),
    label: z.string().optional(),
    text: z.string().min(1),
    tone: z.enum(['notice', 'idea', 'warning']),
  }),
  z.object({
    type: z.literal('prediction'),
    id: z.string().min(1),
    prompt: z.string().min(1),
    options: z.array(PredictionOptionSchema).optional(),
  }),
  z.object({ type: z.literal('observation'), text: z.string().min(1) }),
  z.object({
    type: z.literal('recognition'),
    prompt: z.string().min(1),
    source: z.string(),
  }),
  z.object({
    type: z.literal('production'),
    prompt: z.string().min(1),
    scaffold: z.string().optional(),
  }),
  z.object({
    type: z.literal('value-prediction'),
    responseId: z.string().min(1),
    prompt: z.string().min(1),
    fields: z.array(z.object({
      id: z.string().min(1),
      label: z.string().min(1),
      expected: z.number(),
    })).min(1),
  }),
  z.object({
    type: z.literal('variation-prediction'),
    responseId: z.string().min(1),
    prompt: z.string().min(1),
    options: z.array(z.string().min(1)).min(1),
    expected: z.array(z.string().min(1)).min(1),
    variationId: z.string().min(1),
  }),
  z.object({
    type: z.literal('recognition-check'),
    responseId: z.string().min(1),
    prompt: z.string().min(1),
    source: z.string().min(1),
    names: z.array(z.string().min(1)).min(2),
    startingNames: z.array(z.string().min(1)).min(1),
    derivedNames: z.array(z.string().min(1)).min(1),
  }),
  z.object({
    type: z.literal('build'),
    responseId: z.string().min(1),
    prompt: z.string().min(1),
    programId: z.string().min(1),
    verificationIds: z.array(z.string().min(1)).min(1),
  }),
]);

const LensCapabilitiesSchema = z.object({
  canEditSource: z.boolean(),
  canPasteSource: z.boolean(),
  canReplaceProgram: z.boolean(),
  canRun: z.boolean(),
  canReset: z.boolean(),
  canUseFreeformInput: z.boolean(),
  enabledViews: z.array(z.enum(['flow', 'state', 'explain', 'structure'])).min(1),
});

export const LessonDefinitionV1Schema = z.object({
  schemaVersion: z.literal(1),
  id: z.string().min(1),
  slug: z.string().min(1),
  version: z.string().min(1),
  courseId: z.string().min(1),
  title: z.string().min(1),
  subtitle: z.string().optional(),
  goal: z.string().min(1),
  sections: z.array(z.object({
    id: z.string().min(1),
    heading: z.string().min(1),
    internalRole: LessonPedagogicalRoleSchema,
    blocks: z.array(LessonDefinitionBlockSchema),
    showLens: z.boolean().optional(),
  })).min(1),
  lens: z.object({
    initialProgram: z.object({
      id: z.string().min(1),
      language: z.literal('python'),
      source: z.string(),
      argsText: z.string(),
    }),
    initialView: z.enum(['flow', 'state', 'explain', 'structure']),
    capabilities: LensCapabilitiesSchema,
  }),
}).superRefine((lesson, context) => {
  const sectionIds = new Set<string>();
  for (const section of lesson.sections) {
    if (sectionIds.has(section.id)) {
      context.addIssue({
        code: 'custom',
        path: ['sections'],
        message: `Duplicate lesson section id: ${section.id}`,
      });
    }
    sectionIds.add(section.id);
  }
  if (!lesson.lens.capabilities.enabledViews.includes(lesson.lens.initialView)) {
    context.addIssue({
      code: 'custom',
      path: ['lens', 'initialView'],
      message: 'Initial Lens view must be enabled.',
    });
  }
});

export type LessonPedagogicalRole = z.infer<typeof LessonPedagogicalRoleSchema>;
export type LessonDefinitionBlock = z.infer<typeof LessonDefinitionBlockSchema>;
export type LessonDefinitionV1 = z.infer<typeof LessonDefinitionV1Schema>;

export const LessonLensModeSchema = z.enum(['observe', 'guided', 'explore', 'build']);
export const LensPresentationSchema = z.enum(['quiet', 'visible', 'focus']);
export const LessonResponseStatusSchema = z.enum(['draft', 'committed', 'revealed']);

export const LessonResponseSchema = z.object({
  answer: z.string(),
  status: LessonResponseStatusSchema,
  correct: z.boolean().optional(),
  feedback: z.string().optional(),
});

export const LessonProgramSchema = z.object({
  id: z.string().min(1),
  source: z.string(),
  argsText: z.string(),
});

export const LessonVariationSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  programId: z.string().min(1),
  predictionId: z.string().min(1).optional(),
});

export const LessonLensCueSchema = z.object({
  id: z.string().min(1),
  sectionId: z.string().min(1),
  apply: z.enum(['initialize-once', 'guide-without-reset', 'replace-program']),
  presentation: LensPresentationSchema,
  mode: LessonLensModeSchema,
  programId: z.string().min(1).optional(),
  variationId: z.string().min(1).optional(),
  view: z.enum(['flow', 'state', 'explain', 'structure']).optional(),
  frame: z.union([z.number().int().nonnegative(), z.enum(['start', 'end'])]).optional(),
  editing: z.enum(['locked', 'authored-variations', 'free']),
  eyebrow: z.string().min(1).optional(),
  title: z.string().min(1).optional(),
  instruction: z.string().min(1).optional(),
  requiresResponseId: z.string().min(1).optional(),
});

export const LessonVerificationSchema = z.discriminatedUnion('type', [
  z.object({
    id: z.string().min(1),
    type: z.literal('execution-values'),
    expectedBindings: z.record(z.string(), z.unknown()),
  }),
  z.object({
    id: z.string().min(1),
    type: z.literal('assignment-dependencies'),
    requiredDependencies: z.record(z.string(), z.array(z.string())),
  }),
  z.object({
    id: z.string().min(1),
    type: z.literal('program-shape'),
    requiredAssignments: z.number().int().positive(),
    derivedTargets: z.array(z.string()),
  }),
]);

export const LessonDefinitionV2Schema = z.object({
  schemaVersion: z.literal(2),
  id: z.string().min(1),
  slug: z.string().min(1),
  version: z.string().min(1),
  courseId: z.string().min(1),
  title: z.string().min(1),
  subtitle: z.string().optional(),
  goal: z.string().min(1),
  sections: z.array(z.object({
    id: z.string().min(1),
    heading: z.string().min(1),
    internalRole: LessonPedagogicalRoleSchema,
    blocks: z.array(LessonDefinitionBlockSchema),
    lensCueId: z.string().min(1),
  })).min(1),
  programs: z.array(LessonProgramSchema).min(1),
  variations: z.array(LessonVariationSchema).default([]),
  cues: z.array(LessonLensCueSchema).min(1),
  verifications: z.array(LessonVerificationSchema).default([]),
}).superRefine((lesson, context) => {
  function unique(items: readonly { id: string }[], path: string, label: string) {
    const ids = new Set<string>();
    items.forEach((item, index) => {
      if (ids.has(item.id)) {
        context.addIssue({
          code: 'custom',
          path: [path, index, 'id'],
          message: `Duplicate ${label} id: ${item.id}`,
        });
      }
      ids.add(item.id);
    });
    return ids;
  }

  const sectionIds = unique(lesson.sections, 'sections', 'section');
  const programIds = unique(lesson.programs, 'programs', 'program');
  const variationIds = unique(lesson.variations, 'variations', 'variation');
  const cueIds = unique(lesson.cues, 'cues', 'cue');
  const verificationIds = unique(lesson.verifications, 'verifications', 'verification');
  const responseIds = new Set<string>();

  lesson.sections.forEach((section, sectionIndex) => {
    if (!cueIds.has(section.lensCueId)) {
      context.addIssue({ code: 'custom', path: ['sections', sectionIndex, 'lensCueId'], message: 'Unknown Lens cue.' });
    } else if (lesson.cues.find((cue) => cue.id === section.lensCueId)?.sectionId !== section.id) {
      context.addIssue({ code: 'custom', path: ['sections', sectionIndex, 'lensCueId'], message: 'Lens cue belongs to a different section.' });
    }
    section.blocks.forEach((block, blockIndex) => {
      if (block.type === 'production') {
        context.addIssue({
          code: 'custom',
          path: ['sections', sectionIndex, 'blocks', blockIndex],
          message: 'V2 production must use the shared Lens Build editor.',
        });
      }
      if ('responseId' in block) {
        if (responseIds.has(block.responseId)) {
          context.addIssue({
            code: 'custom',
            path: ['sections', sectionIndex, 'blocks', blockIndex, 'responseId'],
            message: `Duplicate response id: ${block.responseId}`,
          });
        }
        responseIds.add(block.responseId);
      }
      if (block.type === 'variation-prediction' && !variationIds.has(block.variationId)) {
        context.addIssue({ code: 'custom', path: ['sections', sectionIndex, 'blocks', blockIndex, 'variationId'], message: 'Unknown variation.' });
      }
      if (block.type === 'build') {
        if (!programIds.has(block.programId)) {
          context.addIssue({ code: 'custom', path: ['sections', sectionIndex, 'blocks', blockIndex, 'programId'], message: 'Unknown Build program.' });
        }
        block.verificationIds.forEach((id) => {
          if (!verificationIds.has(id)) {
            context.addIssue({ code: 'custom', path: ['sections', sectionIndex, 'blocks', blockIndex, 'verificationIds'], message: `Unknown verification: ${id}` });
          }
        });
      }
    });
  });

  lesson.variations.forEach((variation, index) => {
    if (!programIds.has(variation.programId)) {
      context.addIssue({ code: 'custom', path: ['variations', index, 'programId'], message: 'Unknown program.' });
    }
    if (variation.predictionId && !responseIds.has(variation.predictionId)) {
      context.addIssue({ code: 'custom', path: ['variations', index, 'predictionId'], message: 'Unknown prediction response.' });
    }
  });

  lesson.cues.forEach((cue, index) => {
    if (!sectionIds.has(cue.sectionId)) {
      context.addIssue({ code: 'custom', path: ['cues', index, 'sectionId'], message: 'Unknown section.' });
    }
    if (cue.programId && !programIds.has(cue.programId)) {
      context.addIssue({ code: 'custom', path: ['cues', index, 'programId'], message: 'Unknown program.' });
    }
    if (cue.variationId && !variationIds.has(cue.variationId)) {
      context.addIssue({ code: 'custom', path: ['cues', index, 'variationId'], message: 'Unknown variation.' });
    }
    if (cue.requiresResponseId && !responseIds.has(cue.requiresResponseId)) {
      context.addIssue({ code: 'custom', path: ['cues', index, 'requiresResponseId'], message: 'Unknown response.' });
    }
    const expectedEditing = cue.mode === 'explore'
      ? 'authored-variations'
      : cue.mode === 'build'
        ? 'free'
        : 'locked';
    if (cue.editing !== expectedEditing) {
      context.addIssue({
        code: 'custom',
        path: ['cues', index, 'editing'],
        message: `${cue.mode} mode requires ${expectedEditing} editing.`,
      });
    }
    if (cue.apply !== 'guide-without-reset' && !cue.programId && !cue.variationId) {
      context.addIssue({
        code: 'custom',
        path: ['cues', index],
        message: `${cue.apply} requires a program or variation.`,
      });
    }
    if (cue.apply === 'guide-without-reset' && (cue.programId || cue.variationId)) {
      context.addIssue({
        code: 'custom',
        path: ['cues', index],
        message: 'guide-without-reset cannot replace the current program.',
      });
    }
  });
});

export type LessonDefinitionV2 = z.infer<typeof LessonDefinitionV2Schema>;
export type LessonLensMode = z.infer<typeof LessonLensModeSchema>;
export type LensPresentation = z.infer<typeof LensPresentationSchema>;
export type LessonResponse = z.infer<typeof LessonResponseSchema>;
export type LessonLensCue = z.infer<typeof LessonLensCueSchema>;
export type LessonVerification = z.infer<typeof LessonVerificationSchema>;
export type AnyLessonDefinition = LessonDefinitionV1 | LessonDefinitionV2;

// Re-exported here to keep lesson and session persistence contracts discoverable together.
export const DurableLessonLensSnapshotSchema = LensSessionSnapshotSchema;
