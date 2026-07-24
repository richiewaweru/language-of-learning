import { describe, expect, it } from 'vitest';
import { verifyBuildProgram } from '../../apps/web/src/lib/lesson-foundation/orchestrator.svelte';
import {
  CueTransitionGuard,
  InitializeOnceLedger,
} from '../../apps/web/src/lib/lesson-foundation/orchestration-core';

describe('deterministic lesson Build verification', () => {
  it('accepts two starting assignments and a derived assignment', () => {
    expect(verifyBuildProgram('first = 10\nsecond = 5\nresult = first + second')).toEqual({
      correct: true,
      feedback: 'result correctly depends on first and second.',
    });
  });

  it('rejects a missing dependency with precise feedback', () => {
    expect(verifyBuildProgram('first = 10\nsecond = 5\nresult = first * 2')).toEqual({
      correct: false,
      feedback: 'The final assignment must depend on both starting names. Missing: second.',
    });
  });

  it('rejects the wrong number of assignments', () => {
    expect(verifyBuildProgram('first = 10\nresult = first + 2').correct).toBe(false);
  });
});

describe('lesson orchestration guards', () => {
  it('applies initialize-once cues exactly once', () => {
    const ledger = new InitializeOnceLedger();
    expect(ledger.shouldApply('cue-introduce')).toBe(true);
    expect(ledger.shouldApply('cue-introduce')).toBe(false);
  });

  it('marks older asynchronous transitions stale', () => {
    const guard = new CueTransitionGuard();
    const first = guard.begin();
    const second = guard.begin();
    expect(guard.isCurrent(first)).toBe(false);
    expect(guard.isCurrent(second)).toBe(true);
  });
});
