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

// Re-exported here to keep lesson and session persistence contracts discoverable together.
export const DurableLessonLensSnapshotSchema = LensSessionSnapshotSchema;
