import { describe, expect, it } from 'vitest';
import type { PilotExport } from '@lol/lens-contracts';
import { buildAnalysis } from '../../tools/pilot/analyze';
import { pilotContentHash, validatePilotExport } from '../../tools/pilot/validate';

const emptyExport: PilotExport = {
  schemaVersion: 2,
  exportId: 'export-1',
  generatedAt: '2026-07-24T08:01:00.000Z',
  study: {
    studyId: 'lens-phase-6-pilot',
    studyVersion: '1.0.0',
    conditionId: 'guided-lens-v1',
    releaseId: 'phase-6-pilot-v1',
    facilitatorSessionId: 'facilitator-1',
    participantCode: 'P-SAMPLE01',
    consentAcknowledgedAt: '2026-07-24T08:00:00.000Z',
  },
  participantCode: 'P-SAMPLE01',
  lessonVersions: {},
  attempts: [],
  events: [],
  summaries: [],
  integrity: {
    eventCount: 0,
    firstEventAt: null,
    lastEventAt: null,
    storageDegraded: false,
  },
  contentHash: '0'.repeat(64),
};
emptyExport.contentHash = pilotContentHash(emptyExport);

describe('pilot validation and analysis tools', () => {
  it('validates canonical exports and detects tampering', () => {
    expect(validatePilotExport(emptyExport)).toMatchObject({ valid: true });
    const tampered = structuredClone(emptyExport);
    tampered.study.conditionId = 'changed';
    expect(validatePilotExport(tampered)).toMatchObject({ valid: false });
  });

  it('rejects degraded exports', () => {
    const degraded = structuredClone(emptyExport);
    degraded.integrity.storageDegraded = true;
    degraded.contentHash = pilotContentHash(degraded);
    expect(validatePilotExport(degraded).errors).toContain('Export reports degraded storage.');
  });

  it('rejects source text fields even when the content hash is recomputed', () => {
    const withSource = structuredClone(emptyExport) as PilotExport & {
      events: Array<Record<string, unknown>>;
    };
    withSource.events = [{
      schemaVersion: 2,
      eventId: 'event-1',
      ...withSource.study,
      attemptId: 'attempt-1',
      lessonId: 'lesson-1',
      lessonVersion: '4.0.0',
      timestamp: '2026-07-24T08:00:01.000Z',
      sequence: 1,
      type: 'source_edited',
      assessmentId: null,
      assessmentType: null,
      phase: null,
      payload: { source: 'secret = 1' },
    }];
    withSource.lessonVersions = { 'lesson-1': ['4.0.0'] };
    withSource.attempts = [{
      attemptId: 'attempt-1',
      lessonId: 'lesson-1',
      lessonVersion: '4.0.0',
    }];
    withSource.integrity = {
      eventCount: 1,
      firstEventAt: '2026-07-24T08:00:01.000Z',
      lastEventAt: '2026-07-24T08:00:01.000Z',
      storageDegraded: false,
    };
    withSource.contentHash = pilotContentHash(withSource);
    expect(validatePilotExport(withSource).errors.join(' ')).toContain('Source-like fields');
  });

  it('produces participant, attempt, and criterion tables', () => {
    const summary = {
      attemptId: 'attempt-1',
      lessonId: 'values-and-variables',
      lessonVersion: '4.0.0',
      startedAt: '2026-07-24T08:00:00.000Z',
      completedAt: null,
      firstPredictionCorrect: false,
      finalPredictionCorrect: true,
      buildSuccess: false,
      buildSubmissionCount: 1,
      failedCriteriaCounts: { role: 2 },
      retryCount: 1,
      interventionCount: 0,
      framesVisited: 1,
      viewsUsed: ['state'],
      variationCount: 0,
      wallClockDurationMs: 10,
      activeDurationMs: 10,
      timeToFirstPredictionMs: 2,
      predictionToRevealMs: 1,
      guidedDurationMs: 3,
      timeToBuildSuccessMs: null,
      preTransferCorrect: false,
      postTransferCorrect: true,
    };
    const analysis = buildAnalysis([{ ...emptyExport, summaries: [summary] }]);
    expect(analysis.participantRows[0]).toMatchObject({ attemptCount: 1, postTransferCorrect: 1 });
    expect(analysis.criterionRows).toEqual([{ criterion: 'role', count: 2 }]);
  });
});
