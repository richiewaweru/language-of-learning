import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { PilotExportSchema } from '@lol/lens-contracts';
import {
  createLearningEventStore,
  deriveAttemptSummaries,
} from '../../apps/web/src/lib/lesson-foundation/pilot-events';

class MemoryStorage implements Storage {
  private values = new Map<string, string>();
  get length() { return this.values.size; }
  clear() { this.values.clear(); }
  getItem(key: string) { return this.values.get(key) ?? null; }
  key(index: number) { return [...this.values.keys()][index] ?? null; }
  removeItem(key: string) { this.values.delete(key); }
  setItem(key: string, value: string) { this.values.set(key, value); }
}

describe('local pilot event stream', () => {
  it('ships a schema-valid anonymized sample export', () => {
    const sample = JSON.parse(
      readFileSync('artifacts/phase-5/sample-pilot-export.json', 'utf8'),
    );
    expect(PilotExportSchema.parse(sample).participantCode).toBe('P-SAMPLE01');
    expect(JSON.stringify(sample)).not.toMatch(/email|name@|sourceText/);
  });

  it('appends monotonic events, deduplicates actions, and exports valid JSON', () => {
    const storage = new MemoryStorage();
    const store = createLearningEventStore(storage, {
      attemptId: 'attempt-1',
      lessonId: 'values-and-variables',
      lessonVersion: '4.0.0',
    });
    store.append('lesson_started', {}, 'start');
    store.append('lesson_started', {}, 'start');
    store.append('prediction_committed', { responseId: 'prediction' });
    store.append('program_run', { revision: 4, status: 'supported' }, 'run:4');
    store.append('verification_completed', {
      correct: false,
      failedCriteria: ['derived-role'],
    });
    const events = store.list();
    expect(events.map((event) => event.sequence)).toEqual([1, 2, 3, 4]);
    expect(events).toHaveLength(4);
    const refreshed = createLearningEventStore(storage, {
      attemptId: 'attempt-1',
      lessonId: 'values-and-variables',
      lessonVersion: '4.0.0',
    });
    refreshed.append('response_retried', { responseId: 'prediction' });
    expect(refreshed.list().at(-1)?.sequence).toBe(5);
    expect(PilotExportSchema.parse(
      store.exportData({ 'values-and-variables': '4.0.0' }),
    ).participantCode).toBe(store.participantCode);
  });

  it('derives summaries and deletes only the active participant data', () => {
    const storage = new MemoryStorage();
    const store = createLearningEventStore(storage, {
      attemptId: 'attempt-1',
      lessonId: 'loops-over-lists',
      lessonVersion: '4.0.0',
    });
    store.append('lesson_started');
    store.append('lens_view_changed', { view: 'state' });
    store.append('lens_frame_changed', { frame: 2 });
    store.append('variation_applied', { variationId: 'odd' });
    store.append('transfer_submitted', { phase: 'post', correct: true });
    store.append('lesson_completed');
    const [summary] = deriveAttemptSummaries(store.list());
    expect(summary.viewsUsed).toEqual(['state']);
    expect(summary.framesVisited).toBe(1);
    expect(summary.variationCount).toBe(1);
    expect(summary.postTransferCorrect).toBe(true);
    expect(summary.completedAt).not.toBeNull();
    store.deleteParticipantData();
    expect(store.list()).toEqual([]);
  });
});
