import {
  LearningEventSchema,
  PilotExportSchema,
  stableStringify,
  type AssessmentPhase,
  type AssessmentType,
  type AttemptSummary,
  type LearningEvent,
  type LearningEventType,
  type PilotExport,
  type StudyContext,
} from '@lol/lens-contracts';
import { EVENTS_KEY, STUDY_CONTEXT_KEY } from './pilot-study';

const MAX_MEMORY_QUEUE = 500;
const ACTIVE_GAP_CAP_MS = 120_000;

export type AssessmentEventContext = {
  assessmentId: string;
  assessmentType: AssessmentType;
  phase: AssessmentPhase;
};

export type AppendResult = {
  status: 'persisted' | 'queued' | 'rejected';
  event: LearningEvent | null;
  reason?: string;
};

export type PersistenceStatus = {
  mode: 'disabled' | 'healthy' | 'queued' | 'degraded';
  queuedCount: number;
  warning: string | null;
};

function elapsed(start: LearningEvent | undefined, end: LearningEvent | undefined) {
  if (!start || !end) return null;
  return Math.max(0, Date.parse(end.timestamp) - Date.parse(start.timestamp));
}

function cappedDuration(events: readonly LearningEvent[]) {
  let total = 0;
  for (let index = 1; index < events.length; index += 1) {
    total += Math.min(
      ACTIVE_GAP_CAP_MS,
      Math.max(0, Date.parse(events[index].timestamp) - Date.parse(events[index - 1].timestamp)),
    );
  }
  return total;
}

function guidedDuration(events: readonly LearningEvent[]) {
  let total = 0;
  let started: LearningEvent | undefined;
  for (const event of events) {
    if (event.type === 'guided_started') started = event;
    if (event.type === 'guided_completed' && started) {
      total += Math.min(ACTIVE_GAP_CAP_MS, elapsed(started, event) ?? 0);
      started = undefined;
    }
  }
  if (started && events.at(-1)) {
    total += Math.min(ACTIVE_GAP_CAP_MS, elapsed(started, events.at(-1)) ?? 0);
  }
  return total;
}

export function deriveAttemptSummaries(events: readonly LearningEvent[]): AttemptSummary[] {
  const groups = new Map<string, LearningEvent[]>();
  for (const event of events) {
    groups.set(event.attemptId, [...(groups.get(event.attemptId) ?? []), event]);
  }
  return [...groups.values()].map((items) => {
    const ordered = [...items].sort((left, right) => left.sequence - right.sequence);
    const started = ordered.find((event) => event.type === 'lesson_started') ?? ordered[0];
    const last = ordered.at(-1) ?? started;
    const completed = ordered.findLast((event) => event.type === 'lesson_completed');
    const predictionCommits = ordered.filter((event) =>
      event.type === 'prediction_committed' && event.assessmentType === 'prediction');
    const predictionReveals = ordered.filter((event) =>
      event.type === 'execution_revealed' && event.assessmentType === 'prediction');
    const firstCommit = predictionCommits[0];
    const matchingReveal = firstCommit
      ? predictionReveals.find((event) =>
          event.assessmentId === firstCommit.assessmentId && event.sequence >= firstCommit.sequence)
      : undefined;
    const buildSubmissions = ordered.filter((event) =>
      event.type === 'build_submission_completed' && event.assessmentType === 'build');
    const buildSuccess = buildSubmissions.find((event) => event.payload.correct === true);
    const failedCriteriaCounts: Record<string, number> = {};
    for (const event of buildSubmissions) {
      if (!Array.isArray(event.payload.failedCriteria)) continue;
      for (const criterion of event.payload.failedCriteria) {
        if (typeof criterion === 'string') {
          failedCriteriaCounts[criterion] = (failedCriteriaCounts[criterion] ?? 0) + 1;
        }
      }
    }
    const views = [...new Set(ordered.flatMap((event) =>
      event.type === 'lens_view_changed' && typeof event.payload.view === 'string'
        ? [event.payload.view]
        : []))];
    const frames = new Set(ordered.flatMap((event) =>
      event.type === 'lens_frame_changed' && typeof event.payload.frame === 'number'
        ? [event.payload.frame]
        : []));
    const transfers = ordered.filter((event) =>
      event.type === 'transfer_submitted' && event.assessmentType === 'transfer');
    const transferCorrect = (phase: 'pre' | 'post') => {
      const item = transfers.findLast((event) => event.phase === phase);
      return typeof item?.payload.correct === 'boolean' ? item.payload.correct : null;
    };
    const predictionCorrect = (event: LearningEvent | undefined) =>
      typeof event?.payload.correct === 'boolean' ? event.payload.correct : null;
    return {
      attemptId: started.attemptId,
      lessonId: started.lessonId,
      lessonVersion: started.lessonVersion,
      startedAt: started.timestamp,
      completedAt: completed?.timestamp ?? null,
      firstPredictionCorrect: predictionCorrect(predictionReveals[0]),
      finalPredictionCorrect: predictionCorrect(predictionReveals.at(-1)),
      buildSuccess: Boolean(buildSuccess),
      buildSubmissionCount: buildSubmissions.length,
      failedCriteriaCounts,
      retryCount: ordered.filter((event) => event.type === 'response_retried').length,
      interventionCount: ordered.filter((event) => event.type === 'facilitator_intervention').length,
      framesVisited: frames.size,
      viewsUsed: views,
      variationCount: ordered.filter((event) => event.type === 'variation_applied').length,
      wallClockDurationMs: elapsed(started, completed ?? last) ?? 0,
      activeDurationMs: cappedDuration(ordered),
      timeToFirstPredictionMs: elapsed(started, firstCommit),
      predictionToRevealMs: elapsed(firstCommit, matchingReveal),
      guidedDurationMs: guidedDuration(ordered),
      timeToBuildSuccessMs: elapsed(started, buildSuccess),
      preTransferCorrect: transferCorrect('pre'),
      postTransferCorrect: transferCorrect('post'),
    };
  });
}

