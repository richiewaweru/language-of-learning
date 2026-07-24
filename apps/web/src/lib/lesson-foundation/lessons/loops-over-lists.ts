import { LessonDefinitionV4Schema } from '@lol/lens-contracts';

export const lesson = LessonDefinitionV4Schema.parse({
  schemaVersion: 4,
  id: 'loops-over-lists',
  slug: 'loops-over-lists',
  version: '4.0.0',
  courseId: 'python-foundations',
  title: 'Loops over Lists',
  subtitle: 'Repeat work for every item and preserve a running result.',
  goal: 'Understand iteration, current items, and accumulator updates.',
  sections: [
    {
      id: 'pre-transfer',
      heading: 'Before the lesson',
      internalRole: 'predict',
      blocks: [
        {
          type: 'transfer-check',
          responseId: 'loops-over-lists-pre-transfer',
          phase: 'pre',
          prompt: 'How many times does this loop advance?',
          source: 'items = [4, 5]\ntotal = 0\nfor item in items:\n    total = total + item',
          options: [
            {
              id: '2',
              label: '2 times',
            },
            {
              id: '3',
              label: '3 times',
            },
          ],
        },
      ],
      lensCueId: 'loops-over-lists-pre-transfer-cue',
    },
    {
      id: 'loop-idea',
      heading: 'Repeat work',
      internalRole: 'introduce',
      blocks: [
        {
          type: 'prose',
          paragraphs: [
            'A loop repeats the same work for each item in a collection.',
            'An accumulator preserves information between iterations.',
          ],
        },
        {
          type: 'definition',
          text: 'An accumulator is a value updated repeatedly as a loop progresses.',
        },
      ],
      lensCueId: 'loops-introduce',
    },
    {
      id: 'loop-shape',
      heading: 'Read the loop shape',
      internalRole: 'structural-model',
      blocks: [
        {
          type: 'code-shape',
          title: 'Collection, accumulator, iterator, update',
          rows: [
            {
              label: 'Collection',
              code: 'numbers = [2, 4, 6]',
              explanation: 'Provides the items.',
              tone: 'input',
            },
            {
              label: 'Accumulator',
              code: 'total = 0',
              explanation: 'Starts before repetition.',
              tone: 'value',
            },
            {
              label: 'Loop',
              code: 'for number in numbers:',
              explanation: 'Selects one current item.',
              tone: 'name',
            },
            {
              label: 'Update',
              code: 'total = total + number',
              explanation: 'Uses the prior total and current item.',
              tone: 'work',
            },
          ],
        },
      ],
      lensCueId: 'loops-shape',
    },
    {
      id: 'predict-loop',
      heading: 'Predict repetition',
      internalRole: 'predict',
      blocks: [
        {
          type: 'value-prediction',
          responseId: 'loops-prediction',
          prompt: 'Predict the iteration count and final total.',
          fields: [
            {
              id: 'iterations',
              label: 'iterations',
            },
            {
              id: 'total',
              label: 'total',
            },
          ],
        },
      ],
      lensCueId: 'loops-predict',
    },
    {
      id: 'follow-loop',
      heading: 'Follow each iteration',
      internalRole: 'guided-explore',
      blocks: [
        {
          type: 'observation',
          text: 'Follow each selected item and watch the accumulator preserve its previous value.',
        },
      ],
      lensCueId: 'loops-guided',
    },
    {
      id: 'change-list',
      heading: 'Change the list',
      internalRole: 'variation',
      blocks: [
        {
          type: 'variation-prediction',
          responseId: 'loops-list-prediction',
          prompt: 'Which configured result changes for [1, 3, 5]?',
          options: ['total'],
          variationId: 'sum-odd',
        },
      ],
      lensCueId: 'loops-explore',
    },
    {
      id: 'recognize-loop',
      heading: 'Recognize another loop',
      internalRole: 'recognize',
      blocks: [
        {
          type: 'recognition-check',
          responseId: 'loops-recognition',
          prompt: 'Classify the loop names.',
          source:
            'scores = [1, 2, 3]\npoints = 0\nfor score in scores:\n    points = points + score',
          roles: [
            {
              id: 'collection',
              label: 'collection',
            },
            {
              id: 'iterator',
              label: 'current item',
            },
            {
              id: 'accumulator',
              label: 'accumulator',
            },
          ],
          items: [
            {
              id: 'scores',
              label: 'scores',
            },
            {
              id: 'score',
              label: 'score',
            },
            {
              id: 'points',
              label: 'points',
            },
          ],
        },
      ],
      lensCueId: 'loops-recognize',
    },
    {
      id: 'build-loop',
      heading: 'Build a loop',
      internalRole: 'produce',
      blocks: [
        {
          type: 'build',
          responseId: 'loops-build-response',
          prompt: 'Build a loop that adds each number into total.',
          programId: 'loops-build-scaffold',
          criteria: [
            'Initialize total before the loop.',
            'Iterate with number.',
            'Update total using the current number.',
          ],
        },
      ],
      lensCueId: 'loops-build',
    },
    {
      id: 'post-transfer',
      heading: 'Try a new example',
      internalRole: 'produce',
      blocks: [
        {
          type: 'transfer-check',
          responseId: 'loops-over-lists-post-transfer',
          phase: 'post',
          prompt: 'How many times does this loop advance?',
          source:
            'scores = [2, 3, 4, 5]\npoints = 0\nfor score in scores:\n    points = points + score',
          options: [
            {
              id: '3',
              label: '3 times',
            },
            {
              id: '4',
              label: '4 times',
            },
          ],
        },
      ],
      lensCueId: 'loops-over-lists-post-transfer-cue',
    },
  ],
  lens: {
    initialProgramId: 'sum-even',
    initialView: 'flow',
  },
  programs: [
    {
      id: 'sum-even',
      source: 'numbers = [2, 4, 6]\ntotal = 0\nfor number in numbers:\n    total = total + number',
      argsText: '',
    },
    {
      id: 'sum-odd',
      source: 'numbers = [1, 3, 5]\ntotal = 0\nfor number in numbers:\n    total = total + number',
      argsText: '',
    },
    {
      id: 'recognize-scores',
      source: 'scores = [1, 2, 3]\npoints = 0\nfor score in scores:\n    points = points + score',
      argsText: '',
    },
    {
      id: 'loops-build-scaffold',
      source: 'numbers = [2, 4, 6]\ntotal = 0\nfor number in numbers:\n    total = total',
      argsText: '',
    },
  ],
  scenarios: [
    {
      id: 'loop-even',
      label: 'Even list',
      strategy: {
        type: 'replace-list-literal',
        selector: {
          role: 'first-collection-binding',
        },
        valueSource: '[2, 4, 6]',
      },
      expectedBindings: {},
      expectedRoleValues: {
        accumulator: '12',
      },
    },
    {
      id: 'loop-odd',
      label: 'Odd list',
      strategy: {
        type: 'replace-list-literal',
        selector: {
          role: 'first-collection-binding',
        },
        valueSource: '[1, 3, 5]',
      },
      expectedBindings: {},
      expectedRoleValues: {
        accumulator: '9',
      },
    },
  ],
  variations: [
    {
      id: 'sum-odd',
      label: 'List [1, 3, 5]',
      applyLabel: 'Run [1, 3, 5]',
      programId: 'sum-odd',
      predictionId: 'loops-list-prediction',
      verificationIds: ['loops-odd-value', 'loops-three-iterations'],
      comparison: {
        kind: 'bindings',
        baselineProgramId: 'sum-even',
        fields: [
          {
            key: 'total',
            label: 'total',
          },
        ],
      },
      successFeedback: 'The alternate list produces the configured total in three iterations.',
      retryFeedback: 'Compare the final accumulator and observed iteration count.',
    },
  ],
  cues: [
    {
      id: 'loops-over-lists-pre-transfer-cue',
      sectionId: 'pre-transfer',
      apply: 'initialize-once',
      presentation: 'quiet',
      mode: 'observe',
      programId: 'sum-even',
      editing: 'locked',
    },
    {
      id: 'loops-introduce',
      sectionId: 'loop-idea',
      apply: 'initialize-once',
      presentation: 'quiet',
      mode: 'observe',
      programId: 'sum-even',
      view: 'flow',
      frame: 'start',
      editing: 'locked',
      eyebrow: 'Learning Lens · waiting',
      title: 'Repeat work while preserving state',
      instruction: 'Start with the repetition idea.',
    },
    {
      id: 'loops-shape',
      sectionId: 'loop-shape',
      apply: 'guide-without-reset',
      presentation: 'visible',
      mode: 'observe',
      view: 'structure',
      frame: 'start',
      editing: 'locked',
      eyebrow: 'Observe',
      title: 'See the loop structure',
      instruction: 'Match collection, iterator, accumulator, and update.',
    },
    {
      id: 'loops-predict',
      sectionId: 'predict-loop',
      apply: 'guide-without-reset',
      presentation: 'quiet',
      mode: 'observe',
      view: 'state',
      frame: 'start',
      editing: 'locked',
      eyebrow: 'Predict first',
      title: 'Iterations and final state are concealed',
      instruction: 'Commit both predictions before execution.',
      revealPolicy: {
        responseId: 'loops-prediction',
        unlockAt: 'committed',
        concealedViews: ['state', 'explain', 'structure'],
        preCommitFrame: 'start',
      },
    },
    {
      id: 'loops-guided',
      sectionId: 'follow-loop',
      apply: 'guide-without-reset',
      presentation: 'focus',
      mode: 'guided',
      view: 'explain',
      frame: 'start',
      editing: 'locked',
      eyebrow: 'Guided',
      title: 'Follow repeated frames',
      instruction: 'Step through every selected item and update.',
      requiresResponseId: 'loops-prediction',
    },
    {
      id: 'loops-explore',
      sectionId: 'change-list',
      apply: 'guide-without-reset',
      presentation: 'visible',
      mode: 'explore',
      view: 'state',
      frame: 'end',
      editing: 'authored-variations',
      eyebrow: 'Explore',
      title: 'Change the list',
      instruction: 'Predict, then run the authored list variation.',
    },
    {
      id: 'loops-recognize',
      sectionId: 'recognize-loop',
      apply: 'replace-program',
      presentation: 'visible',
      mode: 'observe',
      programId: 'recognize-scores',
      view: 'structure',
      frame: 'start',
      editing: 'locked',
      eyebrow: 'Recognize',
      title: 'Same loop structure',
      instruction: 'Classify the names before viewing Lens.',
      revealPolicy: {
        responseId: 'loops-recognition',
        unlockAt: 'revealed',
        concealedViews: ['state', 'explain', 'structure'],
        preCommitFrame: 'start',
      },
    },
    {
      id: 'loops-build',
      sectionId: 'build-loop',
      apply: 'replace-program',
      presentation: 'focus',
      mode: 'build',
      programId: 'loops-build-scaffold',
      view: 'state',
      frame: 'start',
      editing: 'free',
      eyebrow: 'Build',
      title: 'Build an accumulator loop',
      instruction: 'Use the shared editor and semantic checks.',
    },
    {
      id: 'loops-over-lists-post-transfer-cue',
      sectionId: 'post-transfer',
      apply: 'guide-without-reset',
      presentation: 'quiet',
      mode: 'observe',
      editing: 'locked',
    },
  ],
  verifications: [
    {
      id: 'loops-odd-value',
      type: 'binding-values',
      expectedBindings: {
        total: '9',
      },
    },
    {
      id: 'loops-three-iterations',
      type: 'loop-iterations',
      expected: 3,
    },
    {
      id: 'loops-build-supported',
      type: 'supported-execution',
    },
    {
      id: 'loops-build-shape',
      type: 'loop-shape',
      iterator: 'number',
      accumulator: 'total',
    },
    {
      id: 'loops-build-dependency',
      type: 'accumulator-dependency',
      accumulator: 'total',
      iterator: 'number',
    },
    {
      id: 'loops-over-lists-build-role',
      type: 'loop-role',
      requireAccumulatorDependency: true,
    },
  ],
  assessments: [
    {
      id: 'loops-prediction-assessment',
      responseId: 'loops-prediction',
      type: 'prediction',
      expected: {
        iterations: 3,
        total: 12,
      },
      successFeedback: 'Your committed prediction matches the execution.',
      retryFeedback: 'Compare your committed prediction with the Lens evidence.',
    },
    {
      id: 'loops-list-prediction-assessment',
      responseId: 'loops-list-prediction',
      type: 'selection',
      expected: ['total'],
      successFeedback: 'Prediction committed.',
      retryFeedback: 'Prediction committed. Compare it with the resulting Lens evidence.',
    },
    {
      id: 'loops-recognition-assessment',
      responseId: 'loops-recognition',
      type: 'recognition',
      expectedRoles: {
        scores: 'collection',
        score: 'iterator',
        points: 'accumulator',
      },
      successFeedback:
        'Correct: the collection supplies items, the iterator holds the current item, and the accumulator preserves the running result.',
      retryFeedback:
        'Find the name after in, the name after for, and the value updated inside the loop.',
    },
    {
      id: 'loops-build-response-assessment',
      responseId: 'loops-build-response',
      type: 'build',
      namePolicy: 'role-based',
      verificationIds: ['loops-over-lists-build-role'],
      scenarioIds: ['loop-even', 'loop-odd'],
    },
    {
      id: 'loops-over-lists-pre-transfer-assessment',
      responseId: 'loops-over-lists-pre-transfer',
      type: 'transfer',
      phase: 'pre',
      expectedOptionId: '2',
      successFeedback: 'Response recorded.',
      retryFeedback: 'Response recorded.',
    },
    {
      id: 'loops-over-lists-post-transfer-assessment',
      responseId: 'loops-over-lists-post-transfer',
      type: 'transfer',
      phase: 'post',
      expectedOptionId: '4',
      successFeedback: 'Transfer response recorded.',
      retryFeedback: 'Transfer response recorded.',
    },
  ],
});
