import { LessonDefinitionV4Schema } from '@lol/lens-contracts';

export const lesson = LessonDefinitionV4Schema.parse({
  schemaVersion: 4,
  id: 'conditions-and-branches',
  slug: 'conditions-and-branches',
  version: '4.0.0',
  courseId: 'python-foundations',
  title: 'Conditions and Branches',
  subtitle: 'Ask a question and choose one path.',
  goal: 'Understand Boolean guards, selected paths, and if/else outcomes.',
  sections: [
    {
      id: 'pre-transfer',
      heading: 'Before the lesson',
      internalRole: 'predict',
      blocks: [
        {
          type: 'transfer-check',
          responseId: 'conditions-and-branches-pre-transfer',
          phase: 'pre',
          prompt: 'Which branch runs when score is 40?',
          source: 'score = 40\nif score >= 50:\n    result = "pass"\nelse:\n    result = "retry"',
          options: [
            {
              id: 'if-branch',
              label: 'if branch',
            },
            {
              id: 'else-branch',
              label: 'else branch',
            },
          ],
        },
      ],
      lensCueId: 'conditions-and-branches-pre-transfer-cue',
    },
    {
      id: 'decision-idea',
      heading: 'A program can decide',
      internalRole: 'introduce',
      blocks: [
        {
          type: 'prose',
          paragraphs: [
            'A condition asks a true-or-false question.',
            'Python executes only the branch selected by that answer.',
          ],
        },
        {
          type: 'definition',
          text: 'A branch is one possible path through a decision.',
        },
      ],
      lensCueId: 'conditions-introduce',
    },
    {
      id: 'condition-shape',
      heading: 'Read the decision shape',
      internalRole: 'structural-model',
      blocks: [
        {
          type: 'code-shape',
          title: 'Guard and two paths',
          rows: [
            {
              label: 'Guard',
              code: 'if age >= 18:',
              explanation: 'Asks a Boolean question.',
              tone: 'input',
            },
            {
              label: 'True path',
              code: 'status = "adult"',
              explanation: 'Runs when the guard is true.',
              tone: 'work',
            },
            {
              label: 'False path',
              code: 'else: status = "minor"',
              explanation: 'Runs when the guard is false.',
              tone: 'output',
            },
          ],
        },
      ],
      lensCueId: 'conditions-shape',
    },
    {
      id: 'predict-branch',
      heading: 'Predict the branch',
      internalRole: 'predict',
      blocks: [
        {
          type: 'prediction',
          responseId: 'conditions-branch-prediction',
          prompt: 'For age 16, which branch will run?',
          options: [
            {
              id: 'if-branch',
              label: 'if branch',
            },
            {
              id: 'else-branch',
              label: 'else branch',
            },
          ],
        },
      ],
      lensCueId: 'conditions-predict',
    },
    {
      id: 'follow-branch',
      heading: 'Follow the selected path',
      internalRole: 'guided-explore',
      blocks: [
        {
          type: 'observation',
          text: 'Watch the guard evaluate and confirm that only the selected branch changes State.',
        },
      ],
      lensCueId: 'conditions-guided',
    },
    {
      id: 'change-condition',
      heading: 'Change the condition input',
      internalRole: 'variation',
      blocks: [
        {
          type: 'variation-prediction',
          responseId: 'conditions-age-prediction',
          prompt: 'Which result changes when age becomes 21?',
          options: ['status'],
          variationId: 'age-twenty-one',
        },
      ],
      lensCueId: 'conditions-explore',
    },
    {
      id: 'recognize-decision',
      heading: 'Recognize another decision',
      internalRole: 'recognize',
      blocks: [
        {
          type: 'recognition-check',
          responseId: 'conditions-recognition',
          prompt: 'Classify the decision parts.',
          source: 'if score >= 50:\n    result = "pass"\nelse:\n    result = "retry"',
          roles: [
            {
              id: 'guard',
              label: 'Boolean guard',
            },
            {
              id: 'outcome',
              label: 'branch outcome',
            },
          ],
          items: [
            {
              id: 'score >= 50',
              label: 'score >= 50',
            },
            {
              id: 'result',
              label: 'result assignments',
            },
          ],
        },
      ],
      lensCueId: 'conditions-recognize',
    },
    {
      id: 'build-decision',
      heading: 'Build a decision',
      internalRole: 'produce',
      blocks: [
        {
          type: 'build',
          responseId: 'conditions-build-response',
          prompt: 'Build a supported if/else decision that assigns status on both paths.',
          programId: 'conditions-build-scaffold',
          criteria: [
            'Use a Boolean if/else guard.',
            'Assign status on both paths.',
            'Keep both deterministic scenarios supported.',
          ],
        },
      ],
      lensCueId: 'conditions-build',
    },
    {
      id: 'post-transfer',
      heading: 'Try a new example',
      internalRole: 'produce',
      blocks: [
        {
          type: 'transfer-check',
          responseId: 'conditions-and-branches-post-transfer',
          phase: 'post',
          prompt: 'Which branch runs when temperature is 12?',
          source:
            'temperature = 12\nif temperature > 20:\n    label = "warm"\nelse:\n    label = "cool"',
          options: [
            {
              id: 'if-branch',
              label: 'if branch',
            },
            {
              id: 'else-branch',
              label: 'else branch',
            },
          ],
        },
      ],
      lensCueId: 'conditions-and-branches-post-transfer-cue',
    },
  ],
  lens: {
    initialProgramId: 'age-sixteen',
    initialView: 'flow',
  },
  programs: [
    {
      id: 'age-sixteen',
      source: 'age = 16\nif age >= 18:\n    status = "adult"\nelse:\n    status = "minor"',
      argsText: '',
    },
    {
      id: 'age-twenty-one',
      source: 'age = 21\nif age >= 18:\n    status = "adult"\nelse:\n    status = "minor"',
      argsText: '',
    },
    {
      id: 'recognize-pass',
      source: 'score = 65\nif score >= 50:\n    result = "pass"\nelse:\n    result = "retry"',
      argsText: '',
    },
    {
      id: 'conditions-build-scaffold',
      source: 'age = 16\nif age >= 18:\n    status = ""\nelse:\n    status = ""',
      argsText: '',
    },
  ],
  scenarios: [
    {
      id: 'condition-false',
      label: 'False path',
      strategy: {
        type: 'replace-input-binding',
        selector: {
          role: 'first-starting-binding',
        },
        valueSource: '16',
      },
      expectedBindings: {},
      expectedRoleValues: {
        'branch-result': "'minor'",
      },
      expectedBranchOutcome: false,
    },
    {
      id: 'condition-true',
      label: 'True path',
      strategy: {
        type: 'replace-input-binding',
        selector: {
          role: 'first-starting-binding',
        },
        valueSource: '21',
      },
      expectedBindings: {},
      expectedRoleValues: {
        'branch-result': "'adult'",
      },
      expectedBranchOutcome: true,
    },
  ],
  variations: [
    {
      id: 'age-twenty-one',
      label: 'Age 21',
      applyLabel: 'Run age 21',
      programId: 'age-twenty-one',
      predictionId: 'conditions-age-prediction',
      verificationIds: ['conditions-adult-value'],
      comparison: {
        kind: 'path',
        baselineProgramId: 'age-sixteen',
        fields: [],
      },
      successFeedback: 'The alternate input selects the other branch.',
      retryFeedback: 'Compare the guard outcomes and resulting path.',
    },
  ],
  cues: [
    {
      id: 'conditions-and-branches-pre-transfer-cue',
      sectionId: 'pre-transfer',
      apply: 'initialize-once',
      presentation: 'quiet',
      mode: 'observe',
      programId: 'age-sixteen',
      editing: 'locked',
    },
    {
      id: 'conditions-introduce',
      sectionId: 'decision-idea',
      apply: 'initialize-once',
      presentation: 'quiet',
      mode: 'observe',
      programId: 'age-sixteen',
      view: 'flow',
      frame: 'start',
      editing: 'locked',
      eyebrow: 'Learning Lens · waiting',
      title: 'One question, one selected path',
      instruction: 'Start with the decision idea.',
    },
    {
      id: 'conditions-shape',
      sectionId: 'condition-shape',
      apply: 'guide-without-reset',
      presentation: 'visible',
      mode: 'observe',
      view: 'structure',
      frame: 'start',
      editing: 'locked',
      eyebrow: 'Observe',
      title: 'See the guard and branches',
      instruction: 'Match syntax to the decision structure.',
    },
    {
      id: 'conditions-predict',
      sectionId: 'predict-branch',
      apply: 'guide-without-reset',
      presentation: 'quiet',
      mode: 'observe',
      view: 'state',
      frame: 'start',
      editing: 'locked',
      eyebrow: 'Predict first',
      title: 'The selected path is concealed',
      instruction: 'Commit the branch prediction before execution.',
      revealPolicy: {
        responseId: 'conditions-branch-prediction',
        unlockAt: 'committed',
        concealedViews: ['state', 'explain', 'structure'],
        preCommitFrame: 'start',
      },
    },
    {
      id: 'conditions-guided',
      sectionId: 'follow-branch',
      apply: 'guide-without-reset',
      presentation: 'focus',
      mode: 'guided',
      view: 'explain',
      frame: 'start',
      editing: 'locked',
      eyebrow: 'Guided',
      title: 'Follow the selected path',
      instruction: 'Step through the guard and selected assignment.',
      requiresResponseId: 'conditions-branch-prediction',
    },
    {
      id: 'conditions-explore',
      sectionId: 'change-condition',
      apply: 'guide-without-reset',
      presentation: 'visible',
      mode: 'explore',
      view: 'state',
      frame: 'end',
      editing: 'authored-variations',
      eyebrow: 'Explore',
      title: 'Try the other scenario',
      instruction: 'Predict, then run the alternate age.',
    },
    {
      id: 'conditions-recognize',
      sectionId: 'recognize-decision',
      apply: 'replace-program',
      presentation: 'visible',
      mode: 'observe',
      programId: 'recognize-pass',
      view: 'structure',
      frame: 'start',
      editing: 'locked',
      eyebrow: 'Recognize',
      title: 'Same decision structure',
      instruction: 'Classify the decision parts before viewing Lens.',
      revealPolicy: {
        responseId: 'conditions-recognition',
        unlockAt: 'revealed',
        concealedViews: ['state', 'explain', 'structure'],
        preCommitFrame: 'start',
      },
    },
    {
      id: 'conditions-build',
      sectionId: 'build-decision',
      apply: 'replace-program',
      presentation: 'focus',
      mode: 'build',
      programId: 'conditions-build-scaffold',
      view: 'state',
      frame: 'start',
      editing: 'free',
      eyebrow: 'Build',
      title: 'Build a two-path decision',
      instruction: 'Use the shared editor and semantic checks.',
    },
    {
      id: 'conditions-and-branches-post-transfer-cue',
      sectionId: 'post-transfer',
      apply: 'guide-without-reset',
      presentation: 'quiet',
      mode: 'observe',
      editing: 'locked',
    },
  ],
  verifications: [
    {
      id: 'conditions-adult-value',
      type: 'binding-values',
      expectedBindings: {
        status: "'adult'",
      },
    },
    {
      id: 'conditions-build-supported',
      type: 'supported-execution',
    },
    {
      id: 'conditions-build-shape',
      type: 'branch-shape',
      requireElse: true,
      resultBinding: 'status',
    },
    {
      id: 'conditions-build-coverage',
      type: 'branch-coverage',
      expectedOutcomes: [false, true],
    },
    {
      id: 'conditions-and-branches-build-role',
      type: 'branch-role',
      requireElse: true,
      requireDistinctScenarioResults: true,
    },
  ],
  assessments: [
    {
      id: 'conditions-branch-prediction-assessment',
      responseId: 'conditions-branch-prediction',
      type: 'prediction',
      expected: {
        branch: 'else-branch',
      },
      successFeedback: 'Your committed prediction matches the execution.',
      retryFeedback: 'Compare your committed prediction with the Lens evidence.',
    },
    {
      id: 'conditions-age-prediction-assessment',
      responseId: 'conditions-age-prediction',
      type: 'selection',
      expected: ['status'],
      successFeedback: 'Prediction committed.',
      retryFeedback: 'Prediction committed. Compare it with the resulting Lens evidence.',
    },
    {
      id: 'conditions-recognition-assessment',
      responseId: 'conditions-recognition',
      type: 'recognition',
      expectedRoles: {
        'score >= 50': 'guard',
        result: 'outcome',
      },
      successFeedback:
        'Correct: the comparison is the guard and the assignments produce branch outcomes.',
      retryFeedback:
        'Find the true-or-false expression after if, then find what each branch assigns.',
    },
    {
      id: 'conditions-build-response-assessment',
      responseId: 'conditions-build-response',
      type: 'build',
      namePolicy: 'role-based',
      verificationIds: ['conditions-and-branches-build-role'],
      scenarioIds: ['condition-false', 'condition-true'],
    },
    {
      id: 'conditions-and-branches-pre-transfer-assessment',
      responseId: 'conditions-and-branches-pre-transfer',
      type: 'transfer',
      phase: 'pre',
      expectedOptionId: 'else-branch',
      successFeedback: 'Response recorded.',
      retryFeedback: 'Response recorded.',
    },
    {
      id: 'conditions-and-branches-post-transfer-assessment',
      responseId: 'conditions-and-branches-post-transfer',
      type: 'transfer',
      phase: 'post',
      expectedOptionId: 'else-branch',
      successFeedback: 'Transfer response recorded.',
      retryFeedback: 'Transfer response recorded.',
    },
  ],
});
