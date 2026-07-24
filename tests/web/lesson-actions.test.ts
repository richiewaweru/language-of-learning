import { describe, expect, it, vi } from 'vitest';
import type {
  LessonAssessment,
  LessonDefinitionBlockV4,
  LessonResponse,
} from '@lol/lens-contracts';
import { createLessonCheckAction } from '../../apps/web/src/lib/lesson-foundation/lesson-actions';

function callbacks() {
  return {
    onCommit: vi.fn(),
    onReveal: vi.fn(),
    onCheckBuild: vi.fn(),
  };
}

describe('lesson bottom check action', () => {
  it('evaluates a value prediction in one submission', () => {
    const block: LessonDefinitionBlockV4 = {
      type: 'value-prediction',
      responseId: 'prediction',
      prompt: 'Predict',
      fields: [{ id: 'result', label: 'result' }],
    };
    const assessment: LessonAssessment = {
      id: 'assessment',
      responseId: 'prediction',
      type: 'prediction',
      expected: { result: 12 },
      successFeedback: 'Correct.',
      retryFeedback: 'Try again.',
    };
    const response: LessonResponse = {
      status: 'draft',
      answer: JSON.stringify({ result: '12' }),
    };
    const handlers = callbacks();

    const action = createLessonCheckAction(block, assessment, response, handlers);
    expect(action).toMatchObject({ disabled: false, completed: false });
    action?.run();
    expect(handlers.onReveal).toHaveBeenCalledWith('prediction', true, 'Correct.');
    expect(handlers.onCommit).not.toHaveBeenCalled();
  });

  it('commits an authored variation without applying it', () => {
    const block: LessonDefinitionBlockV4 = {
      type: 'variation-prediction',
      responseId: 'variation',
      prompt: 'What changes?',
      options: ['input', 'result'],
      variationId: 'changed-input',
    };
    const assessment: LessonAssessment = {
      id: 'assessment',
      responseId: 'variation',
      type: 'selection',
      expected: ['input', 'result'],
      successFeedback: 'Committed.',
      retryFeedback: 'Compare in Lens.',
    };
    const response: LessonResponse = {
      status: 'draft',
      answer: JSON.stringify(['input', 'result']),
    };
    const handlers = callbacks();

    createLessonCheckAction(block, assessment, response, handlers)?.run();
    expect(handlers.onCommit).toHaveBeenCalledWith('variation', true, 'Committed.');
    expect(handlers.onReveal).not.toHaveBeenCalled();
  });

  it('hides the action for informational blocks', () => {
    const block: LessonDefinitionBlockV4 = {
      type: 'prose',
      paragraphs: ['Read this first.'],
    };
    expect(createLessonCheckAction(block, undefined, undefined, callbacks())).toBeNull();
  });
});
