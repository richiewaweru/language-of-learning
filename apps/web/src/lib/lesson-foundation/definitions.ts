import {
  LessonDefinitionV1Schema,
  type LessonDefinitionV1,
} from '@lol/lens-contracts';

const valuesAndVariablesInput = {
  schemaVersion: 1,
  id: 'values-and-variables',
  slug: 'values-and-variables',
  version: '1.0.0',
  courseId: 'python-foundations',
  title: 'Values and Variables',
  subtitle: 'Give values names, then build new values from them.',
  goal: 'Understand how assignment binds a name to a value and how later expressions reuse it.',
  sections: [
    {
      id: 'names-for-values',
      heading: 'Give a value a name',
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
    },
    {
      id: 'assignment-shape',
      heading: 'Read the shape of assignment',
      internalRole: 'structural-model',
      blocks: [
        {
          type: 'code-shape',
          title: 'Three assignments, one dependency chain',
          rows: [
            {
              label: 'Name',
              code: 'price',
              explanation: 'The label we will use for the starting value.',
              tone: 'name',
            },
            {
              label: 'Input value',
              code: '100',
              explanation: 'The literal value assigned to price.',
              tone: 'input',
            },
            {
              label: 'Work',
              code: 'price * 0.16',
              explanation: 'An expression that reads price and computes tax.',
              tone: 'work',
            },
            {
              label: 'Output name',
              code: 'total',
              explanation: 'A new name for the final combined value.',
              tone: 'output',
            },
          ],
        },
        {
          type: 'code',
          language: 'python',
          source: 'price = 100\ntax = price * 0.16\ntotal = price + tax',
          caption: 'The complete Python program',
        },
      ],
      showLens: true,
    },
    {
      id: 'follow-the-values',
      heading: 'Follow each value as it changes',
      internalRole: 'observe',
      blocks: [
        {
          type: 'observation',
          text: 'Use Flow and State in Lens. Step forward and watch price appear before tax and total can be calculated.',
        },
        {
          type: 'prediction',
          id: 'price-change',
          prompt: 'If price changes to 200, which later names will receive different values?',
          options: [
            { id: 'tax-only', label: 'Only tax' },
            { id: 'tax-total', label: 'Tax and total' },
          ],
        },
      ],
      showLens: true,
    },
    {
      id: 'recognize-and-build',
      heading: 'Recognize the pattern and build your own',
      internalRole: 'produce',
      blocks: [
        {
          type: 'recognition',
          prompt: 'Find the names, starting values, and derived value in this program.',
          source: 'distance = 120\ntime = 2\nspeed = distance / time',
        },
        {
          type: 'production',
          prompt: 'Create two starting values and a third value calculated from them.',
          scaffold: 'first = \nsecond = \nresult = ',
        },
      ],
      showLens: true,
    },
  ],
  lens: {
    initialProgram: {
      id: 'price-tax-total',
      language: 'python',
      source: 'price = 100\ntax = price * 0.16\ntotal = price + tax',
      argsText: '',
    },
    initialView: 'flow',
    capabilities: {
      canEditSource: true,
      canPasteSource: true,
      canReplaceProgram: false,
      canRun: true,
      canReset: true,
      canUseFreeformInput: true,
      enabledViews: ['flow', 'state', 'explain', 'structure'],
    },
  },
} as const;

export const valuesAndVariablesLesson: LessonDefinitionV1 =
  LessonDefinitionV1Schema.parse(valuesAndVariablesInput);

export function loadLessonDefinition(slug: string): LessonDefinitionV1 | null {
  return slug === valuesAndVariablesLesson.slug ? valuesAndVariablesLesson : null;
}
