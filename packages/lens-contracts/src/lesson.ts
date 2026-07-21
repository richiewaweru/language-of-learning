import { z } from 'zod';

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
