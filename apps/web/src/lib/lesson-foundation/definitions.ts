import {
  LessonDefinitionV4Schema,
  LessonDefinitionV3Schema,
  type LessonAssessment,
  type LessonDefinitionBlockV4,
  type LessonDefinitionV4,
  type LessonDefinitionV3,
  type LessonScenarioV4,
  type LessonVerificationV4,
} from '@lol/lens-contracts';

function transferSections(definition: LessonDefinitionV3): LessonDefinitionV4['sections'] {
  const examples: Record<string, {
    pre: { prompt: string; source: string; options: Array<{ id: string; label: string }> };
    post: { prompt: string; source: string; options: Array<{ id: string; label: string }> };
  }> = {
    'values-and-variables': {
      pre: {
        prompt: 'Which name is calculated from the other two?',
        source: 'cups = 3\nprice = 4\ncost = cups * price',
        options: [{ id: 'cups', label: 'cups' }, { id: 'price', label: 'price' }, { id: 'cost', label: 'cost' }],
      },
      post: {
        prompt: 'Which name depends on both starting values?',
        source: 'length = 8\nwidth = 3\narea = length * width',
        options: [{ id: 'length', label: 'length' }, { id: 'width', label: 'width' }, { id: 'area', label: 'area' }],
      },
    },
    'functions-and-returns': {
      pre: {
        prompt: 'Which name receives the function result?',
        source: 'def add_one(value):\n    return value + 1\n\nnext_value = add_one(6)',
        options: [{ id: 'value', label: 'value' }, { id: 'next_value', label: 'next_value' }],
      },
      post: {
        prompt: 'Which name receives the returned value?',
        source: 'def triple(amount):\n    return amount * 3\n\nscore = triple(4)',
        options: [{ id: 'amount', label: 'amount' }, { id: 'score', label: 'score' }],
      },
    },
    'conditions-and-branches': {
      pre: {
        prompt: 'Which branch runs when score is 40?',
        source: 'score = 40\nif score >= 50:\n    result = "pass"\nelse:\n    result = "retry"',
        options: [{ id: 'if-branch', label: 'if branch' }, { id: 'else-branch', label: 'else branch' }],
      },
      post: {
        prompt: 'Which branch runs when temperature is 12?',
        source: 'temperature = 12\nif temperature > 20:\n    label = "warm"\nelse:\n    label = "cool"',
        options: [{ id: 'if-branch', label: 'if branch' }, { id: 'else-branch', label: 'else branch' }],
      },
    },
    'loops-over-lists': {
      pre: {
        prompt: 'How many times does this loop advance?',
        source: 'items = [4, 5]\ntotal = 0\nfor item in items:\n    total = total + item',
        options: [{ id: '2', label: '2 times' }, { id: '3', label: '3 times' }],
      },
      post: {
        prompt: 'How many times does this loop advance?',
        source: 'scores = [2, 3, 4, 5]\npoints = 0\nfor score in scores:\n    points = points + score',
        options: [{ id: '3', label: '3 times' }, { id: '4', label: '4 times' }],
      },
    },
  };
  const example = examples[definition.id];
  if (!example) throw new Error(`Missing transfer examples for ${definition.id}.`);
  return [
    {
      id: 'pre-transfer',
      heading: 'Before the lesson',
      internalRole: 'predict',
      lensCueId: definition.sections[0].lensCueId,
      blocks: [{
        type: 'transfer-check',
        responseId: `${definition.id}-pre-transfer`,
        phase: 'pre',
        ...example.pre,
      }],
    },
    ...definition.sections.map((section) => ({
      ...section,
      blocks: section.blocks.map((block): LessonDefinitionBlockV4 => {
        if (block.type === 'value-prediction') {
          if (definition.id === 'conditions-and-branches') {
            return {
              type: 'prediction',
              responseId: block.responseId,
              prompt: 'For age 16, which branch will run?',
              options: [
                { id: 'if-branch', label: 'if branch' },
                { id: 'else-branch', label: 'else branch' },
              ],
            };
          }
          return {
            type: block.type,
            responseId: block.responseId,
            prompt: block.prompt,
            fields: block.fields.map(({ id, label }) => ({ id, label })),
          };
        }
        if (block.type === 'variation-prediction') {
          return {
            type: block.type,
            responseId: block.responseId,
            prompt: block.prompt,
            options: block.options,
            variationId: block.variationId,
          };
        }
        if (block.type === 'recognition-check') {
          return {
            type: block.type,
            responseId: block.responseId,
            prompt: block.prompt,
            source: block.source,
            roles: block.roles ?? [],
            items: (block.items ?? []).map(({ id, label }) => ({ id, label })),
          };
        }
        if (block.type === 'build') {
          return {
            type: block.type,
            responseId: block.responseId,
            prompt: block.prompt,
            programId: block.programId,
            criteria: block.criteria ?? ['Use supported Python that satisfies the lesson goal.'],
          };
        }
        if (block.type === 'prediction') {
          return {
            type: 'prediction',
            responseId: block.id,
            prompt: block.prompt,
            options: block.options ?? [],
          };
        }
        if (block.type === 'production' || block.type === 'recognition') {
          throw new Error(`Legacy block ${block.type} is not supported by V4.`);
        }
        return block;
      }),
    })),
    {
      id: 'post-transfer',
      heading: 'Try a new example',
      internalRole: 'produce',
      lensCueId: definition.sections.at(-1)?.lensCueId ?? definition.sections[0].lensCueId,
      blocks: [{
        type: 'transfer-check',
        responseId: `${definition.id}-post-transfer`,
        phase: 'post',
        ...example.post,
      }],
    },
  ];
}

