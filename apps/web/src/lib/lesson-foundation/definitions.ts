import {
  LessonDefinitionV2Schema,
  type LessonDefinitionV2,
} from '@lol/lens-contracts';

const canonicalSource = 'price = 100\ntax = price * 0.16\ntotal = price + tax';

const valuesAndVariablesInput = {
  schemaVersion: 2,
  id: 'values-and-variables',
  slug: 'values-and-variables',
  version: '2.0.0',
  courseId: 'python-foundations',
  title: 'Values and Variables',
  subtitle: 'Give values names, then build new values from them.',
  goal: 'Understand how assignment binds a name to a value and how later expressions reuse it.',
  sections: [
    {
      id: 'names-for-values',
      heading: 'A name for a value',
      internalRole: 'introduce',
      lensCueId: 'cue-introduce',
      blocks: [
        {
          type: 'prose',
          paragraphs: [
            'Programs remember information by giving values useful names.',
            'A good name lets later statements reuse a value without repeating it.',
          ],
        },
        { type: 'definition', text: 'A variable is a name that currently refers to a value.' },
        {
          type: 'callout',
          label: 'Notice',
          text: 'The equals sign assigns a value. It does not ask whether two things are equal.',
          tone: 'notice',
        },
      ],
    },
    {
      id: 'assignment-shape',
      heading: 'Read an assignment',
      internalRole: 'structural-model',
      lensCueId: 'cue-assignment',
      blocks: [
        {
          type: 'assignment-shape',
          title: 'Three complete assignments, one dependency chain',
          lines: [
            { source: 'price = 100', target: 'price', operator: '=', expression: '100', dependencies: [] },
            { source: 'tax = price * 0.16', target: 'tax', operator: '=', expression: 'price * 0.16', dependencies: ['price'] },
            { source: 'total = price + tax', target: 'total', operator: '=', expression: 'price + tax', dependencies: ['price', 'tax'] },
          ],
        },
      ],
    },
    {
      id: 'predict-values',
      heading: 'What will Python store?',
      internalRole: 'predict',
      lensCueId: 'cue-predict',
      blocks: [
        {
          type: 'value-prediction',
          responseId: 'prediction-values',
          prompt: 'Before running the program, predict the values Python will store.',
          fields: [
            { id: 'tax', label: 'tax', expected: 16 },
            { id: 'total', label: 'total', expected: 116 },
          ],
        },
      ],
    },
    {
      id: 'follow-calculation',
      heading: 'Follow the calculation',
      internalRole: 'guided-explore',
      lensCueId: 'cue-guided',
      blocks: [
        {
          type: 'observation',
          text: 'Step through price, tax, and total. Lens compares the final values with the prediction you committed.',
        },
      ],
    },
    {
      id: 'change-value',
      heading: 'Change one value',
      internalRole: 'variation',
      lensCueId: 'cue-explore',
      blocks: [
        {
          type: 'variation-prediction',
          responseId: 'prediction-change',
          prompt: 'If price changes to 200, which stored values will change?',
          options: ['price', 'tax', 'total'],
          expected: ['price', 'tax', 'total'],
          variationId: 'price-200',
        },
      ],
    },
    {
      id: 'recognize-structure',
      heading: 'Recognize the same structure',
      internalRole: 'recognize',
      lensCueId: 'cue-recognize',
      blocks: [
        {
          type: 'recognition-check',
          responseId: 'recognition-bindings',
          prompt: 'Classify each name as a starting name or a derived name.',
          source: 'distance = 120\ntime = 2\nspeed = distance / time',
          names: ['distance', 'time', 'speed'],
          startingNames: ['distance', 'time'],
          derivedNames: ['speed'],
        },
      ],
    },
    {
      id: 'build-calculation',
      heading: 'Build a calculation',
      internalRole: 'produce',
      lensCueId: 'cue-build',
      blocks: [
        {
          type: 'build',
          responseId: 'build-calculation',
          prompt: 'Complete the scaffold in Lens: create two starting values and one value calculated from both.',
          programId: 'build-scaffold',
          verificationIds: ['build-shape', 'build-dependencies'],
        },
      ],
    },
  ],
  programs: [
    { id: 'price-tax-total', source: canonicalSource, argsText: '' },
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
      source: 'first = 10\nsecond = 5\nresult = first + second',
      argsText: '',
    },
  ],
  variations: [
    {
      id: 'price-200',
      label: 'Set price to 200',
      programId: 'price-tax-total-200',
      predictionId: 'prediction-change',
    },
  ],
  cues: [
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
      title: 'The same workspace will follow the whole lesson',
      instruction: 'Start with the idea. Lens is ready when seeing execution becomes useful.',
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
      title: 'See the complete assignment structure',
      instruction: 'Match each full source line to its target, expression, and dependencies.',
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
      instruction: 'Commit both predictions before Lens reveals the stored values.',
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
      requiresResponseId: 'prediction-values',
      eyebrow: 'Guided',
      title: 'Follow price → tax → total',
      instruction: 'Use the frame controls to follow each binding without resetting the source.',
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
      title: 'Change one authored value',
      instruction: 'Commit which bindings will change, then apply the authored price = 200 variation.',
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
      instruction: 'Check the starting and derived names, then inspect the structure in Lens.',
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
      instruction: 'Edit and run the shared program, then check its assignment structure.',
    },
  ],
  verifications: [
    {
      id: 'build-shape',
      type: 'program-shape',
      requiredAssignments: 3,
      derivedTargets: ['result'],
    },
    {
      id: 'build-dependencies',
      type: 'assignment-dependencies',
      requiredDependencies: { result: ['first', 'second'] },
    },
  ],
} as const;

export const valuesAndVariablesLesson: LessonDefinitionV2 =
  LessonDefinitionV2Schema.parse(valuesAndVariablesInput);

export function loadLessonDefinition(slug: string): LessonDefinitionV2 | null {
  return slug === valuesAndVariablesLesson.slug ? valuesAndVariablesLesson : null;
}
