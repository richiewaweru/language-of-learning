import { LessonDefinitionV4Schema } from '@lol/lens-contracts';

export const lesson = LessonDefinitionV4Schema.parse({
  schemaVersion: 4,
  id: 'values-and-variables',
  slug: 'values-and-variables',
  version: '4.0.0',
  courseId: 'python-foundations',
  title: 'Values and Variables',
  subtitle: 'Give values names, then build new values from them.',
  goal: 'Understand how assignment binds a name to a value and how later expressions reuse it.',
  sections: [
    {
      id: 'pre-transfer',
      heading: 'Before the lesson',
      internalRole: 'predict',
      blocks: [
        {
          type: 'transfer-check',
          responseId: 'values-and-variables-pre-transfer',
          phase: 'pre',
          prompt: 'Which name is calculated from the other two?',
          source: 'cups = 3\nprice = 4\ncost = cups * price',
          options: [
            {
              id: 'cups',
              label: 'cups',
            },
            {
              id: 'price',
              label: 'price',
            },
            {
              id: 'cost',
              label: 'cost',
            },
          ],
        },
      ],
      lensCueId: 'values-and-variables-pre-transfer-cue',
    },
    {
      id: 'names-for-values',
      heading: 'A name for a value',
      internalRole: 'introduce',
      blocks: [
        {
          type: 'prose',
          paragraphs: [
            'Programs remember information by giving values useful names.',
            'A good name lets later statements reuse a value without repeating it.',
          ],
        },
        {
          type: 'definition',
          text: 'A variable is a name that currently refers to a value.',
        },
        {
          type: 'callout',
          label: 'Notice',
          text: 'The equals sign assigns a value. It does not ask whether two things are equal.',
          tone: 'notice',
        },
      ],
      lensCueId: 'cue-introduce',
    },
    {
      id: 'assignment-shape',
      heading: 'Read an assignment',
      internalRole: 'structural-model',
      blocks: [
        {
          type: 'assignment-shape',
          title: 'Three complete assignments, one dependency chain',
          lines: [
            {
              source: 'price = 100',
              target: 'price',
              operator: '=',
              expression: '100',
              dependencies: [],
            },
            {
              source: 'tax = price * 0.16',
              target: 'tax',
              operator: '=',
              expression: 'price * 0.16',
              dependencies: ['price'],
            },
            {
              source: 'total = price + tax',
              target: 'total',
              operator: '=',
              expression: 'price + tax',
              dependencies: ['price', 'tax'],
            },
          ],
        },
      ],
      lensCueId: 'cue-assignment',
    },
    {
      id: 'predict-values',
      heading: 'What will Python store?',
      internalRole: 'predict',
      blocks: [
        {
          type: 'value-prediction',
          responseId: 'prediction-values',
          prompt: 'Before running the program, predict the values Python will store.',
          fields: [
            {
              id: 'tax',
              label: 'tax',
            },
            {
              id: 'total',
              label: 'total',
            },
          ],
        },
      ],
      lensCueId: 'cue-predict',
    },
    {
      id: 'follow-calculation',
      heading: 'Follow the calculation',
      internalRole: 'guided-explore',
      blocks: [
        {
          type: 'observation',
          text: 'Step through each binding and compare the final values with your committed prediction.',
        },
      ],
      lensCueId: 'cue-guided',
    },
    {
      id: 'change-value',
      heading: 'Change one value',
      internalRole: 'variation',
      blocks: [
        {
          type: 'variation-prediction',
          responseId: 'prediction-change',
          prompt: 'If the starting value changes to 200, which stored values will change?',
          options: ['price', 'tax', 'total'],
          variationId: 'price-200',
        },
      ],
      lensCueId: 'cue-explore',
    },
    {
      id: 'recognize-structure',
      heading: 'Recognize the same structure',
      internalRole: 'recognize',
      blocks: [
        {
          type: 'recognition-check',
          responseId: 'recognition-bindings',
          prompt: 'Classify each name by its role.',
          source: 'distance = 120\ntime = 2\nspeed = distance / time',
          roles: [
            {
              id: 'starting',
              label: 'starting name',
            },
            {
              id: 'derived',
              label: 'derived name',
            },
          ],
          items: [
            {
              id: 'distance',
              label: 'distance',
            },
            {
              id: 'time',
              label: 'time',
            },
            {
              id: 'speed',
              label: 'speed',
            },
          ],
        },
      ],
      lensCueId: 'cue-recognize',
    },
    {
      id: 'build-calculation',
      heading: 'Build a calculation',
      internalRole: 'produce',
      blocks: [
        {
          type: 'build',
          responseId: 'build-calculation',
          prompt: 'Create two starting values and one value calculated from both.',
          programId: 'build-scaffold',
          criteria: [
            'Use three assignments.',
            'Make the final assignment depend on both starting names.',
            'Use supported Python that runs successfully.',
          ],
        },
      ],
      lensCueId: 'cue-build',
    },
    {
      id: 'post-transfer',
      heading: 'Try a new example',
      internalRole: 'produce',
      blocks: [
        {
          type: 'transfer-check',
          responseId: 'values-and-variables-post-transfer',
          phase: 'post',
          prompt: 'Which name depends on both starting values?',
          source: 'length = 8\nwidth = 3\narea = length * width',
          options: [
            {
              id: 'length',
              label: 'length',
            },
            {
              id: 'width',
              label: 'width',
            },
            {
              id: 'area',
              label: 'area',
            },
          ],
        },
      ],
      lensCueId: 'values-and-variables-post-transfer-cue',
    },
  ],
  lens: {
    initialProgramId: 'price-tax-total',
    initialView: 'flow',
  },
  programs: [
    {
      id: 'price-tax-total',
      source: 'price = 100\ntax = price * 0.16\ntotal = price + tax',
      argsText: '',
    },
    {
      id: 'price-tax-total-200',
      source: 'price = 200\ntax = price * 0.16\ntotal = price + tax',
      argsText: '',
    },
    {
      id: 'distance-time-speed',
      source: 'distance = 120\ntime = 2\nspeed = distance / time',
      argsText: '',
    },
    {
      id: 'build-scaffold',
      source: 'first = 10\nsecond = 5\nresult = 0',
      argsText: '',
    },
  ],
  scenarios: [],
  variations: [
    {
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
          {
            key: 'price',
            label: 'price',
          },
          {
            key: 'tax',
            label: 'tax',
          },
          {
            key: 'total',
            label: 'total',
          },
        ],
      },
      successFeedback: 'All configured bindings changed as predicted.',
      retryFeedback: 'Compare each configured baseline and changed value.',
    },
  ],
  cues: [
    {
      id: 'values-and-variables-pre-transfer-cue',
      sectionId: 'pre-transfer',
      apply: 'initialize-once',
      presentation: 'quiet',
      mode: 'observe',
      programId: 'price-tax-total',
      editing: 'locked',
    },
    {
      id: 'cue-introduce',
      sectionId: 'names-for-values',
      apply: 'initialize-once',
      presentation: 'quiet',
      mode: 'observe',
      programId: 'price-tax-total',
      view: 'flow',
      frame: 'start',
      editing: 'locked',
      eyebrow: 'Learning Lens · waiting',
      title: 'The same workspace follows the whole lesson',
      instruction: 'Start with the idea. Lens is ready when execution becomes useful.',
    },
    {
      id: 'cue-assignment',
      sectionId: 'assignment-shape',
      apply: 'guide-without-reset',
      presentation: 'visible',
      mode: 'observe',
      view: 'structure',
      frame: 'start',
      editing: 'locked',
      eyebrow: 'Observe',
      title: 'See the assignment structure',
      instruction: 'Match each source line to its target, expression, and dependencies.',
    },
    {
      id: 'cue-predict',
      sectionId: 'predict-values',
      apply: 'guide-without-reset',
      presentation: 'quiet',
      mode: 'observe',
      view: 'state',
      frame: 'start',
      editing: 'locked',
      eyebrow: 'Predict first',
      title: 'Execution is concealed',
      instruction: 'Commit both predictions before Lens reveals stored values.',
      revealPolicy: {
        responseId: 'prediction-values',
        unlockAt: 'committed',
        concealedViews: ['state', 'explain', 'structure'],
        preCommitFrame: 'start',
      },
    },
    {
      id: 'cue-guided',
      sectionId: 'follow-calculation',
      apply: 'guide-without-reset',
      presentation: 'focus',
      mode: 'guided',
      view: 'explain',
      frame: 'start',
      editing: 'locked',
      eyebrow: 'Guided',
      title: 'Follow the dependency chain',
      instruction: 'Use the frame controls to follow each binding.',
      requiresResponseId: 'prediction-values',
    },
    {
      id: 'cue-explore',
      sectionId: 'change-value',
      apply: 'guide-without-reset',
      presentation: 'visible',
      mode: 'explore',
      view: 'state',
      frame: 'end',
      editing: 'authored-variations',
      eyebrow: 'Explore',
      title: 'Apply an authored variation',
      instruction: 'Commit which bindings change, then apply the variation.',
    },
    {
      id: 'cue-recognize',
      sectionId: 'recognize-structure',
      apply: 'replace-program',
      presentation: 'visible',
      mode: 'observe',
      programId: 'distance-time-speed',
      view: 'structure',
      frame: 'start',
      editing: 'locked',
      eyebrow: 'Recognize',
      title: 'Same structure, different names',
      instruction: 'Classify the roles before inspecting Lens.',
      revealPolicy: {
        responseId: 'recognition-bindings',
        unlockAt: 'revealed',
        concealedViews: ['state', 'explain', 'structure'],
        preCommitFrame: 'start',
      },
    },
    {
      id: 'cue-build',
      sectionId: 'build-calculation',
      apply: 'replace-program',
      presentation: 'focus',
      mode: 'build',
      programId: 'build-scaffold',
      view: 'state',
      frame: 'start',
      editing: 'free',
      eyebrow: 'Build',
      title: 'Use the real Lens editor',
      instruction: 'Edit, run, and check the declared semantic requirements.',
    },
    {
      id: 'values-and-variables-post-transfer-cue',
      sectionId: 'post-transfer',
      apply: 'guide-without-reset',
      presentation: 'quiet',
      mode: 'observe',
      editing: 'locked',
    },
  ],
  verifications: [
    {
      id: 'variation-values',
      type: 'binding-values',
      expectedBindings: {
        price: '200',
        tax: '32.0',
        total: '232.0',
      },
    },
    {
      id: 'build-supported',
      type: 'supported-execution',
    },
    {
      id: 'build-assignment-count',
      type: 'assignment-count',
      expected: 3,
    },
    {
      id: 'build-dependencies',
      type: 'assignment-dependencies',
      requiredDependencies: {
        result: ['first', 'second'],
      },
    },
    {
      id: 'values-and-variables-build-role',
      type: 'derived-assignment',
      startingBindings: {
        count: 2,
      },
      derivedBinding: {
        dependsOnAllStartingBindings: true,
      },
    },
  ],
  assessments: [
    {
      id: 'prediction-values-assessment',
      responseId: 'prediction-values',
      type: 'prediction',
      expected: {
        tax: 16,
        total: 116,
      },
      successFeedback: 'Your committed prediction matches the execution.',
      retryFeedback: 'Compare your committed prediction with the Lens evidence.',
    },
    {
      id: 'prediction-change-assessment',
      responseId: 'prediction-change',
      type: 'selection',
      expected: ['price', 'tax', 'total'],
      successFeedback: 'Prediction committed.',
      retryFeedback: 'Prediction committed. Compare it with the resulting Lens evidence.',
    },
    {
      id: 'recognition-bindings-assessment',
      responseId: 'recognition-bindings',
      type: 'recognition',
      expectedRoles: {
        distance: 'starting',
        time: 'starting',
        speed: 'derived',
      },
      successFeedback:
        'Correct: the first two names hold starting values and the third is derived from them.',
      retryFeedback: 'Check which lines use literal values and which line reads earlier names.',
    },
    {
      id: 'build-calculation-assessment',
      responseId: 'build-calculation',
      type: 'build',
      namePolicy: 'role-based',
      verificationIds: ['values-and-variables-build-role'],
      scenarioIds: [],
    },
    {
      id: 'values-and-variables-pre-transfer-assessment',
      responseId: 'values-and-variables-pre-transfer',
      type: 'transfer',
      phase: 'pre',
      expectedOptionId: 'cost',
      successFeedback: 'Response recorded.',
      retryFeedback: 'Response recorded.',
    },
    {
      id: 'values-and-variables-post-transfer-assessment',
      responseId: 'values-and-variables-post-transfer',
      type: 'transfer',
      phase: 'post',
      expectedOptionId: 'area',
      successFeedback: 'Transfer response recorded.',
      retryFeedback: 'Transfer response recorded.',
    },
  ],
});