function assessments(definition: LessonDefinitionV3): LessonAssessment[] {
  const records: LessonAssessment[] = [];
  for (const section of definition.sections) {
    for (const block of section.blocks) {
      if (block.type === 'value-prediction') {
        records.push({
          id: `${block.responseId}-assessment`,
          responseId: block.responseId,
          type: 'prediction',
          expected: definition.id === 'conditions-and-branches'
            ? { branch: 'else-branch' }
            : Object.fromEntries(block.fields.map((field) => [field.id, field.expected])),
          successFeedback: 'Your committed prediction matches the execution.',
          retryFeedback: 'Compare your committed prediction with the Lens evidence.',
        });
      } else if (block.type === 'variation-prediction') {
        records.push({
          id: `${block.responseId}-assessment`,
          responseId: block.responseId,
          type: 'selection',
          expected: block.expected,
          successFeedback: 'Prediction committed.',
          retryFeedback: 'Prediction committed. Compare it with the resulting Lens evidence.',
        });
      } else if (block.type === 'recognition-check') {
        records.push({
          id: `${block.responseId}-assessment`,
          responseId: block.responseId,
          type: 'recognition',
          expectedRoles: Object.fromEntries((block.items ?? []).map((item) => [item.id, item.expectedRole])),
          successFeedback: block.successFeedback ?? 'The structural roles match.',
          retryFeedback: block.retryFeedback ?? 'Review the code structure and try again.',
        });
      } else if (block.type === 'build') {
        records.push({
          id: `${block.responseId}-assessment`,
          responseId: block.responseId,
          type: 'build',
          namePolicy: 'role-based',
          verificationIds: [`${definition.id}-build-role`],
          scenarioIds: scenarios(definition.id).map((scenario) => scenario.id),
        });
      }
    }
  }
  const transferKeys: Record<string, [string, string]> = {
    'values-and-variables': ['cost', 'area'],
    'functions-and-returns': ['next_value', 'score'],
    'conditions-and-branches': ['else-branch', 'else-branch'],
    'loops-over-lists': ['2', '4'],
  };
  const [pre, post] = transferKeys[definition.id];
  records.push(
    {
      id: `${definition.id}-pre-transfer-assessment`,
      responseId: `${definition.id}-pre-transfer`,
      type: 'transfer',
      phase: 'pre',
      expectedOptionId: pre,
      successFeedback: 'Response recorded.',
      retryFeedback: 'Response recorded.',
    },
    {
      id: `${definition.id}-post-transfer-assessment`,
      responseId: `${definition.id}-post-transfer`,
      type: 'transfer',
      phase: 'post',
      expectedOptionId: post,
      successFeedback: 'Transfer response recorded.',
      retryFeedback: 'Transfer response recorded.',
    },
  );
  return records;
}

