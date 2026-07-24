import type {
  LessonAssessment,
  LessonDefinitionBlockV4,
  LessonResponse,
} from '@lol/lens-contracts';

export type LessonCheckAction = {
  visible: true;
  responseId: string;
  disabled: boolean;
  completed: boolean;
  testId: string;
  run: () => void | Promise<unknown>;
};

type ActionCallbacks = {
  onCommit: (id: string, correct?: boolean, feedback?: string) => void;
  onReveal: (id: string, correct: boolean, feedback: string) => void;
  onCheckBuild: (id: string) => void | Promise<unknown>;
};

function parseRecord(answer?: string): Record<string, string> {
  try {
    const value: unknown = JSON.parse(answer ?? '{}');
    return value && typeof value === 'object'
      ? value as Record<string, string>
      : {};
  } catch {
    return {};
  }
}

function parseList(answer?: string): string[] {
  try {
    const value: unknown = JSON.parse(answer ?? '[]');
    return Array.isArray(value)
      ? value.filter((item): item is string => typeof item === 'string')
      : [];
  } catch {
    return [];
  }
}

function sameMembers(left: string[], right: readonly string[]) {
  return left.length === right.length && left.every((item) => right.includes(item));
}

export function createLessonCheckAction(
  block: LessonDefinitionBlockV4,
  assessment: LessonAssessment | undefined,
  response: LessonResponse | undefined,
  callbacks: ActionCallbacks,
): LessonCheckAction | null {
  if (!('responseId' in block)) return null;

  const completed = response?.status === 'revealed';
  const common = {
    visible: true as const,
    responseId: block.responseId,
    completed,
  };

  if (block.type === 'prediction') {
    return {
      ...common,
      disabled: completed || !response?.answer,
      testId: 'check-prediction',
      run: () => {
        if (!response?.answer || completed) return;
        const record = assessment?.type === 'prediction' ? assessment : undefined;
        const correct = response.answer === record?.expected.branch;
        callbacks.onReveal(
          block.responseId,
          correct,
          correct
            ? (record?.successFeedback ?? 'Prediction matches.')
            : (record?.retryFeedback ?? 'Compare with Lens.'),
        );
      },
    };
  }

  if (block.type === 'value-prediction') {
    const answers = parseRecord(response?.answer);
    const ready = block.fields.every(
      (field) => answers[field.id] !== undefined && answers[field.id] !== '',
    );
    return {
      ...common,
      disabled: completed || !ready,
      testId: 'check-prediction',
      run: () => {
        if (!ready || completed) return;
        const record = assessment?.type === 'prediction' ? assessment : undefined;
        const correct = block.fields.every(
          (field) => Number(answers[field.id]) === Number(record?.expected[field.id]),
        );
        callbacks.onReveal(
          block.responseId,
          correct,
          correct
            ? (record?.successFeedback ?? 'Your predicted values match the execution.')
            : (record?.retryFeedback ?? 'Compare your prediction with the actual values.'),
        );
      },
    };
  }

  if (block.type === 'variation-prediction') {
    const selected = parseList(response?.answer);
    const checked = response?.status === 'committed' || completed;
    return {
      ...common,
      completed: checked,
      disabled: checked || selected.length === 0,
      testId: 'check-variation-prediction',
      run: () => {
        if (checked || selected.length === 0) return;
        const record = assessment?.type === 'selection' ? assessment : undefined;
        const correct = sameMembers(selected, record?.expected ?? []);
        callbacks.onCommit(
          block.responseId,
          correct,
          correct
            ? (record?.successFeedback ?? 'Prediction committed.')
            : (record?.retryFeedback ?? 'Prediction committed. Compare it in Lens.'),
        );
      },
    };
  }

  if (block.type === 'recognition-check') {
    const answers = parseRecord(response?.answer);
    const ready = block.items.every((item) => Boolean(answers[item.id]));
    return {
      ...common,
      disabled: completed || !ready,
      testId: 'check-recognition',
      run: () => {
        if (!ready || completed) return;
        const record = assessment?.type === 'recognition' ? assessment : undefined;
        const correct = block.items.every(
          (item) => answers[item.id] === record?.expectedRoles[item.id],
        );
        callbacks.onReveal(
          block.responseId,
          correct,
          correct
            ? (record?.successFeedback ?? 'Correct: each name has the expected role.')
            : (record?.retryFeedback ?? 'Review the code and classify each role again.'),
        );
      },
    };
  }

  if (block.type === 'transfer-check') {
    return {
      ...common,
      disabled: completed || !response?.answer,
      testId: 'submit-transfer',
      run: () => {
        if (!response?.answer || completed) return;
        const record = assessment?.type === 'transfer' ? assessment : undefined;
        const correct = response.answer === record?.expectedOptionId;
        callbacks.onReveal(
          block.responseId,
          correct,
          correct
            ? (record?.successFeedback ?? 'Response recorded.')
            : (record?.retryFeedback ?? 'Response recorded.'),
        );
      },
    };
  }

  if (block.type === 'build') {
    return {
      ...common,
      disabled: completed && response?.correct === true,
      testId: 'check-build',
      run: () => callbacks.onCheckBuild(block.responseId),
    };
  }

  return null;
}
