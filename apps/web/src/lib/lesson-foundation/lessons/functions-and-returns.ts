import { LessonDefinitionV4Schema } from '@lol/lens-contracts';

export const lesson = LessonDefinitionV4Schema.parse({
  schemaVersion: 4,
  id: 'functions-and-returns',
  slug: 'functions-and-returns',
  version: '4.0.0',
  courseId: 'python-foundations',
  title: 'Functions and Return Values',
  subtitle: 'Package reusable work and send a result back.',
  goal: 'Understand parameters, local state, calls, and returned values.',
  sections: [
    {
      id: 'pre-transfer',
      heading: 'Before the lesson',
      internalRole: 'predict',
      blocks: [
        {
          type: 'transfer-check',
          responseId: 'functions-and-returns-pre-transfer',
          phase: 'pre',
          prompt: 'Which name receives the function result?',
          source: 'def add_one(value):\n    return value + 1\n\nnext_value = add_one(6)',
          options: [
            {
              id: 'value',
              label: 'value',
            },
            {
              id: 'next_value',
              label: 'next_value',
            },
          ],
        },
      ],
      lensCueId: 'functions-and-returns-pre-transfer-cue',
    },
    {
      id: 'function-idea',
      heading: 'Reusable work',
      internalRole: 'introduce',
      blocks: [
        {
          type: 'prose',
          paragraphs: [
            'A function names a reusable piece of work.',
            'A call supplies an input and receives the returned result.',
          ],
        },
        {
          type: 'definition',
          text: 'A return value is the result a function sends back to its caller.',
        },
      ],
      lensCueId: 'functions-introduce',
    },
    {
      id: 'function-shape',
      heading: 'Read the function shape',
      internalRole: 'structural-model',
      blocks: [
        {
          type: 'code-shape',
          title: 'Definition, work, return, call',
          rows: [
            {
              label: 'Definition',
              code: 'def double(n):',
              explanation: 'Names the function and its parameter.',
              tone: 'name',
            },
            {
              label: 'Work',
              code: 'result = n * 2',
              explanation: 'Builds a local result from the input.',
              tone: 'work',
            },
            {
              label: 'Return',
              code: 'return result',
              explanation: 'Sends the result to the caller.',
              tone: 'output',
            },
            {
              label: 'Call',
              code: 'answer = double(5)',
              explanation: 'Supplies an argument and stores the return value.',
              tone: 'input',
            },
          ],
        },
      ],
      lensCueId: 'functions-shape',
    },
    {
      id: 'predict-return',
      heading: 'Predict the return',
      internalRole: 'predict',
      blocks: [
        {
          type: 'value-prediction',
          responseId: 'functions-return-prediction',
          prompt: 'What value will answer store?',
          fields: [
            {
              id: 'answer',
              label: 'answer',
            },
          ],
        },
      ],
      lensCueId: 'functions-predict',
    },
    {
      id: 'follow-call',
      heading: 'Follow the call',
      internalRole: 'guided-explore',
      blocks: [
        {
          type: 'observation',
          text: 'Follow the call, parameter binding, local result, return, and module assignment.',
        },
      ],
      lensCueId: 'functions-guided',
    },
    {
      id: 'change-input',
      heading: 'Change the input',
      internalRole: 'variation',
      blocks: [
        {
          type: 'variation-prediction',
          responseId: 'functions-input-prediction',
          prompt: 'Which stored value changes when the argument becomes 8?',
          options: ['answer'],
          variationId: 'double-eight',
        },
      ],
      lensCueId: 'functions-explore',
    },
    {
      id: 'recognize-function',
      heading: 'Recognize another function',
      internalRole: 'recognize',
      blocks: [
        {
          type: 'recognition-check',
          responseId: 'functions-recognition',
          prompt: 'Classify the names in this function.',
          source: 'def add_tip(bill):\n    total = bill + 5\n    return total',
          roles: [
            {
              id: 'parameter',
              label: 'parameter',
            },
            {
              id: 'local',
              label: 'local result',
            },
          ],
          items: [
            {
              id: 'bill',
              label: 'bill',
            },
            {
              id: 'total',
              label: 'total',
            },
          ],
        },
      ],
      lensCueId: 'functions-recognize',
    },
    {
      id: 'build-function',
      heading: 'Build a function',
      internalRole: 'produce',
      blocks: [
        {
          type: 'build',
          responseId: 'functions-build-response',
          prompt:
            'Build a one-parameter function whose return depends on that parameter, then call it.',
          programId: 'functions-build-scaffold',
          criteria: [
            'Define one function with one parameter.',
            'Return a value that depends on n.',
            'Call the function from module code.',
          ],
        },
      ],
      lensCueId: 'functions-build',
    },
    {
      id: 'post-transfer',
      heading: 'Try a new example',
      internalRole: 'produce',
      blocks: [
        {
          type: 'transfer-check',
          responseId: 'functions-and-returns-post-transfer',
          phase: 'post',
          prompt: 'Which name receives the returned value?',
          source: 'def triple(amount):\n    return amount * 3\n\nscore = triple(4)',
          options: [
            {
              id: 'amount',
              label: 'amount',
            },
            {
              id: 'score',
              label: 'score',
            },
          ],
        },
      ],
      lensCueId: 'functions-and-returns-post-transfer-cue',
    },
  ],
  lens: {
    initialProgramId: 'double-five',
    initialView: 'flow',
  },
  programs: [
    {
      id: 'double-five',
      source: 'def double(n):\n    result = n * 2\n    return result\n\nanswer = double(5)',
      argsText: '',
    },
    {
      id: 'double-eight',
      source: 'def double(n):\n    result = n * 2\n    return result\n\nanswer = double(8)',
      argsText: '',
    },
    {
      id: 'recognize-add-tip',
      source: 'def add_tip(bill):\n    total = bill + 5\n    return total\n\nanswer = add_tip(20)',
      argsText: '',
    },
    {
      id: 'functions-build-scaffold',
      source: 'def double(n):\n    result = 0\n    return result\n\nanswer = double(5)',
      argsText: '',
    },
  ],
  scenarios: [
    {
      id: 'function-2',
      label: 'Argument 2',
      strategy: {
        type: 'supply-function-arguments',
        functionSelector: 'first',
        argumentsSource: ['2'],
      },
      expectedBindings: {},
      expectedRoleValues: {
        'module-result': '4',
      },
    },
    {
      id: 'function-7',
      label: 'Argument 7',
      strategy: {
        type: 'supply-function-arguments',
        functionSelector: 'first',
        argumentsSource: ['7'],
      },
      expectedBindings: {},
      expectedRoleValues: {
        'module-result': '14',
      },
    },
  ],
  variations: [
    {
      id: 'double-eight',
      label: 'Argument 8',
      applyLabel: 'Run with 8',
      programId: 'double-eight',
      predictionId: 'functions-input-prediction',
      verificationIds: ['functions-eight-value'],
      comparison: {
        kind: 'bindings',
        baselineProgramId: 'double-five',
        fields: [
          {
            key: 'answer',
            label: 'answer',
          },
        ],
      },
      successFeedback: 'The changed argument produces the configured return value.',
      retryFeedback: 'Compare the stored answer before and after the argument changes.',
    },
  ],
  cues: [
    {
      id: 'functions-and-returns-pre-transfer-cue',
      sectionId: 'pre-transfer',
      apply: 'initialize-once',
      presentation: 'quiet',
      mode: 'observe',
      programId: 'double-five',
      editing: 'locked',
    },
    {
      id: 'functions-introduce',
      sectionId: 'function-idea',
      apply: 'initialize-once',
      presentation: 'quiet',
      mode: 'observe',
      programId: 'double-five',
      view: 'flow',
      frame: 'start',
      editing: 'locked',
      eyebrow: 'Learning Lens · waiting',
      title: 'A reusable piece of work',
      instruction: 'Start with the function idea.',
    },
    {
      id: 'functions-shape',
      sectionId: 'function-shape',
      apply: 'guide-without-reset',
      presentation: 'visible',
      mode: 'observe',
      view: 'structure',
      frame: 'start',
      editing: 'locked',
      eyebrow: 'Observe',
      title: 'Definition, parameter, return, and call',
      instruction: 'Match the syntax to the function structure.',
    },
    {
      id: 'functions-predict',
      sectionId: 'predict-return',
      apply: 'guide-without-reset',
      presentation: 'quiet',
      mode: 'observe',
      view: 'state',
      frame: 'start',
      editing: 'locked',
      eyebrow: 'Predict first',
      title: 'The return value is concealed',
      instruction: 'Commit the return prediction before inspecting execution.',
      revealPolicy: {
        responseId: 'functions-return-prediction',
        unlockAt: 'committed',
        concealedViews: ['state', 'explain', 'structure'],
        preCommitFrame: 'start',
      },
    },
    {
      id: 'functions-guided',
      sectionId: 'follow-call',
      apply: 'guide-without-reset',
      presentation: 'focus',
      mode: 'guided',
      view: 'explain',
      frame: 'start',
      editing: 'locked',
      eyebrow: 'Guided',
      title: 'Follow the call and return',
      instruction: 'Step through the call frame and return.',
      requiresResponseId: 'functions-return-prediction',
    },
    {
      id: 'functions-explore',
      sectionId: 'change-input',
      apply: 'guide-without-reset',
      presentation: 'visible',
      mode: 'explore',
      view: 'state',
      frame: 'end',
      editing: 'authored-variations',
      eyebrow: 'Explore',
      title: 'Change the argument',
      instruction: 'Predict first, then run the authored variation.',
    },
    {
      id: 'functions-recognize',
      sectionId: 'recognize-function',
      apply: 'replace-program',
      presentation: 'visible',
      mode: 'observe',
      programId: 'recognize-add-tip',
      view: 'structure',
      frame: 'start',
      editing: 'locked',
      eyebrow: 'Recognize',
      title: 'Same function shape',
      instruction: 'Classify the names before viewing structure.',
      revealPolicy: {
        responseId: 'functions-recognition',
        unlockAt: 'revealed',
        concealedViews: ['state', 'explain', 'structure'],
        preCommitFrame: 'start',
      },
    },
    {
      id: 'functions-build',
      sectionId: 'build-function',
      apply: 'replace-program',
      presentation: 'focus',
      mode: 'build',
      programId: 'functions-build-scaffold',
      view: 'state',
      frame: 'start',
      editing: 'free',
      eyebrow: 'Build',
      title: 'Build and call a function',
      instruction: 'Use the shared editor and semantic checks.',
    },
    {
      id: 'functions-and-returns-post-transfer-cue',
      sectionId: 'post-transfer',
      apply: 'guide-without-reset',
      presentation: 'quiet',
      mode: 'observe',
      editing: 'locked',
    },
  ],
  verifications: [
    {
      id: 'functions-eight-value',
      type: 'binding-values',
      expectedBindings: {
        answer: '16',
      },
    },
    {
      id: 'functions-build-supported',
      type: 'supported-execution',
    },
    {
      id: 'functions-build-shape',
      type: 'function-shape',
      parameterCount: 1,
      requireModuleCall: true,
    },
    {
      id: 'functions-build-return',
      type: 'return-dependency',
      parameterNames: ['n'],
    },
    {
      id: 'functions-and-returns-build-role',
      type: 'return-dependency-role',
      functionSelector: 'first',
      requiredParameterIndexes: [0],
      requireModuleCall: true,
    },
  ],
  assessments: [
    {
      id: 'functions-return-prediction-assessment',
      responseId: 'functions-return-prediction',
      type: 'prediction',
      expected: {
        answer: 10,
      },
      successFeedback: 'Your committed prediction matches the execution.',
      retryFeedback: 'Compare your committed prediction with the Lens evidence.',
    },
    {
      id: 'functions-input-prediction-assessment',
      responseId: 'functions-input-prediction',
      type: 'selection',
      expected: ['answer'],
      successFeedback: 'Prediction committed.',
      retryFeedback: 'Prediction committed. Compare it with the resulting Lens evidence.',
    },
    {
      id: 'functions-recognition-assessment',
      responseId: 'functions-recognition',
      type: 'recognition',
      expectedRoles: {
        bill: 'parameter',
        total: 'local',
      },
      successFeedback: 'Correct: bill receives the input and total stores local work.',
      retryFeedback:
        'Look at the function header for the parameter and the indented assignment for local work.',
    },
    {
      id: 'functions-build-response-assessment',
      responseId: 'functions-build-response',
      type: 'build',
      namePolicy: 'role-based',
      verificationIds: ['functions-and-returns-build-role'],
      scenarioIds: ['function-2', 'function-7'],
    },
    {
      id: 'functions-and-returns-pre-transfer-assessment',
      responseId: 'functions-and-returns-pre-transfer',
      type: 'transfer',
      phase: 'pre',
      expectedOptionId: 'next_value',
      successFeedback: 'Response recorded.',
      retryFeedback: 'Response recorded.',
    },
    {
      id: 'functions-and-returns-post-transfer-assessment',
      responseId: 'functions-and-returns-post-transfer',
      type: 'transfer',
      phase: 'post',
      expectedOptionId: 'score',
      successFeedback: 'Transfer response recorded.',
      retryFeedback: 'Transfer response recorded.',
    },
  ],
});
