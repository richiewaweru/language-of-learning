import { z } from 'zod';

export const LearningEventTypeSchema = z.enum([
  'lesson_started',
  'section_opened',
  'prediction_drafted',
  'prediction_committed',
  'execution_revealed',
  'lens_view_changed',
  'lens_frame_changed',
  'variation_applied',
  'source_edited',
  'program_run',
  'verification_completed',
  'response_retried',
  'lesson_restarted',
  'transfer_submitted',
  'lesson_completed',
]);

export const LearningEventSchema = z.object({
  schemaVersion: z.literal(1),
  eventId: z.string().min(1),
  participantCode: z.string().min(1),
  attemptId: z.string().min(1),
  lessonId: z.string().min(1),
  lessonVersion: z.string().min(1),
  timestamp: z.string().datetime(),
  sequence: z.number().int().positive(),
  type: LearningEventTypeSchema,
  payload: z.record(z.string(), z.unknown()),
}).strict();

export const AttemptSummarySchema = z.object({
  attemptId: z.string().min(1),
  lessonId: z.string().min(1),
  startedAt: z.string().datetime(),
  completedAt: z.string().datetime().nullable(),
  firstPredictionCorrect: z.boolean().nullable(),
  finalPredictionCorrect: z.boolean().nullable(),
  buildSuccess: z.boolean(),
  buildRunCount: z.number().int().nonnegative(),
  failedCriteria: z.array(z.string()),
  framesVisited: z.number().int().nonnegative(),
  viewsUsed: z.array(z.string()),
  variationCount: z.number().int().nonnegative(),
  durationMs: z.number().int().nonnegative(),
  preTransferCorrect: z.boolean().nullable(),
  postTransferCorrect: z.boolean().nullable(),
}).strict();

export const PilotExportSchema = z.object({
  schemaVersion: z.literal(1),
  participantCode: z.string().min(1),
  generatedAt: z.string().datetime(),
  lessonVersions: z.record(z.string(), z.string()),
  attempts: z.array(z.object({
    attemptId: z.string(),
    lessonId: z.string(),
  }).strict()),
  events: z.array(LearningEventSchema),
  summaries: z.array(AttemptSummarySchema),
}).strict();

export type LearningEventType = z.infer<typeof LearningEventTypeSchema>;
export type LearningEvent = z.infer<typeof LearningEventSchema>;
export type AttemptSummary = z.infer<typeof AttemptSummarySchema>;
export type PilotExport = z.infer<typeof PilotExportSchema>;
