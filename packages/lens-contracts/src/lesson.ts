import { z } from 'zod';

export const LessonBlockSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('text'),
    content: z.string(),
  }),
  z.object({
    type: z.literal('scene'),
    sceneId: z.string(),
  }),
  z.object({
    type: z.literal('check'),
    checkId: z.string(),
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
  objectives: z.array(z.string()),
  prerequisites: z.array(z.string()).default([]),
  blocks: z.array(LessonBlockSchema),
  checks: z.array(TransferCheckSchema).default([]),
  verification: VerificationRecordSchema.optional(),
});

export type LessonRevision = z.infer<typeof LessonRevisionSchema>;