async function sha256(value: string) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
  return [...new Uint8Array(digest)]
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

function readPersistedEvents(storage: Storage): {
  events: LearningEvent[];
  malformed: boolean;
  warning: string | null;
} {
  try {
    const raw = storage.getItem(EVENTS_KEY);
    if (!raw) return { events: [], malformed: false, warning: null };
    const value: unknown = JSON.parse(raw);
    if (!Array.isArray(value)) {
      return { events: [], malformed: true, warning: 'Stored pilot events are malformed.' };
    }
    const events: LearningEvent[] = [];
    for (const item of value) {
      const parsed = LearningEventSchema.safeParse(item);
      if (!parsed.success) {
        return { events: [], malformed: true, warning: 'Stored pilot events failed schema validation.' };
      }
      events.push(parsed.data);
    }
    return { events, malformed: false, warning: null };
  } catch (error) {
    return {
      events: [],
      malformed: true,
      warning: `Stored pilot events could not be read: ${
        error instanceof Error ? error.message : String(error)
      }`,
    };
  }
}

export type LearningEventStore = ReturnType<typeof createLearningEventStore>;

export function createFacilitatorEventStore(
  storage: Storage,
  study: StudyContext,
): LearningEventStore {
  const events = readPersistedEvents(storage).events
    .filter((event) => event.participantCode === study.participantCode);
  const latest = events.at(-1);
  return createLearningEventStore(storage, {
    attemptId: latest?.attemptId ?? 'facilitator-session',
    lessonId: latest?.lessonId ?? 'unassigned',
    lessonVersion: latest?.lessonVersion ?? 'unassigned',
  }, study);
}

