import { describe, expect, it } from 'vitest';
import { resolveSymbol, symbolManifest, symbolRegistry } from './symbol-registry.js';

describe('symbol registry v1', () => {
  it('loads the imported governing manifest with one registration per symbol', () => {
    expect(symbolManifest.grammarVersion).toBe('1.0.0');
    expect(symbolManifest.semanticModelVersion).toBe('1.0.0');
    expect(symbolRegistry.size).toBe(symbolManifest.symbols.length);
    expect([...symbolRegistry.keys()]).toContain('cursor');
    expect([...symbolRegistry.keys()]).toContain('comparison');
    expect([...symbolRegistry.keys()]).toContain('mutation');
    expect([...symbolRegistry.keys()]).toContain('range');
  });

  it('uses exact, compatible, generic, then unsupported resolution', () => {
    expect(resolveSymbol('cursor').kind).toBe('exact');
    expect(resolveSymbol('unknown', { compatible: ['comparison'] }).kind).toBe('composition');
    expect(resolveSymbol('unknown').resolvedId).toBe('generic-operation');
    expect(resolveSymbol('unknown', { behaviorVerified: false }).resolvedId).toBe('unsupported');
  });

  it('contains primitives rather than algorithm symbols', () => {
    const ids = new Set(symbolManifest.symbols.map((symbol) => symbol.id));
    for (const algorithm of ['binary-search', 'two-pointers', 'sliding-window', 'recursion']) {
      expect(ids.has(algorithm)).toBe(false);
    }
  });
});
