import { describe, expect, it } from 'vitest';
import {
  hashSource,
  sourceForScenario,
} from '../../apps/web/src/lib/lesson-foundation/scenarios';

describe('learner-source scenarios', () => {
  it('replaces a designated input without mutating the submitted source', async () => {
    const source = 'age = 16\nif age >= 18:\n    status = "adult"\nelse:\n    status = "minor"';
    const transformed = sourceForScenario(source, {
      id: 'adult',
      label: 'Adult',
      strategy: {
        type: 'replace-input-binding',
        selector: { role: 'first-starting-binding' },
        valueSource: '21',
      },
      expectedBindings: {},
      expectedRoleValues: {},
      expectedBranchOutcome: true,
    });
    expect(transformed).toContain('age = 21');
    expect(source).toContain('age = 16');
    expect(await hashSource(source)).toHaveLength(64);
  });

  it('supplies function arguments and replaces list literals in fresh copies', () => {
    expect(sourceForScenario(
      'def double(n):\n    return n * 2\n\nanswer = double(5)',
      {
        id: 'seven',
        label: 'Seven',
        strategy: {
          type: 'supply-function-arguments',
          functionSelector: 'first',
          argumentsSource: ['7'],
        },
        expectedBindings: {},
        expectedRoleValues: {},
      },
    )).toContain('answer = double(7)');
    expect(sourceForScenario(
      'numbers = [2, 4]\ntotal = 0\nfor number in numbers:\n    total = total + number',
      {
        id: 'odd',
        label: 'Odd',
        strategy: {
          type: 'replace-list-literal',
          selector: { role: 'first-collection-binding' },
          valueSource: '[1, 3, 5]',
        },
        expectedBindings: {},
        expectedRoleValues: {},
      },
    )).toContain('numbers = [1, 3, 5]');
  });
});
