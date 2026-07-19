import { describe, expect, it } from 'vitest';
import config from '../../apps/web/vite.config.ts';

describe('web Vite dependency optimization', () => {
  it('keeps changing ESM workspace packages out of the persistent prebundle', () => {
    if (typeof config === 'function') {
      throw new Error('Expected the web Vite config to be a static object.');
    }

    const optimizeDeps = config.optimizeDeps ?? {};
    const workspacePackages = [
      '@lol/lens-contracts',
      '@lol/lens-patterns',
      '@lol/lens-scenes',
    ];

    for (const packageName of workspacePackages) {
      expect(optimizeDeps.include ?? []).not.toContain(packageName);
      expect(optimizeDeps.exclude ?? []).toContain(packageName);
    }
  });
});
