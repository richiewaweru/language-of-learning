import { StudyContextSchema, type StudyContext } from '@lol/lens-contracts';

export const PILOT_STUDY_ID = 'lens-phase-6-pilot';
export const PILOT_STUDY_VERSION = '1.0.0';
export const PILOT_CONDITION_ID = 'guided-lens-v1';
export const PILOT_RELEASE_ID = 'phase-6-pilot-v1';

export const STUDY_CONTEXT_KEY = 'lol:pilot:v2:study';
export const EVENTS_KEY = 'lol:pilot:v2:events';
export const LEGACY_PARTICIPANT_KEY = 'lol:pilot:v1:participant';
export const LEGACY_EVENTS_KEY = 'lol:pilot:v1:events';

function randomParticipantCode() {
  return `P-${crypto.randomUUID().replaceAll('-', '').slice(0, 8).toUpperCase()}`;
}

export function loadStudyContext(storage: Storage): StudyContext | null {
  try {
    const raw = storage.getItem(STUDY_CONTEXT_KEY);
    if (!raw) return null;
    const parsed = StudyContextSchema.safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

export function createConsentedStudyContext(storage: Storage): StudyContext {
  const context = StudyContextSchema.parse({
    studyId: PILOT_STUDY_ID,
    studyVersion: PILOT_STUDY_VERSION,
    conditionId: PILOT_CONDITION_ID,
    releaseId: PILOT_RELEASE_ID,
    facilitatorSessionId: crypto.randomUUID(),
    participantCode: randomParticipantCode(),
    consentAcknowledgedAt: new Date().toISOString(),
  });
  storage.setItem(STUDY_CONTEXT_KEY, JSON.stringify(context));
  return context;
}

export function deleteLegacyPilotData(storage: Storage): void {
  storage.removeItem(LEGACY_PARTICIPANT_KEY);
  storage.removeItem(LEGACY_EVENTS_KEY);
}