export function createLearningEventStore(
  storage: Storage,
  context: {
    attemptId: string;
    lessonId: string;
    lessonVersion: string;
  },
  study: StudyContext | null,
) {
  const initial = study
    ? readPersistedEvents(storage)
    : { events: [] as LearningEvent[], malformed: false, warning: null };
  let persisted = initial.events;
  let queued: LearningEvent[] = [];
  let malformed = initial.malformed;
  let warning = initial.warning;

  function status(): PersistenceStatus {
    if (!study) return { mode: 'disabled', queuedCount: 0, warning: null };
    if (malformed) return { mode: 'degraded', queuedCount: queued.length, warning };
    if (queued.length) return { mode: 'queued', queuedCount: queued.length, warning };
    return { mode: 'healthy', queuedCount: 0, warning: null };
  }

  function list() {
    return [...persisted, ...queued];
  }

  function flush() {
    if (!study || malformed || queued.length === 0) return false;
    try {
      const merged = [...persisted, ...queued];
      storage.setItem(EVENTS_KEY, JSON.stringify(merged));
      persisted = merged;
      queued = [];
      warning = null;
      return true;
    } catch (error) {
      warning = `Pilot evidence is queued in memory because storage failed: ${
        error instanceof Error ? error.message : String(error)
      }`;
      return false;
    }
  }

  function append(
    type: LearningEventType,
    payload: Record<string, unknown> = {},
    dedupeKey?: string,
    assessment?: AssessmentEventContext,
  ): AppendResult {
    if (!study) return { status: 'rejected', event: null, reason: 'recording-disabled' };
    if (dedupeKey && list().some((event) =>
      event.attemptId === context.attemptId && event.payload.dedupeKey === dedupeKey)) {
      return { status: 'rejected', event: null, reason: 'duplicate' };
    }
    if (queued.length >= MAX_MEMORY_QUEUE) {
      warning = 'Pilot evidence memory queue is full. New events cannot be recorded.';
      return { status: 'rejected', event: null, reason: 'queue-full' };
    }
    const sequence = Math.max(
      0,
      ...list().filter((event) => event.attemptId === context.attemptId)
        .map((event) => event.sequence),
    ) + 1;
    const event = LearningEventSchema.parse({
      schemaVersion: 2,
      eventId: crypto.randomUUID(),
      ...study,
      attemptId: context.attemptId,
      lessonId: context.lessonId,
      lessonVersion: context.lessonVersion,
      timestamp: new Date().toISOString(),
      sequence,
      type,
      assessmentId: assessment?.assessmentId ?? null,
      assessmentType: assessment?.assessmentType ?? null,
      phase: assessment?.phase ?? null,
      payload: dedupeKey ? { ...payload, dedupeKey } : payload,
    });
    queued.push(event);
    const didFlush = flush();
    return { status: didFlush ? 'persisted' : 'queued', event };
  }

  async function exportData(): Promise<PilotExport> {
    if (!study) throw new Error('Pilot recording is disabled until consent is acknowledged.');
    flush();
    const events = list().filter((event) => event.participantCode === study.participantCode);
    const lessonVersions: Record<string, string[]> = {};
    for (const event of events) {
      lessonVersions[event.lessonId] = [
        ...new Set([...(lessonVersions[event.lessonId] ?? []), event.lessonVersion]),
      ].sort();
    }
    const attempts = [...new Map(events.map((event) => [
      event.attemptId,
      {
        attemptId: event.attemptId,
        lessonId: event.lessonId,
        lessonVersion: event.lessonVersion,
      },
    ])).values()];
    const summaries = deriveAttemptSummaries(events);
    const stableContent = {
      schemaVersion: 2,
      study,
      participantCode: study.participantCode,
      lessonVersions,
      attempts,
      events,
      summaries,
      integrity: {
        eventCount: events.length,
        firstEventAt: events[0]?.timestamp ?? null,
        lastEventAt: events.at(-1)?.timestamp ?? null,
        storageDegraded: status().mode !== 'healthy',
      },
    };
    return PilotExportSchema.parse({
      ...stableContent,
      exportId: crypto.randomUUID(),
      generatedAt: new Date().toISOString(),
      contentHash: await sha256(stableStringify(stableContent)),
    });
  }

  function deleteParticipantData() {
    persisted = [];
    queued = [];
    malformed = false;
    warning = null;
    const keys = Array.from({ length: storage.length }, (_, index) => storage.key(index))
      .filter((key): key is string => Boolean(key));
    for (const key of keys) {
      if (
        key === EVENTS_KEY
        || key === STUDY_CONTEXT_KEY
        || key === 'lens:python-foundations:progress:v2'
        || key.startsWith('lesson:v4:local:')
        || key.startsWith('lens:v1:lesson:')
      ) {
        storage.removeItem(key);
      }
    }
  }

  return {
    participantCode: study?.participantCode ?? null,
    isRecording: Boolean(study),
    append,
    list,
    status,
    flush,
    summaries: () => deriveAttemptSummaries(
      list().filter((event) => event.participantCode === study?.participantCode),
    ),
    exportData,
    deleteParticipantData,
  };
}
