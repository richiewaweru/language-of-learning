import { describe, expect, it } from 'vitest';
import { parseLensSessionSnapshot } from './workspace.js';

const valid = {
  schemaVersion: 1 as const,
  id: 'lesson-attempt:primary',
  kind: 'lesson' as const,
  source: 'price = 100',
  argsText: '',
  activeView: 'flow' as const,
  selection: { stepIndex: 1 },
  updatedAt: '2026-07-23T00:00:00.000Z',
};

const expected = {
  id: valid.id,
  kind: valid.kind,
  enabledViews: ['flow', 'state'] as const,
};

describe('Lens session snapshot validation', () => {
  it('accepts a matching durable snapshot', () => {
    expect(parseLensSessionSnapshot(valid, expected)).toEqual({
      success: true,
      data: valid,
    });
  });

  it.each([
    ['wrong identity', { ...valid, id: 'other' }],
    ['wrong kind', { ...valid, kind: 'decode' }],
    ['unknown schema', { ...valid, schemaVersion: 2 }],
    ['unknown view', { ...valid, activeView: 'timeline' }],
    ['disabled view', { ...valid, activeView: 'structure' }],
    ['negative frame', { ...valid, selection: { stepIndex: -1 } }],
    ['non-finite frame', { ...valid, selection: { stepIndex: Number.POSITIVE_INFINITY } }],
  ])('rejects %s', (_label, snapshot) => {
    expect(parseLensSessionSnapshot(snapshot, expected).success).toBe(false);
  });
});
