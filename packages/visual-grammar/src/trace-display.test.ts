import { describe, expect, it } from 'vitest';
import { loopItemCountFromTrace, returnReprFromScene } from './trace-display.js';

describe('renderer truth helpers (F4)', () => {
  it('derives item count 3 from [3,5,2] loop_advance events', () => {
    const steps = [0, 1, 2].map((itemIndex) => ({
      event: { type: 'loop_advance', itemIndex },
    }));
    expect(loopItemCountFromTrace(steps)).toBe(3);
  });

  it('derives item count 6 from a six-item run', () => {
    const steps = [0, 1, 2, 3, 4, 5].map((itemIndex) => ({
      event: { type: 'loop_advance', itemIndex },
    }));
    expect(loopItemCountFromTrace(steps)).toBe(6);
  });

  it('reads return repr from exit_return at final step', () => {
    const sceneSteps = [
      { actions: [] },
      { actions: [{ type: 'exit_return', repr: '10' }] },
    ];
    expect(returnReprFromScene(sceneSteps, 1)).toBe('10');
    expect(returnReprFromScene(sceneSteps, 0, 'fallback')).toBe('fallback');
  });
});
