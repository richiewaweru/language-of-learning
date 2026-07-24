import { z } from 'zod';

export const PILOT_EXPORT_SCHEMA_VERSION = 2 as const;
export const PILOT_EVENT_SCHEMA_VERSION = 2 as const;

export const StudyContextSchema = z.object({
  studyId: z.string().min(1),
  studyVersion: z.string().min(1),
  conditionId: z.string().min(1),
  releaseId: z.string().min(1),
  facilitatorSessionId: z.string().min(1),
  participantCode: z.string().min(1),
  consentAcknowledgedAt: z.string().datetime(),
}).strict();

export const AssessmentTypeSchema = z.enum([
  'prediction',
  'selection',
  'recognition',
  'build',
  'transfer',
]);

export const AssessmentPhaseSchema = z.enum(['pre', 'lesson', 'post']);

export const LearningEventTypeSchema = z.enum([
  'lesson_started',
  'section_opened',
  'guided_started',
  'guided_completed',
  'prediction_drafted',
  'prediction_committed',
  'execution_revealed',
  'lens_view_changed',
  'lens_frame_changed',
  'variation_applied',
  'source_edited',
  'program_run',
  'verification_completed',
  'build_submission_completed',
  'response_retried',
  'lesson_restarted',
  'transfer_submitted',
  'facilitator_intervention',
  'lesson_completed',
]);

export const ResponseLearningEventTypeSchema = z.enum([
  'prediction_drafted',
  'prediction_committed',
  'execution_revealed',
  'variation_applied',
  'verification_completed',
  'build_submission_completed',
  'response_retried',
  'transfer_submitted',
]);

const responseEventTypes = new Set<string>(ResponseLearningEventTypeSchema.options);

export const LearningEventSchema = z.object({
  schemaVersion: z.literal(PILOT_EVENT_SCHEMA_VERSION),
  eventId: z.string().min(1),
  studyId: z.string().min(1),
  studyVersion: z.string().min(1),
  conditionId: z.string().min(1),
  releaseId: z.string().min(1),
  facilitatorSessionId: z.string().min(1),
  consentAcknowledgedAt: z.string().datetime(),
  participantCode: z.string().min(1),
  attemptId: z.string().min(1),
  lessonId: z.string().min(1),
  lessonVersion: z.string().min(1),
  timestamp: z.string().datetime(),
  sequence: z.number().int().positive(),
  type: LearningEventTypeSchema,
  assessmentId: z.string().min(1).nullable(),
  assessmentType: AssessmentTypeSchema.nullable(),
  phase: AssessmentPhaseSchema.nullable(),
  payload: z.record(z.string(), z.unknown()),
}).strict().superRefine((event, context) => {
  if (
    responseEventTypes.has(event.type)
    && (!event.assessmentId || !event.assessmentType || !event.phase)
  ) {
    context.addIssue({
      code: 'custom',
      path: ['assessmentId'],
      message: `Response event ${event.type} requires assessmentId, assessmentType, and phase.`,
    });
  }
});

export const FailedCriteriaCountsSchema = z.record(
  z.string(),
  z.number().int().nonnegative(),
);

export const AttemptSummarySchema = z.object({
  attemptId: z.string().min(1),
  lessonId: z.string().min(1),
  lessonVersion: z.string().min(1),
  startedAt: z.string().datetime(),
  completedAt: z.string().datetime().nullable(),
  firstPredictionCorrect: z.boolean().nullable(),
  finalPredictionCorrect: z.boolean().nullable(),
  buildSuccess: z.boolean(),
  buildSubmissionCount: z.number().int().nonnegative(),
  failedCriteriaCounts: FailedCriteriaCountsSchema,
  retryCount: z.number().int().nonnegative(),
  interventionCount: z.number().int().nonnegative(),
  framesVisited: z.number().int().nonnegative(),
  viewsUsed: z.array(z.string()),
  variationCount: z.number().int().nonnegative(),
  wallClockDurationMs: z.number().int().nonnegative(),
  activeDurationMs: z.number().int().nonnegative(),
  timeToFirstPredictionMs: z.number().int().nonnegative().nullable(),
  predictionToRevealMs: z.number().int().nonnegative().nullable(),
  guidedDurationMs: z.number().int().nonnegative(),
  timeToBuildSuccessMs: z.number().int().nonnegative().nullable(),
  preTransferCorrect: z.boolean().nullable(),
  postTransferCorrect: z.boolean().nullable(),
}).strict();

export const PilotExportSchema = z.object({
  schemaVersion: z.literal(PILOT_EXPORT_SCHEMA_VERSION),
  exportId: z.string().min(1),
  generatedAt: z.string().datetime(),
  study: StudyContextSchema,
  participantCode: z.string().min(1),
  lessonVersions: z.record(z.string(), z.array(z.string().min(1)).min(1)),
  attempts: z.array(z.object({
    attemptId: z.string().min(1),
    lessonId: z.string().min(1),
    lessonVersion: z.string().min(1),
  }).strict()),
  events: z.array(LearningEventSchema),
  summaries: z.array(AttemptSummarySchema),
  integrity: z.object({
    eventCount: z.number().int().nonnegative(),
    firstEventAt: z.string().datetime().nullable(),
    lastEventAt: z.string().datetime().nullable(),
    storageDegraded: z.boolean(),
  }).strict(),
  contentHash: z.string().regex(/^[a-f0-9]{64}$/),
}).strict();

export function canonicalizeForHash(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonicalizeForHash);
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, item]) => [key, canonicalizeForHash(item)]),
    );
  }
  return value;
}

export function stableStringify(value: unknown): string {
  return JSON.stringify(canonicalizeForHash(value));
}

export type StudyContext = z.infer<typeof StudyContextSchema>;
export type AssessmentType = z.infer<typeof AssessmentTypeSchema>;
export type AssessmentPhase = z.infer<typeof AssessmentPhaseSchema>;
export type LearningEventType = z.infer<typeof LearningEventTypeSchema>;
export type LearningEvent = z.infer<typeof LearningEventSchema>;
export type AttemptSummary = z.infer<typeof AttemptSummarySchema>;
export type PilotExport = z.infer<typeof PilotExportSchema>;
