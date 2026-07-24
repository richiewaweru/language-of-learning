import { describe, expect, it } from 'vitest';
import {
  LearningEventSchema,
  PilotExportSchema,
  type AssessmentPhase,
  type AssessmentType,
  type LearningEvent,
  type LearningEventType,
  type StudyContext,
} from '@lol/lens-contracts';
import {
  createLearningEventStore,
  deriveAttemptSummaries,
} from '../../apps/web/src/lib/lesson-foundation/pilot-events';
import {
  EVENTS_KEY,
  LEGACY_EVENTS_KEY,
  LEGACY_PARTICIPANT_KEY,
  STUDY_CONTEXT_KEY,
} from '../../apps/web/src/lib/lesson-foundation/pilot-study';

class MemoryStorage implements Storage {
  values = new Map<string, string>();
  failWrites = false;
  get length() { return this.values.size; }
  clear() { this.values.clear(); }
  getItem(key: string) { return this.values.get(key) ?? null; }
  key(index: number) { return [...this.values.keys()][index] ?? null; }
  removeItem(key: string) { this.values.delete(key); }
  setItem(key: string, value: string) {
    if (this.failWrites) throw new DOMException('quota exceeded', 'QuotaExceededError');
    this.values.set(key, value);
  }
}

const study: StudyContext = {
  studyId: 'lens-phase-6-pilot',
  studyVersion: '1.0.0',
  conditionId: 'guided-lens-v1',
  releaseId: 'phase-6-pilot-v1',
  facilitatorSessionId: 'facilitator-1',
  participantCode: 'P-SAMPLE01',
  consentAcknowledgedAt: '2026-07-24T08:00:00.000Z',
};

const prediction = {
  assessmentId: 'prediction-1',
  assessmentType: 'prediction' as const,
  phase: 'lesson' as const,
};
const build = {
  assessmentId: 'build-1',
  assessmentType: 'build' as const,
  phase: 'lesson' as const,
};

function event(
  sequence: number,
  type: LearningEventType,
  timestamp: string,
  payload: Record<string, unknown> = {},
  assessment?: {
    assessmentId: string;
    assessmentType: AssessmentType;
    phase: AssessmentPhase;
  },
): LearningEvent {
  return LearningEventSchema.parse({
    schemaVersion: 2,
    eventId: `event-${sequence}`,
    ...study,
    attemptId: 'attempt-1',
    lessonId: 'values-and-variables',
    lessonVersion: '4.0.0',
    timestamp,
    sequence,
    type,
    assessmentId: assessment?.assessmentId ?? null,
    assessmentType: assessment?.assessmentType ?? null,
    phase: assessment?.phase ?? null,
    payload,
  });
}

function createStore(storage = new MemoryStorage(), activeStudy: StudyContext | null = study) {
  return {
    storage,
    store: createLearningEventStore(storage, {
      attemptId: 'attempt-1',
      lessonId: 'values-and-variables',
      lessonVersion: '4.0.0',
    }, activeStudy),
  };
}

