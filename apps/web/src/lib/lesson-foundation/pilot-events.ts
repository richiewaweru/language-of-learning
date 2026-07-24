import {
  LearningEventSchema,
  PilotExportSchema,
  type AttemptSummary,
  type LearningEvent,
  type LearningEventType,
  type PilotExport,
} from '@lol/lens-contracts';

const PARTICIPANT_KEY = 'lol:pilot:v1:participant';
const EVENTS_KEY = 'lol:pilot:v1:events';

function randomParticipantCode() {
  return `P-${crypto.randomUUID().replaceAll('-', '').slice(0, 8).toUpperCase()}`;
}

function readEvents(storage: Storage): LearningEvent[] {
  try {
    const value: unknown = JSON.parse(storage.getItem(EVENTS_KEY) ?? '[]');
    if (!Array.isArray(value)) return [];
    return value.flatMap((item) => {
      const parsed = LearningEventSchema.safeParse(item);
      return parsed.success ? [parsed.data] : [];
    });
  } catch {
    return [];
  }
}

export function participantCode(storage: Storage) {
  const existing = storage.getItem(PARTICIPANT_KEY);
  if (existing) return existing;
  const created = randomParticipantCode();
  storage.setItem(PARTICIPANT_KEY, created);
  return created;
}

export function deriveAttemptSummaries(events: readonly LearningEvent[]): AttemptSummary[] {
  const groups = new Map<string, LearningEvent[]>();
  for (const event of events) {
    groups.set(event.attemptId, [...(groups.get(event.attemptId) ?? []), event]);
  }
  return [...groups.values()].map((items) => {
    const ordered = [...items].sort((left, right) => left.sequence - right.sequence);
    const started = ordered[0];
    const completed = ordered.findLast((event) => event.type === 'lesson_completed');
    const predictions = ordered.filter((event) =>
      event.type === 'execution_revealed' && typeof event.payload.correct === 'boolean');
    const verifications = ordered.filter((event) => event.type === 'verification_completed');
    const failedCriteria = [...new Set(verifications.flatMap((event) =>
      Array.isArray(event.payload.failedCriteria)
        ? event.payload.failedCriteria.filter((value): value is string => typeof value === 'string')
        : []))];
    const views = [...new Set(ordered.flatMap((event) =>
      event.type === 'lens_view_changed' && typeof event.payload.view === 'string'
        ? [event.payload.view]
        : []))];
    const frames = new Set(ordered.flatMap((event) =>
      event.type === 'lens_frame_changed' && typeof event.payload.frame === 'number'
        ? [event.payload.frame]
        : []));
    const transfers = ordered.filter((event) => event.type === 'transfer_submitted');
    const transferCorrect = (phase: 'pre' | 'post') => {
      const item = transfers.findLast((event) => event.payload.phase === phase);
      return typeof item?.payload.correct === 'boolean' ? item.payload.correct : null;
    };
    return {
      attemptId: started.attemptId,
      lessonId: started.lessonId,
      startedAt: started.timestamp,
      completedAt: completed?.timestamp ?? null,
      firstPredictionCorrect: typeof predictions[0]?.payload.correct === 'boolean'
        ? predictions[0].payload.correct : null,
      finalPredictionCorrect: typeof predictions.at(-1)?.payload.correct === 'boolean'
        ? predictions.at(-1)?.payload.correct as boolean : null,
      buildSuccess: verifications.some((event) => event.payload.correct === true),
      buildRunCount: ordered.filter((event) => event.type === 'program_run').length,
      failedCriteria,
      framesVisited: frames.size,
      viewsUsed: views,
      variationCount: ordered.filter((event) => event.type === 'variation_applied').length,
      durationMs: Math.max(
        0,
        Date.parse((completed ?? ordered.at(-1) ?? started).timestamp) - Date.parse(started.timestamp),
      ),
      preTransferCorrect: transferCorrect('pre'),
      postTransferCorrect: transferCorrect('post'),
    };
  });
}

export type LearningEventStore = ReturnType<typeof createLearningEventStore>;

export function createLearningEventStore(
  storage: Storage,
  context: {
    attemptId: string;
    lessonId: string;
    lessonVersion: string;
  },
) {
  const participant = participantCode(storage);

  function list() {
    return readEvents(storage);
  }

  function append(type: LearningEventType, payload: Record<string, unknown> = {}, dedupeKey?: string) {
    const events = list();
    if (dedupeKey && events.some((event) =>
      event.attemptId === context.attemptId && event.payload.dedupeKey === dedupeKey)) {
      return null;
    }
    const sequence = Math.max(
      0,
      ...events.filter((event) => event.attemptId === context.attemptId)
        .map((event) => event.sequence),
    ) + 1;
    const event = LearningEventSchema.parse({
      schemaVersion: 1,
      eventId: crypto.randomUUID(),
      participantCode: participant,
      attemptId: context.attemptId,
      lessonId: context.lessonId,
      lessonVersion: context.lessonVersion,
      timestamp: new Date().toISOString(),
      sequence,
      type,
      payload: dedupeKey ? { ...payload, dedupeKey } : payload,
    });
    storage.setItem(EVENTS_KEY, JSON.stringify([...events, event]));
    return event;
  }

  function exportData(lessonVersions: Record<string, string>): PilotExport {
    const events = list().filter((event) => event.participantCode === participant);
    return PilotExportSchema.parse({
      schemaVersion: 1,
      participantCode: participant,
      generatedAt: new Date().toISOString(),
      lessonVersions,
      attempts: [...new Map(events.map((event) => [
        event.attemptId,
        { attemptId: event.attemptId, lessonId: event.lessonId },
      ])).values()],
      events,
      summaries: deriveAttemptSummaries(events),
    });
  }

  function deleteParticipantData() {
    const retained = list().filter((event) => event.participantCode !== participant);
    storage.setItem(EVENTS_KEY, JSON.stringify(retained));
  }

  return {
    participantCode: participant,
    append,
    list,
    summaries: () => deriveAttemptSummaries(
      list().filter((event) => event.participantCode === participant),
    ),
    exportData,
    deleteParticipantData,
  };
}
