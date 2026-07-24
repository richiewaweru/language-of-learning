import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';

const sharedFiles = [
  'LessonBlockRenderer.svelte',
  'LessonNarrative.svelte',
  'LessonPlayer.svelte',
  'orchestrator.svelte.ts',
  'services.ts',
  'session.svelte.ts',
  'verification.ts',
];

describe('shared lesson source boundary', () => {
  it('contains no authored pilot concept names or lesson-id branches', () => {
    const root = path.resolve('apps/web/src/lib/lesson-foundation');
    for (const file of sharedFiles) {
      const source = readFileSync(path.join(root, file), 'utf8');
      expect(source, file).not.toMatch(
        /\b(price|tax|total|distance|time|speed|values-and-variables|functions-and-returns|conditions-and-branches|loops-over-lists)\b/,
      );
    }
  });
});