describe('Phase 6 local pilot event stream', () => {
  it('records nothing and creates no participant identity without consent', () => {
    const { storage, store } = createStore(new MemoryStorage(), null);
    expect(store.participantCode).toBeNull();
    expect(store.append('lesson_started').status).toBe('rejected');
    expect(store.list()).toEqual([]);
    expect(storage.length).toBe(0);
  });

  it('appends monotonic assessment-tagged events and exports deterministic integrity', async () => {
    const { store } = createStore();
    store.append('lesson_started', {}, 'start');
    store.append('lesson_started', {}, 'start');
    store.append('prediction_committed', { correct: false }, undefined, prediction);
    store.append('execution_revealed', { correct: false }, undefined, prediction);
    store.append('build_submission_completed', {
      correct: true,
      sourceHash: 'hash',
      failedCriteria: [],
    }, undefined, build);
    expect(store.list().map((item) => item.sequence)).toEqual([1, 2, 3, 4]);
    const first = await store.exportData();
    const second = await store.exportData();
    expect(PilotExportSchema.parse(first).participantCode).toBe(study.participantCode);
    expect(first.contentHash).toBe(second.contentHash);
    expect(first.exportId).not.toBe(second.exportId);
    expect(first.integrity.eventCount).toBe(4);
    expect(first.lessonVersions).toEqual({ 'values-and-variables': ['4.0.0'] });
    expect(JSON.stringify(first.events)).not.toMatch(/"source"|"sourceText"/);
  });

  it('uses only primary prediction and Build completion events in golden summaries', () => {
    const events = [
      event(1, 'lesson_started', '2026-07-24T08:00:00.000Z'),
      event(2, 'execution_revealed', '2026-07-24T08:00:10.000Z', { correct: true }, {
        assessmentId: 'recognition-1',
        assessmentType: 'recognition',
        phase: 'lesson',
      }),
      event(3, 'prediction_committed', '2026-07-24T08:00:30.000Z', { correct: false }, prediction),
      event(4, 'execution_revealed', '2026-07-24T08:00:45.000Z', { correct: false }, prediction),
      event(5, 'guided_started', '2026-07-24T08:01:00.000Z'),
      event(6, 'lens_frame_changed', '2026-07-24T08:06:00.000Z', { frame: 2 }),
      event(7, 'guided_completed', '2026-07-24T08:06:30.000Z'),
      event(8, 'verification_completed', '2026-07-24T08:07:00.000Z', {
        correct: true,
        failedCriteria: [],
      }, build),
      event(9, 'build_submission_completed', '2026-07-24T08:08:00.000Z', {
        correct: false,
        failedCriteria: ['derived-role', 'derived-role'],
      }, build),
      event(10, 'response_retried', '2026-07-24T08:08:10.000Z', {}, build),
      event(11, 'build_submission_completed', '2026-07-24T08:09:00.000Z', {
        correct: true,
        failedCriteria: [],
      }, build),
      event(12, 'facilitator_intervention', '2026-07-24T08:09:10.000Z', {
        category: 'navigation',
        assistanceLevel: 'prompt',
      }),
      event(13, 'lesson_completed', '2026-07-24T08:10:00.000Z'),
    ];
    const [summary] = deriveAttemptSummaries(events);
    expect(summary).toMatchObject({
      firstPredictionCorrect: false,
      finalPredictionCorrect: false,
      buildSuccess: true,
      buildSubmissionCount: 2,
      failedCriteriaCounts: { 'derived-role': 2 },
      retryCount: 1,
      interventionCount: 1,
      timeToFirstPredictionMs: 30_000,
      predictionToRevealMs: 15_000,
      guidedDurationMs: 120_000,
      timeToBuildSuccessMs: 540_000,
      wallClockDurationMs: 600_000,
    });
    expect(summary.activeDurationMs).toBe(420_000);
  });

  it('summarizes pre/post transfer and exports every lesson version', async () => {
    const storage = new MemoryStorage();
    const first = createLearningEventStore(storage, {
      attemptId: 'attempt-1',
      lessonId: 'values-and-variables',
      lessonVersion: '4.0.0',
    }, study);
    first.append('lesson_started');
    first.append('transfer_submitted', { correct: false }, undefined, {
      assessmentId: 'pre-transfer',
      assessmentType: 'transfer',
      phase: 'pre',
    });
    first.append('transfer_submitted', { correct: true }, undefined, {
      assessmentId: 'post-transfer',
      assessmentType: 'transfer',
      phase: 'post',
    });
    const second = createLearningEventStore(storage, {
      attemptId: 'attempt-2',
      lessonId: 'loops-over-lists',
      lessonVersion: '4.1.0',
    }, study);
    second.append('lesson_started');
    const exported = await second.exportData();
    expect(exported.lessonVersions).toEqual({
      'loops-over-lists': ['4.1.0'],
      'values-and-variables': ['4.0.0'],
    });
    expect(exported.attempts).toHaveLength(2);
    expect(exported.summaries.find((item) => item.attemptId === 'attempt-1')).toMatchObject({
      preTransferCorrect: false,
      postTransferCorrect: true,
    });
  });

  it('queues failed writes, preserves sequence, and recovers on a later append', () => {
    const storage = new MemoryStorage();
    storage.failWrites = true;
    const { store } = createStore(storage);
    expect(store.append('lesson_started').status).toBe('queued');
    expect(store.status()).toMatchObject({ mode: 'queued', queuedCount: 1 });
    storage.failWrites = false;
    expect(store.append('section_opened', { sectionId: 'intro' }).status).toBe('persisted');
    expect(store.list().map((item) => item.sequence)).toEqual([1, 2]);
    expect(store.status().mode).toBe('healthy');
  });

  it('does not overwrite malformed storage and marks its export degraded', async () => {
    const storage = new MemoryStorage();
    storage.setItem(EVENTS_KEY, '{malformed');
    const { store } = createStore(storage);
    store.append('lesson_started');
    expect(store.status().mode).toBe('degraded');
    expect(storage.getItem(EVENTS_KEY)).toBe('{malformed');
    expect((await store.exportData()).integrity.storageDegraded).toBe(true);
  });

  it('rejects new events after the bounded memory queue is exhausted', () => {
    const storage = new MemoryStorage();
    storage.failWrites = true;
    const { store } = createStore(storage);
    for (let index = 0; index < 500; index += 1) {
      expect(store.append('section_opened', { index }).status).toBe('queued');
    }
    expect(store.append('section_opened', { index: 500 })).toMatchObject({
      status: 'rejected',
      reason: 'queue-full',
    });
  });

  it('deletes current study state while leaving isolated legacy keys untouched', () => {
    const { storage, store } = createStore();
    storage.setItem(STUDY_CONTEXT_KEY, JSON.stringify(study));
    storage.setItem(LEGACY_PARTICIPANT_KEY, 'P-LEGACY1');
    storage.setItem(LEGACY_EVENTS_KEY, '[]');
    storage.setItem('lesson:v4:local:values:4.0.0:active', 'attempt');
    storage.setItem('lens:v1:lesson:attempt:primary', '{}');
    store.append('lesson_started');
    store.deleteParticipantData();
    expect(storage.getItem(EVENTS_KEY)).toBeNull();
    expect(storage.getItem(STUDY_CONTEXT_KEY)).toBeNull();
    expect(storage.getItem('lesson:v4:local:values:4.0.0:active')).toBeNull();
    expect(storage.getItem('lens:v1:lesson:attempt:primary')).toBeNull();
    expect(storage.getItem(LEGACY_PARTICIPANT_KEY)).toBe('P-LEGACY1');
    expect(storage.getItem(LEGACY_EVENTS_KEY)).toBe('[]');
  });
});
