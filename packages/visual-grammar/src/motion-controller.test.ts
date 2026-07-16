import { describe, expect, it } from 'vitest';
import {
  applyDuration,
  cancelTransition,
  msFromCssDuration,
  prefersReducedMotion,
} from './motion-controller.js';

describe('msFromCssDuration', () => {
  it('parses milliseconds and seconds', () => {
    expect(msFromCssDuration('1600ms')).toBe(1600);
    expect(msFromCssDuration('0.7s')).toBe(700);
    expect(msFromCssDuration('350ms')).toBe(350);
    expect(msFromCssDuration('.25s')).toBe(250);
  });

  it('trims whitespace (CSS var values often have leading space)', () => {
    expect(msFromCssDuration(' 900ms ')).toBe(900);
  });

  it('falls back for empty / unparseable input', () => {
    expect(msFromCssDuration('', 42)).toBe(42);
    expect(msFromCssDuration(null, 42)).toBe(42);
    expect(msFromCssDuration(undefined, 42)).toBe(42);
    expect(msFromCssDuration('fast', 42)).toBe(42);
  });
});

describe('prefersReducedMotion', () => {
  it('is false without a matchMedia-capable window', () => {
    expect(prefersReducedMotion({})).toBe(false);
  });

  it('reflects the reduce query result', () => {
    const reduce = { matchMedia: () => ({ matches: true }) };
    const noReduce = { matchMedia: () => ({ matches: false }) };
    expect(prefersReducedMotion(reduce)).toBe(true);
    expect(prefersReducedMotion(noReduce)).toBe(false);
  });

  it('is resilient to a throwing matchMedia', () => {
    const throwing = {
      matchMedia: () => {
        throw new Error('nope');
      },
    };
    expect(prefersReducedMotion(throwing)).toBe(false);
  });
});

describe('applyDuration', () => {
  it('returns the fallback when no DOM is available (node/test env)', () => {
    expect(applyDuration('--t-autoplay', 1600)).toBe(1600);
  });
});

describe('cancelTransition', () => {
  it('is a safe no-op for null / undefined targets', () => {
    expect(() => cancelTransition(null)).not.toThrow();
    expect(() => cancelTransition(undefined)).not.toThrow();
  });
});
