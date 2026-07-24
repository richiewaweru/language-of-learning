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

function parse(input: unknown): LessonDefinitionV4 {
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

export const valuesAndVariablesLesson = parse({
  schemaVersion: 3,
  id: 'values-and-variables',
  slug: 'values-and-variables',
  version: '3.0.0',
  courseId: 'python-foundations',
  title: 'Values and Variables',
  subtitle: 'Give values names, then build new values from them.',
  goal: 'Understand how assignment binds a name to a value and how later expressions reuse it.',
  lens: { initialProgramId: 'price-tax-total', initialView: 'flow' },
  sections: [
    {
      id: 'names-for-values',
      heading: 'A name for a value',
      internalRole: 'introduce',
      lensCueId: 'cue-introduce',
      blocks: [
        { type: 'prose', paragraphs: ['Programs remember information by giving values useful names.', 'A good name lets later statements reuse a value without repeating it.'] },
        { type: 'definition', text: 'A variable is a name that currently refers to a value.' },
        { type: 'callout', label: 'Notice', text: 'The equals sign assigns a value. It does not ask whether two things are equal.', tone: 'notice' },
      ],
    },
    {
      id: 'assignment-shape',
      heading: 'Read an assignment',
      internalRole: 'structural-model',
      lensCueId: 'cue-assignment',
      blocks: [{
        type: 'assignment-shape',
        title: 'Three complete assignments, one dependency chain',
        lines: [
          { source: 'price = 100', target: 'price', operator: '=', expression: '100', dependencies: [] },
          { source: 'tax = price * 0.16', target: 'tax', operator: '=', expression: 'price * 0.16', dependencies: ['price'] },
          { source: 'total = price + tax', target: 'total', operator: '=', expression: 'price + tax', dependencies: ['price', 'tax'] },
        ],
      }],
    },
    {
      id: 'predict-values',
      heading: 'What will Python store?',
      internalRole: 'predict',
      lensCueId: 'cue-predict',
      blocks: [{
        type: 'value-prediction',
        responseId: 'prediction-values',
        prompt: 'Before running the program, predict the values Python will store.',
        fields: [
          { id: 'tax', label: 'tax', expected: 16 },
          { id: 'total', label: 'total', expected: 116 },
        ],
      }],
    },
    {
      id: 'follow-calculation',
      heading: 'Follow the calculation',
      internalRole: 'guided-explore',
      lensCueId: 'cue-guided',
      blocks: [{ type: 'observation', text: 'Step through each binding and compare the final values with your committed prediction.' }],
    },
    {
      id: 'change-value',
      heading: 'Change one value',
      internalRole: 'variation',
      lensCueId: 'cue-explore',
      blocks: [{
        type: 'variation-prediction',
        responseId: 'prediction-change',
        prompt: 'If the starting value changes to 200, which stored values will change?',
        options: ['price', 'tax', 'total'],
        expected: ['price', 'tax', 'total'],
        variationId: 'price-200',
      }],
    },
    {
      id: 'recognize-structure',
      heading: 'Recognize the same structure',
      internalRole: 'recognize',
      lensCueId: 'cue-recognize',
      blocks: [{
        type: 'recognition-check',
        responseId: 'recognition-bindings',
        prompt: 'Classify each name by its role.',
        source: 'distance = 120\ntime = 2\nspeed = distance / time',
        roles: [
          { id: 'starting', label: 'starting name' },
          { id: 'derived', label: 'derived name' },
        ],
        items: [
          { id: 'distance', label: 'distance', expectedRole: 'starting' },
          { id: 'time', label: 'time', expectedRole: 'starting' },
          { id: 'speed', label: 'speed', expectedRole: 'derived' },
        ],
        successFeedback: 'Correct: the first two names hold starting values and the third is derived from them.',
        retryFeedback: 'Check which lines use literal values and which line reads earlier names.',
      }],
    },
    {
      id: 'build-calculation',
      heading: 'Build a calculation',
      internalRole: 'produce',
      lensCueId: 'cue-build',
      blocks: [{
        type: 'build',
        responseId: 'build-calculation',
        prompt: 'Create two starting values and one value calculated from both.',
        programId: 'build-scaffold',
        verificationIds: ['build-supported', 'build-assignment-count', 'build-dependencies'],
        criteria: ['Use three assignments.', 'Make the final assignment depend on both starting names.', 'Use supported Python that runs successfully.'],
      }],
    },
  ],
  programs: [
    { id: 'price-tax-total', source: 'price = 100\ntax = price * 0.16\ntotal = price + tax', argsText: '' },
    { id: 'price-tax-total-200', source: 'price = 200\ntax = price * 0.16\ntotal = price + tax', argsText: '' },
    { id: 'distance-time-speed', source: 'distance = 120\ntime = 2\nspeed = distance / time', argsText: '' },
    { id: 'build-scaffold', source: 'first = 10\nsecond = 5\nresult = 0', argsText: '' },
  ],
  scenarios: [],
  variations: [{
    id: 'price-200',
    label: 'Starting value 200',
    applyLabel: 'Apply the 200 variation',
    programId: 'price-tax-total-200',
    predictionId: 'prediction-change',
    verificationIds: ['variation-values'],
    comparison: {
      kind: 'bindings',
      baselineProgramId: 'price-tax-total',
      fields: [
        { key: 'price', label: 'price' },
        { key: 'tax', label: 'tax' },
        { key: 'total', label: 'total' },
      ],
    },
    successFeedback: 'All configured bindings changed as predicted.',
    retryFeedback: 'Compare each configured baseline and changed value.',
  }],
  cues: [
    { id: 'cue-introduce', sectionId: 'names-for-values', apply: 'initialize-once', presentation: 'quiet', mode: 'observe', programId: 'price-tax-total', view: 'flow', frame: 'start', editing: 'locked', eyebrow: 'Learning Lens · waiting', title: 'The same workspace follows the whole lesson', instruction: 'Start with the idea. Lens is ready when execution becomes useful.' },
    { id: 'cue-assignment', sectionId: 'assignment-shape', apply: 'guide-without-reset', presentation: 'visible', mode: 'observe', view: 'structure', frame: 'start', editing: 'locked', eyebrow: 'Observe', title: 'See the assignment structure', instruction: 'Match each source line to its target, expression, and dependencies.' },
    { id: 'cue-predict', sectionId: 'predict-values', apply: 'guide-without-reset', presentation: 'quiet', mode: 'observe', view: 'state', frame: 'start', editing: 'locked', revealPolicy: { responseId: 'prediction-values', unlockAt: 'committed', concealedViews: ['state', 'explain', 'structure'], preCommitFrame: 'start' }, eyebrow: 'Predict first', title: 'Execution is concealed', instruction: 'Commit both predictions before Lens reveals stored values.' },
    { id: 'cue-guided', sectionId: 'follow-calculation', apply: 'guide-without-reset', presentation: 'focus', mode: 'guided', view: 'explain', frame: 'start', editing: 'locked', requiresResponseId: 'prediction-values', eyebrow: 'Guided', title: 'Follow the dependency chain', instruction: 'Use the frame controls to follow each binding.' },
    { id: 'cue-explore', sectionId: 'change-value', apply: 'guide-without-reset', presentation: 'visible', mode: 'explore', view: 'state', frame: 'end', editing: 'authored-variations', eyebrow: 'Explore', title: 'Apply an authored variation', instruction: 'Commit which bindings change, then apply the variation.' },
    { id: 'cue-recognize', sectionId: 'recognize-structure', apply: 'replace-program', presentation: 'visible', mode: 'observe', programId: 'distance-time-speed', view: 'structure', frame: 'start', editing: 'locked', revealPolicy: { responseId: 'recognition-bindings', unlockAt: 'revealed', concealedViews: ['state', 'explain', 'structure'], preCommitFrame: 'start' }, eyebrow: 'Recognize', title: 'Same structure, different names', instruction: 'Classify the roles before inspecting Lens.' },
    { id: 'cue-build', sectionId: 'build-calculation', apply: 'replace-program', presentation: 'focus', mode: 'build', programId: 'build-scaffold', view: 'state', frame: 'start', editing: 'free', eyebrow: 'Build', title: 'Use the real Lens editor', instruction: 'Edit, run, and check the declared semantic requirements.' },
  ],
  verifications: [
    { id: 'variation-values', type: 'binding-values', expectedBindings: { price: '200', tax: '32.0', total: '232.0' } },
    { id: 'build-supported', type: 'supported-execution' },
    { id: 'build-assignment-count', type: 'assignment-count', expected: 3 },
    { id: 'build-dependencies', type: 'assignment-dependencies', requiredDependencies: { result: ['first', 'second'] } },
  ],
});

export const functionsAndReturnsLesson = parse({
  schemaVersion: 3,
  id: 'functions-and-returns',
  slug: 'functions-and-returns',
  version: '3.0.0',
  courseId: 'python-foundations',
  title: 'Functions and Return Values',
  subtitle: 'Package reusable work and send a result back.',
  goal: 'Understand parameters, local state, calls, and returned values.',
  lens: { initialProgramId: 'double-five', initialView: 'flow' },
  sections: [
    { id: 'function-idea', heading: 'Reusable work', internalRole: 'introduce', lensCueId: 'functions-introduce', blocks: [{ type: 'prose', paragraphs: ['A function names a reusable piece of work.', 'A call supplies an input and receives the returned result.'] }, { type: 'definition', text: 'A return value is the result a function sends back to its caller.' }] },
    { id: 'function-shape', heading: 'Read the function shape', internalRole: 'structural-model', lensCueId: 'functions-shape', blocks: [{ type: 'code-shape', title: 'Definition, work, return, call', rows: [{ label: 'Definition', code: 'def double(n):', explanation: 'Names the function and its parameter.', tone: 'name' }, { label: 'Work', code: 'result = n * 2', explanation: 'Builds a local result from the input.', tone: 'work' }, { label: 'Return', code: 'return result', explanation: 'Sends the result to the caller.', tone: 'output' }, { label: 'Call', code: 'answer = double(5)', explanation: 'Supplies an argument and stores the return value.', tone: 'input' }] }] },
    { id: 'predict-return', heading: 'Predict the return', internalRole: 'predict', lensCueId: 'functions-predict', blocks: [{ type: 'value-prediction', responseId: 'functions-return-prediction', prompt: 'What value will answer store?', fields: [{ id: 'answer', label: 'answer', expected: 10 }] }] },
    { id: 'follow-call', heading: 'Follow the call', internalRole: 'guided-explore', lensCueId: 'functions-guided', blocks: [{ type: 'observation', text: 'Follow the call, parameter binding, local result, return, and module assignment.' }] },
    { id: 'change-input', heading: 'Change the input', internalRole: 'variation', lensCueId: 'functions-explore', blocks: [{ type: 'variation-prediction', responseId: 'functions-input-prediction', prompt: 'Which stored value changes when the argument becomes 8?', options: ['answer'], expected: ['answer'], variationId: 'double-eight' }] },
    { id: 'recognize-function', heading: 'Recognize another function', internalRole: 'recognize', lensCueId: 'functions-recognize', blocks: [{ type: 'recognition-check', responseId: 'functions-recognition', prompt: 'Classify the names in this function.', source: 'def add_tip(bill):\n    total = bill + 5\n    return total', roles: [{ id: 'parameter', label: 'parameter' }, { id: 'local', label: 'local result' }], items: [{ id: 'bill', label: 'bill', expectedRole: 'parameter' }, { id: 'total', label: 'total', expectedRole: 'local' }], successFeedback: 'Correct: bill receives the input and total stores local work.', retryFeedback: 'Look at the function header for the parameter and the indented assignment for local work.' }] },
    { id: 'build-function', heading: 'Build a function', internalRole: 'produce', lensCueId: 'functions-build', blocks: [{ type: 'build', responseId: 'functions-build-response', prompt: 'Build a one-parameter function whose return depends on that parameter, then call it.', programId: 'functions-build-scaffold', verificationIds: ['functions-build-supported', 'functions-build-shape', 'functions-build-return'], criteria: ['Define one function with one parameter.', 'Return a value that depends on n.', 'Call the function from module code.'] }] },
  ],
  programs: [
    { id: 'double-five', source: 'def double(n):\n    result = n * 2\n    return result\n\nanswer = double(5)', argsText: '' },
    { id: 'double-eight', source: 'def double(n):\n    result = n * 2\n    return result\n\nanswer = double(8)', argsText: '' },
    { id: 'recognize-add-tip', source: 'def add_tip(bill):\n    total = bill + 5\n    return total\n\nanswer = add_tip(20)', argsText: '' },
    { id: 'functions-build-scaffold', source: 'def double(n):\n    result = 0\n    return result\n\nanswer = double(5)', argsText: '' },
  ],
  scenarios: [
    { id: 'double-five-scenario', label: 'Argument 5', programId: 'double-five', verificationIds: [] },
    { id: 'double-eight-scenario', label: 'Argument 8', programId: 'double-eight', verificationIds: ['functions-eight-value'] },
  ],
  variations: [{
    id: 'double-eight',
    label: 'Argument 8',
    applyLabel: 'Run with 8',
    programId: 'double-eight',
    predictionId: 'functions-input-prediction',
    verificationIds: ['functions-eight-value'],
    comparison: { kind: 'bindings', baselineProgramId: 'double-five', fields: [{ key: 'answer', label: 'answer' }] },
    successFeedback: 'The changed argument produces the configured return value.',
    retryFeedback: 'Compare the stored answer before and after the argument changes.',
  }],
  cues: [
    { id: 'functions-introduce', sectionId: 'function-idea', apply: 'initialize-once', presentation: 'quiet', mode: 'observe', programId: 'double-five', view: 'flow', frame: 'start', editing: 'locked', eyebrow: 'Learning Lens · waiting', title: 'A reusable piece of work', instruction: 'Start with the function idea.' },
    { id: 'functions-shape', sectionId: 'function-shape', apply: 'guide-without-reset', presentation: 'visible', mode: 'observe', view: 'structure', frame: 'start', editing: 'locked', eyebrow: 'Observe', title: 'Definition, parameter, return, and call', instruction: 'Match the syntax to the function structure.' },
    { id: 'functions-predict', sectionId: 'predict-return', apply: 'guide-without-reset', presentation: 'quiet', mode: 'observe', view: 'state', frame: 'start', editing: 'locked', revealPolicy: { responseId: 'functions-return-prediction', unlockAt: 'committed', concealedViews: ['state', 'explain', 'structure'], preCommitFrame: 'start' }, eyebrow: 'Predict first', title: 'The return value is concealed', instruction: 'Commit the return prediction before inspecting execution.' },
    { id: 'functions-guided', sectionId: 'follow-call', apply: 'guide-without-reset', presentation: 'focus', mode: 'guided', view: 'explain', frame: 'start', editing: 'locked', requiresResponseId: 'functions-return-prediction', eyebrow: 'Guided', title: 'Follow the call and return', instruction: 'Step through the call frame and return.' },
    { id: 'functions-explore', sectionId: 'change-input', apply: 'guide-without-reset', presentation: 'visible', mode: 'explore', view: 'state', frame: 'end', editing: 'authored-variations', eyebrow: 'Explore', title: 'Change the argument', instruction: 'Predict first, then run the authored variation.' },
    { id: 'functions-recognize', sectionId: 'recognize-function', apply: 'replace-program', presentation: 'visible', mode: 'observe', programId: 'recognize-add-tip', view: 'structure', frame: 'start', editing: 'locked', revealPolicy: { responseId: 'functions-recognition', unlockAt: 'revealed', concealedViews: ['state', 'explain', 'structure'], preCommitFrame: 'start' }, eyebrow: 'Recognize', title: 'Same function shape', instruction: 'Classify the names before viewing structure.' },
    { id: 'functions-build', sectionId: 'build-function', apply: 'replace-program', presentation: 'focus', mode: 'build', programId: 'functions-build-scaffold', view: 'state', frame: 'start', editing: 'free', eyebrow: 'Build', title: 'Build and call a function', instruction: 'Use the shared editor and semantic checks.' },
  ],
  verifications: [
    { id: 'functions-eight-value', type: 'binding-values', expectedBindings: { answer: '16' } },
    { id: 'functions-build-supported', type: 'supported-execution' },
    { id: 'functions-build-shape', type: 'function-shape', parameterCount: 1, requireModuleCall: true },
    { id: 'functions-build-return', type: 'return-dependency', parameterNames: ['n'] },
  ],
});

export const conditionsAndBranchesLesson = parse({
  schemaVersion: 3,
  id: 'conditions-and-branches',
  slug: 'conditions-and-branches',
  version: '3.0.0',
  courseId: 'python-foundations',
  title: 'Conditions and Branches',
  subtitle: 'Ask a question and choose one path.',
  goal: 'Understand Boolean guards, selected paths, and if/else outcomes.',
  lens: { initialProgramId: 'age-sixteen', initialView: 'flow' },
  sections: [
    { id: 'decision-idea', heading: 'A program can decide', internalRole: 'introduce', lensCueId: 'conditions-introduce', blocks: [{ type: 'prose', paragraphs: ['A condition asks a true-or-false question.', 'Python executes only the branch selected by that answer.'] }, { type: 'definition', text: 'A branch is one possible path through a decision.' }] },
    { id: 'condition-shape', heading: 'Read the decision shape', internalRole: 'structural-model', lensCueId: 'conditions-shape', blocks: [{ type: 'code-shape', title: 'Guard and two paths', rows: [{ label: 'Guard', code: 'if age >= 18:', explanation: 'Asks a Boolean question.', tone: 'input' }, { label: 'True path', code: 'status = "adult"', explanation: 'Runs when the guard is true.', tone: 'work' }, { label: 'False path', code: 'else: status = "minor"', explanation: 'Runs when the guard is false.', tone: 'output' }] }] },
    { id: 'predict-branch', heading: 'Predict the branch', internalRole: 'predict', lensCueId: 'conditions-predict', blocks: [{ type: 'value-prediction', responseId: 'conditions-branch-prediction', prompt: 'For age 16, predict 0 for the false path or 1 for the true path.', fields: [{ id: 'branch', label: 'branch', expected: 0 }] }] },
    { id: 'follow-branch', heading: 'Follow the selected path', internalRole: 'guided-explore', lensCueId: 'conditions-guided', blocks: [{ type: 'observation', text: 'Watch the guard evaluate and confirm that only the selected branch changes State.' }] },
    { id: 'change-condition', heading: 'Change the condition input', internalRole: 'variation', lensCueId: 'conditions-explore', blocks: [{ type: 'variation-prediction', responseId: 'conditions-age-prediction', prompt: 'Which result changes when age becomes 21?', options: ['status'], expected: ['status'], variationId: 'age-twenty-one' }] },
    { id: 'recognize-decision', heading: 'Recognize another decision', internalRole: 'recognize', lensCueId: 'conditions-recognize', blocks: [{ type: 'recognition-check', responseId: 'conditions-recognition', prompt: 'Classify the decision parts.', source: 'if score >= 50:\n    result = "pass"\nelse:\n    result = "retry"', roles: [{ id: 'guard', label: 'Boolean guard' }, { id: 'outcome', label: 'branch outcome' }], items: [{ id: 'score >= 50', label: 'score >= 50', expectedRole: 'guard' }, { id: 'result', label: 'result assignments', expectedRole: 'outcome' }], successFeedback: 'Correct: the comparison is the guard and the assignments produce branch outcomes.', retryFeedback: 'Find the true-or-false expression after if, then find what each branch assigns.' }] },
    { id: 'build-decision', heading: 'Build a decision', internalRole: 'produce', lensCueId: 'conditions-build', blocks: [{ type: 'build', responseId: 'conditions-build-response', prompt: 'Build a supported if/else decision that assigns status on both paths.', programId: 'conditions-build-scaffold', verificationIds: ['conditions-build-supported', 'conditions-build-shape', 'conditions-build-coverage'], criteria: ['Use a Boolean if/else guard.', 'Assign status on both paths.', 'Keep both deterministic scenarios supported.'] }] },
  ],
  programs: [
    { id: 'age-sixteen', source: 'age = 16\nif age >= 18:\n    status = "adult"\nelse:\n    status = "minor"', argsText: '' },
    { id: 'age-twenty-one', source: 'age = 21\nif age >= 18:\n    status = "adult"\nelse:\n    status = "minor"', argsText: '' },
    { id: 'recognize-pass', source: 'score = 65\nif score >= 50:\n    result = "pass"\nelse:\n    result = "retry"', argsText: '' },
    { id: 'conditions-build-scaffold', source: 'age = 16\nif age >= 18:\n    status = ""\nelse:\n    status = ""', argsText: '' },
  ],
  scenarios: [
    { id: 'age-16', label: 'Age 16', programId: 'age-sixteen', verificationIds: [] },
    { id: 'age-21', label: 'Age 21', programId: 'age-twenty-one', verificationIds: ['conditions-adult-value'] },
  ],
  variations: [{
    id: 'age-twenty-one',
    label: 'Age 21',
    applyLabel: 'Run age 21',
    programId: 'age-twenty-one',
    predictionId: 'conditions-age-prediction',
    verificationIds: ['conditions-adult-value', 'conditions-build-coverage'],
    comparison: { kind: 'path', baselineProgramId: 'age-sixteen', fields: [] },
    successFeedback: 'The alternate input selects the other branch.',
    retryFeedback: 'Compare the guard outcomes and resulting path.',
  }],
  cues: [
    { id: 'conditions-introduce', sectionId: 'decision-idea', apply: 'initialize-once', presentation: 'quiet', mode: 'observe', programId: 'age-sixteen', view: 'flow', frame: 'start', editing: 'locked', eyebrow: 'Learning Lens · waiting', title: 'One question, one selected path', instruction: 'Start with the decision idea.' },
    { id: 'conditions-shape', sectionId: 'condition-shape', apply: 'guide-without-reset', presentation: 'visible', mode: 'observe', view: 'structure', frame: 'start', editing: 'locked', eyebrow: 'Observe', title: 'See the guard and branches', instruction: 'Match syntax to the decision structure.' },
    { id: 'conditions-predict', sectionId: 'predict-branch', apply: 'guide-without-reset', presentation: 'quiet', mode: 'observe', view: 'state', frame: 'start', editing: 'locked', revealPolicy: { responseId: 'conditions-branch-prediction', unlockAt: 'committed', concealedViews: ['state', 'explain', 'structure'], preCommitFrame: 'start' }, eyebrow: 'Predict first', title: 'The selected path is concealed', instruction: 'Commit the branch prediction before execution.' },
    { id: 'conditions-guided', sectionId: 'follow-branch', apply: 'guide-without-reset', presentation: 'focus', mode: 'guided', view: 'explain', frame: 'start', editing: 'locked', requiresResponseId: 'conditions-branch-prediction', eyebrow: 'Guided', title: 'Follow the selected path', instruction: 'Step through the guard and selected assignment.' },
    { id: 'conditions-explore', sectionId: 'change-condition', apply: 'guide-without-reset', presentation: 'visible', mode: 'explore', view: 'state', frame: 'end', editing: 'authored-variations', eyebrow: 'Explore', title: 'Try the other scenario', instruction: 'Predict, then run the alternate age.' },
    { id: 'conditions-recognize', sectionId: 'recognize-decision', apply: 'replace-program', presentation: 'visible', mode: 'observe', programId: 'recognize-pass', view: 'structure', frame: 'start', editing: 'locked', revealPolicy: { responseId: 'conditions-recognition', unlockAt: 'revealed', concealedViews: ['state', 'explain', 'structure'], preCommitFrame: 'start' }, eyebrow: 'Recognize', title: 'Same decision structure', instruction: 'Classify the decision parts before viewing Lens.' },
    { id: 'conditions-build', sectionId: 'build-decision', apply: 'replace-program', presentation: 'focus', mode: 'build', programId: 'conditions-build-scaffold', view: 'state', frame: 'start', editing: 'free', eyebrow: 'Build', title: 'Build a two-path decision', instruction: 'Use the shared editor and semantic checks.' },
  ],
  verifications: [
    { id: 'conditions-adult-value', type: 'binding-values', expectedBindings: { status: "'adult'" } },
    { id: 'conditions-build-supported', type: 'supported-execution' },
    { id: 'conditions-build-shape', type: 'branch-shape', requireElse: true, resultBinding: 'status' },
    { id: 'conditions-build-coverage', type: 'branch-coverage', expectedOutcomes: [false, true] },
  ],
});

export const loopsOverListsLesson = parse({
  schemaVersion: 3,
  id: 'loops-over-lists',
  slug: 'loops-over-lists',
  version: '3.0.0',
  courseId: 'python-foundations',
  title: 'Loops over Lists',
  subtitle: 'Repeat work for every item and preserve a running result.',
  goal: 'Understand iteration, current items, and accumulator updates.',
  lens: { initialProgramId: 'sum-even', initialView: 'flow' },
  sections: [
    { id: 'loop-idea', heading: 'Repeat work', internalRole: 'introduce', lensCueId: 'loops-introduce', blocks: [{ type: 'prose', paragraphs: ['A loop repeats the same work for each item in a collection.', 'An accumulator preserves information between iterations.'] }, { type: 'definition', text: 'An accumulator is a value updated repeatedly as a loop progresses.' }] },
    { id: 'loop-shape', heading: 'Read the loop shape', internalRole: 'structural-model', lensCueId: 'loops-shape', blocks: [{ type: 'code-shape', title: 'Collection, accumulator, iterator, update', rows: [{ label: 'Collection', code: 'numbers = [2, 4, 6]', explanation: 'Provides the items.', tone: 'input' }, { label: 'Accumulator', code: 'total = 0', explanation: 'Starts before repetition.', tone: 'value' }, { label: 'Loop', code: 'for number in numbers:', explanation: 'Selects one current item.', tone: 'name' }, { label: 'Update', code: 'total = total + number', explanation: 'Uses the prior total and current item.', tone: 'work' }] }] },
    { id: 'predict-loop', heading: 'Predict repetition', internalRole: 'predict', lensCueId: 'loops-predict', blocks: [{ type: 'value-prediction', responseId: 'loops-prediction', prompt: 'Predict the iteration count and final total.', fields: [{ id: 'iterations', label: 'iterations', expected: 3 }, { id: 'total', label: 'total', expected: 12 }] }] },
    { id: 'follow-loop', heading: 'Follow each iteration', internalRole: 'guided-explore', lensCueId: 'loops-guided', blocks: [{ type: 'observation', text: 'Follow each selected item and watch the accumulator preserve its previous value.' }] },
    { id: 'change-list', heading: 'Change the list', internalRole: 'variation', lensCueId: 'loops-explore', blocks: [{ type: 'variation-prediction', responseId: 'loops-list-prediction', prompt: 'Which configured result changes for [1, 3, 5]?', options: ['total'], expected: ['total'], variationId: 'sum-odd' }] },
    { id: 'recognize-loop', heading: 'Recognize another loop', internalRole: 'recognize', lensCueId: 'loops-recognize', blocks: [{ type: 'recognition-check', responseId: 'loops-recognition', prompt: 'Classify the loop names.', source: 'scores = [1, 2, 3]\npoints = 0\nfor score in scores:\n    points = points + score', roles: [{ id: 'collection', label: 'collection' }, { id: 'iterator', label: 'current item' }, { id: 'accumulator', label: 'accumulator' }], items: [{ id: 'scores', label: 'scores', expectedRole: 'collection' }, { id: 'score', label: 'score', expectedRole: 'iterator' }, { id: 'points', label: 'points', expectedRole: 'accumulator' }], successFeedback: 'Correct: the collection supplies items, the iterator holds the current item, and the accumulator preserves the running result.', retryFeedback: 'Find the name after in, the name after for, and the value updated inside the loop.' }] },
    { id: 'build-loop', heading: 'Build a loop', internalRole: 'produce', lensCueId: 'loops-build', blocks: [{ type: 'build', responseId: 'loops-build-response', prompt: 'Build a loop that adds each number into total.', programId: 'loops-build-scaffold', verificationIds: ['loops-build-supported', 'loops-build-shape', 'loops-build-dependency'], criteria: ['Initialize total before the loop.', 'Iterate with number.', 'Update total using the current number.'] }] },
  ],
  programs: [
    { id: 'sum-even', source: 'numbers = [2, 4, 6]\ntotal = 0\nfor number in numbers:\n    total = total + number', argsText: '' },
    { id: 'sum-odd', source: 'numbers = [1, 3, 5]\ntotal = 0\nfor number in numbers:\n    total = total + number', argsText: '' },
    { id: 'recognize-scores', source: 'scores = [1, 2, 3]\npoints = 0\nfor score in scores:\n    points = points + score', argsText: '' },
    { id: 'loops-build-scaffold', source: 'numbers = [2, 4, 6]\ntotal = 0\nfor number in numbers:\n    total = total', argsText: '' },
  ],
  scenarios: [
    { id: 'sum-even-scenario', label: 'Even numbers', programId: 'sum-even', verificationIds: [] },
    { id: 'sum-odd-scenario', label: 'Odd numbers', programId: 'sum-odd', verificationIds: ['loops-odd-value', 'loops-three-iterations'] },
  ],
  variations: [{
    id: 'sum-odd',
    label: 'List [1, 3, 5]',
    applyLabel: 'Run [1, 3, 5]',
    programId: 'sum-odd',
    predictionId: 'loops-list-prediction',
    verificationIds: ['loops-odd-value', 'loops-three-iterations'],
    comparison: { kind: 'bindings', baselineProgramId: 'sum-even', fields: [{ key: 'total', label: 'total' }] },
    successFeedback: 'The alternate list produces the configured total in three iterations.',
    retryFeedback: 'Compare the final accumulator and observed iteration count.',
  }],
  cues: [
    { id: 'loops-introduce', sectionId: 'loop-idea', apply: 'initialize-once', presentation: 'quiet', mode: 'observe', programId: 'sum-even', view: 'flow', frame: 'start', editing: 'locked', eyebrow: 'Learning Lens · waiting', title: 'Repeat work while preserving state', instruction: 'Start with the repetition idea.' },
    { id: 'loops-shape', sectionId: 'loop-shape', apply: 'guide-without-reset', presentation: 'visible', mode: 'observe', view: 'structure', frame: 'start', editing: 'locked', eyebrow: 'Observe', title: 'See the loop structure', instruction: 'Match collection, iterator, accumulator, and update.' },
    { id: 'loops-predict', sectionId: 'predict-loop', apply: 'guide-without-reset', presentation: 'quiet', mode: 'observe', view: 'state', frame: 'start', editing: 'locked', revealPolicy: { responseId: 'loops-prediction', unlockAt: 'committed', concealedViews: ['state', 'explain', 'structure'], preCommitFrame: 'start' }, eyebrow: 'Predict first', title: 'Iterations and final state are concealed', instruction: 'Commit both predictions before execution.' },
    { id: 'loops-guided', sectionId: 'follow-loop', apply: 'guide-without-reset', presentation: 'focus', mode: 'guided', view: 'explain', frame: 'start', editing: 'locked', requiresResponseId: 'loops-prediction', eyebrow: 'Guided', title: 'Follow repeated frames', instruction: 'Step through every selected item and update.' },
    { id: 'loops-explore', sectionId: 'change-list', apply: 'guide-without-reset', presentation: 'visible', mode: 'explore', view: 'state', frame: 'end', editing: 'authored-variations', eyebrow: 'Explore', title: 'Change the list', instruction: 'Predict, then run the authored list variation.' },
    { id: 'loops-recognize', sectionId: 'recognize-loop', apply: 'replace-program', presentation: 'visible', mode: 'observe', programId: 'recognize-scores', view: 'structure', frame: 'start', editing: 'locked', revealPolicy: { responseId: 'loops-recognition', unlockAt: 'revealed', concealedViews: ['state', 'explain', 'structure'], preCommitFrame: 'start' }, eyebrow: 'Recognize', title: 'Same loop structure', instruction: 'Classify the names before viewing Lens.' },
    { id: 'loops-build', sectionId: 'build-loop', apply: 'replace-program', presentation: 'focus', mode: 'build', programId: 'loops-build-scaffold', view: 'state', frame: 'start', editing: 'free', eyebrow: 'Build', title: 'Build an accumulator loop', instruction: 'Use the shared editor and semantic checks.' },
  ],
  verifications: [
    { id: 'loops-odd-value', type: 'binding-values', expectedBindings: { total: '9' } },
    { id: 'loops-three-iterations', type: 'loop-iterations', expected: 3 },
    { id: 'loops-build-supported', type: 'supported-execution' },
    { id: 'loops-build-shape', type: 'loop-shape', iterator: 'number', accumulator: 'total' },
    { id: 'loops-build-dependency', type: 'accumulator-dependency', accumulator: 'total', iterator: 'number' },
  ],
});