function scenarios(lessonId: string): LessonScenarioV4[] {
  if (lessonId === 'functions-and-returns') return [
    { id: 'function-2', label: 'Argument 2', strategy: { type: 'supply-function-arguments', functionSelector: 'first', argumentsSource: ['2'] }, expectedBindings: {}, expectedRoleValues: { 'module-result': '4' } },
    { id: 'function-7', label: 'Argument 7', strategy: { type: 'supply-function-arguments', functionSelector: 'first', argumentsSource: ['7'] }, expectedBindings: {}, expectedRoleValues: { 'module-result': '14' } },
  ];
  if (lessonId === 'conditions-and-branches') return [
    { id: 'condition-false', label: 'False path', strategy: { type: 'replace-input-binding', selector: { role: 'first-starting-binding' }, valueSource: '16' }, expectedBindings: {}, expectedRoleValues: { 'branch-result': "'minor'" }, expectedBranchOutcome: false },
    { id: 'condition-true', label: 'True path', strategy: { type: 'replace-input-binding', selector: { role: 'first-starting-binding' }, valueSource: '21' }, expectedBindings: {}, expectedRoleValues: { 'branch-result': "'adult'" }, expectedBranchOutcome: true },
  ];
  if (lessonId === 'loops-over-lists') return [
    { id: 'loop-even', label: 'Even list', strategy: { type: 'replace-list-literal', selector: { role: 'first-collection-binding' }, valueSource: '[2, 4, 6]' }, expectedBindings: {}, expectedRoleValues: { accumulator: '12' } },
    { id: 'loop-odd', label: 'Odd list', strategy: { type: 'replace-list-literal', selector: { role: 'first-collection-binding' }, valueSource: '[1, 3, 5]' }, expectedBindings: {}, expectedRoleValues: { accumulator: '9' } },
  ];
  return [];
}

function roleVerification(lessonId: string): LessonVerificationV4 {
  if (lessonId === 'values-and-variables') {
    return { id: `${lessonId}-build-role`, type: 'derived-assignment', startingBindings: { count: 2 }, derivedBinding: { dependsOnAllStartingBindings: true } };
  }
  if (lessonId === 'functions-and-returns') {
    return { id: `${lessonId}-build-role`, type: 'return-dependency-role', functionSelector: 'first', requiredParameterIndexes: [0], requireModuleCall: true };
  }
  if (lessonId === 'conditions-and-branches') {
    return { id: `${lessonId}-build-role`, type: 'branch-role', requireElse: true, requireDistinctScenarioResults: true };
  }
  return { id: `${lessonId}-build-role`, type: 'loop-role', requireAccumulatorDependency: true };
}

export function defineLesson(input: unknown): LessonDefinitionV4 {
  const legacy = LessonDefinitionV3Schema.parse(input);
  return LessonDefinitionV4Schema.parse({
    ...legacy,
    schemaVersion: 4,
    version: '4.0.0',
    sections: transferSections(legacy),
    scenarios: scenarios(legacy.id),
    variations: legacy.variations.map((variation) => ({
      ...variation,
      verificationIds: variation.verificationIds.filter((id) => id !== 'conditions-build-coverage'),
    })),
    verifications: [...legacy.verifications, roleVerification(legacy.id)],
    assessments: assessments(legacy),
  });
}
