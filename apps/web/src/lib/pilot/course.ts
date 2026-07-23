import type { LensExample, PilotCourse, PilotLesson } from './schema';

const example = (
  value: Omit<LensExample, 'executable'> & { executable?: boolean },
): LensExample => ({ executable: true, ...value });

export const examples: Record<string, LensExample> = Object.fromEntries(
  [
    example({
      id: 'values-watch',
      lessonId: 'values-and-variables',
      purpose: 'primary',
      title: 'Price, tax, and total',
      code: `price = 100
tax = price * 0.16
total = price + tax`,
      expectedNodeKinds: ['module', 'binding', 'operation', 'value'],
      expectedFinalBindings: { price: '100', tax: '16.0', total: '116.0' },
    }),
    example({
      id: 'values-price-200',
      lessonId: 'values-and-variables',
      purpose: 'exploration',
      title: 'Change the starting price',
      code: `price = 200
tax = price * 0.16
total = price + tax`,
      expectedFinalBindings: { price: '200', tax: '32.0', total: '232.0' },
    }),
    example({
      id: 'values-tax-rate',
      lessonId: 'values-and-variables',
      purpose: 'exploration',
      title: 'Name the tax rate',
      code: `price = 100
tax_rate = 0.16
tax = price * tax_rate
total = price + tax`,
      expectedFinalBindings: { price: '100', tax_rate: '0.16', tax: '16.0', total: '116.0' },
    }),
    example({
      id: 'values-total-dependency',
      lessonId: 'values-and-variables',
      purpose: 'exploration',
      title: 'Keep the total dependent on tax',
      code: `price = 150
tax = price * 0.16
total = price + tax`,
      expectedFinalBindings: { price: '150', tax: '24.0', total: '174.0' },
    }),
    example({
      id: 'values-speed',
      lessonId: 'values-and-variables',
      purpose: 'variation',
      title: 'Distance, time, speed',
      code: `distance = 120
time = 2
speed = distance / time`,
    }),
    example({
      id: 'values-area',
      lessonId: 'values-and-variables',
      purpose: 'variation',
      title: 'Width, height, area',
      code: `width = 8
height = 5
area = width * height`,
    }),
    example({
      id: 'values-recognition',
      lessonId: 'values-and-variables',
      purpose: 'recognition',
      title: 'Pay calculation',
      code: `hours = 8
rate = 15
pay = hours * rate`,
    }),
    example({
      id: 'values-production',
      lessonId: 'values-and-variables',
      purpose: 'production',
      title: 'Build a speed calculation',
      executable: false,
      code: `distance = ___
time = ___
speed = ___ / ___`,
    }),

    example({
      id: 'functions-watch',
      lessonId: 'functions-and-returns',
      purpose: 'primary',
      title: 'Calculate tax',
      code: `def calculate_tax(price, rate):
    tax = price * rate
    return tax

result = calculate_tax(100, 0.16)`,
      expectedNodeKinds: ['module', 'function', 'call', 'binding', 'operation', 'return'],
      expectedFinalBindings: { result: '16.0' },
    }),
    example({
      id: 'functions-arguments',
      lessonId: 'functions-and-returns',
      purpose: 'exploration',
      title: 'Change the arguments',
      code: `def calculate_tax(price, rate):
    tax = price * rate
    return tax

result = calculate_tax(250, 0.16)`,
      expectedFinalBindings: { result: '40.0' },
    }),
    example({
      id: 'functions-renamed',
      lessonId: 'functions-and-returns',
      purpose: 'exploration',
      title: 'Rename definition and call together',
      code: `def tax_for(price, rate):
    tax = price * rate
    return tax

result = tax_for(100, 0.16)`,
      expectedFinalBindings: { result: '16.0' },
    }),
    example({
      id: 'functions-no-return',
      lessonId: 'functions-and-returns',
      purpose: 'exploration',
      title: 'Remove return',
      code: `def calculate_tax(price, rate):
    tax = price * rate

result = calculate_tax(100, 0.16)`,
      expectedFinalBindings: { result: 'None' },
    }),
    example({
      id: 'functions-two-calls',
      lessonId: 'functions-and-returns',
      purpose: 'exploration',
      title: 'Call the function twice',
      code: `def calculate_tax(price, rate):
    tax = price * rate
    return tax

first_tax = calculate_tax(100, 0.16)
second_tax = calculate_tax(250, 0.16)`,
      expectedFinalBindings: { first_tax: '16.0', second_tax: '40.0' },
    }),
    example({
      id: 'functions-direct-return',
      lessonId: 'functions-and-returns',
      purpose: 'exploration',
      title: 'Remove the intermediate local',
      code: `def calculate_tax(price, rate):
    return price * rate

result = calculate_tax(100, 0.16)`,
      expectedFinalBindings: { result: '16.0' },
    }),
    example({
      id: 'functions-triple',
      lessonId: 'functions-and-returns',
      purpose: 'variation',
      title: 'Triple a number',
      code: `def triple(number):
    return number * 3`,
    }),
    example({
      id: 'functions-greet',
      lessonId: 'functions-and-returns',
      purpose: 'variation',
      title: 'Print a greeting',
      code: `def greet(name):
    print("Hello", name)`,
    }),
    example({
      id: 'functions-roll',
      lessonId: 'functions-and-returns',
      purpose: 'variation',
      title: 'Return a fixed value',
      code: `def roll():
    return 6`,
    }),
    example({
      id: 'functions-recognition',
      lessonId: 'functions-and-returns',
      purpose: 'recognition',
      title: 'Tip calculator',
      code: `def calculate_tip(bill, percentage):
    tip = bill * (percentage / 100)
    total = bill + tip
    return total`,
    }),
    example({
      id: 'functions-production',
      lessonId: 'functions-and-returns',
      purpose: 'production',
      title: 'Create triple(number)',
      executable: false,
      code: `def ___(___):
    result = ___
    return ___`,
    }),

    example({
      id: 'conditions-watch',
      lessonId: 'conditions-and-branches',
      purpose: 'primary',
      title: 'Classify temperature',
      code: `def classify_temperature(temp):
    if temp > 30:
        return "hot"
    else:
        return "cool"

result = classify_temperature(35)`,
      expectedNodeKinds: ['module', 'function', 'call', 'branch', 'operation', 'return'],
      expectedFinalBindings: { result: "'hot'" },
    }),
    ...[
      ['conditions-30', 'Boundary input: 30', '>', '30', "'cool'"],
      ['conditions-20', 'Cool input: 20', '>', '20', "'cool'"],
      ['conditions-gte-30', 'Include 30 in the hot branch', '>=', '30', "'hot'"],
    ].map(([id, title, operator, input, result]) =>
      example({
        id,
        lessonId: 'conditions-and-branches',
        purpose: 'exploration',
        title,
        code: `def classify_temperature(temp):
    if temp ${operator} 30:
        return "hot"
    else:
        return "cool"

result = classify_temperature(${input})`,
        expectedFinalBindings: { result },
      }),
    ),
    example({
      id: 'conditions-pass',
      lessonId: 'conditions-and-branches',
      purpose: 'variation',
      title: 'Pass or fail',
      code: `def result_for(score):
    if score >= 50:
        return "pass"
    else:
        return "fail"`,
    }),
    example({
      id: 'conditions-access',
      lessonId: 'conditions-and-branches',
      purpose: 'variation',
      title: 'Access by age',
      code: `def access_for(age):
    if age >= 18:
        return "allowed"
    else:
        return "restricted"`,
    }),
    example({
      id: 'conditions-recognition',
      lessonId: 'conditions-and-branches',
      purpose: 'recognition',
      title: 'Shipping cost',
      code: `def shipping_cost(total):
    if total >= 50:
        return 0
    else:
        return 5`,
    }),
    example({
      id: 'conditions-production',
      lessonId: 'conditions-and-branches',
      purpose: 'production',
      title: 'Check whether a number is even',
      executable: false,
      code: `def check_even(number):
    if ___:
        return "even"
    else:
        return "odd"`,
    }),

    example({
      id: 'loops-watch',
      lessonId: 'loops-over-lists',
      purpose: 'primary',
      title: 'Count passing scores',
      code: `def count_passing(scores):
    total = 0

    for score in scores:
        if score >= 50:
            total = total + 1

    return total

result = count_passing([72, 41, 65, 38])`,
      expectedNodeKinds: ['module', 'function', 'call', 'loop', 'branch', 'binding', 'return'],
      expectedFinalBindings: { result: '2' },
    }),
    example({
      id: 'loops-add-score',
      lessonId: 'loops-over-lists',
      purpose: 'exploration',
      title: 'Add another passing score',
      code: `def count_passing(scores):
    total = 0
    for score in scores:
        if score >= 50:
            total = total + 1
    return total

result = count_passing([72, 41, 65, 38, 91])`,
      expectedFinalBindings: { result: '3' },
    }),
    example({
      id: 'loops-strict-boundary',
      lessonId: 'loops-over-lists',
      purpose: 'exploration',
      title: 'Use a strict boundary',
      code: `def count_passing(scores):
    total = 0
    for score in scores:
        if score > 50:
            total = total + 1
    return total

result = count_passing([72, 50, 65, 38])`,
      expectedFinalBindings: { result: '2' },
    }),
    example({
      id: 'loops-initial-total',
      lessonId: 'loops-over-lists',
      purpose: 'exploration',
      title: 'Change the initial total',
      code: `def count_passing(scores):
    total = 10
    for score in scores:
        if score >= 50:
            total = total + 1
    return total

result = count_passing([72, 41, 65, 38])`,
      expectedFinalBindings: { result: '12' },
    }),
    example({
      id: 'loops-no-condition',
      lessonId: 'loops-over-lists',
      purpose: 'exploration',
      title: 'Count every item',
      code: `def count_scores(scores):
    total = 0
    for score in scores:
        total = total + 1
    return total

result = count_scores([72, 41, 65, 38])`,
      expectedFinalBindings: { result: '4' },
    }),
    example({
      id: 'loops-replace-list',
      lessonId: 'loops-over-lists',
      purpose: 'exploration',
      title: 'Replace the list',
      code: `def count_passing(scores):
    total = 0
    for score in scores:
        if score >= 50:
            total = total + 1
    return total

result = count_passing([50, 49, 100])`,
      expectedFinalBindings: { result: '2' },
    }),
    example({
      id: 'loops-recognition',
      lessonId: 'loops-over-lists',
      purpose: 'recognition',
      title: 'Sum positive numbers',
      code: `def sum_positive(numbers):
    total = 0
    for number in numbers:
        if number > 0:
            total = total + number
    return total`,
    }),
    example({
      id: 'loops-production',
      lessonId: 'loops-over-lists',
      purpose: 'production',
      title: 'Count even numbers',
      executable: false,
      code: `def count_even(numbers):
    total = 0
    for number in numbers:
        if ___:
            total = ___
    return ___`,
    }),
  ].map((entry) => [entry.id, entry]),
);

export const lessons: PilotLesson[] = [
  {
    id: 'values-and-variables',
    order: 1,
    title: 'Values and Variables',
    summary: 'Name, store, and transform values.',
    anchorSentence: 'A variable is a name connected to a value.',
    primaryExampleId: 'values-watch',
    steps: [
      {
        type: 'name-it',
        title: 'Name it',
        instruction: 'A variable is a name connected to a value.',
      },
      {
        type: 'show-shape',
        title: 'Show the shape',
        instruction: 'Follow a value as later statements derive new values.',
        shape: ['name', 'value', 'expression', 'derived value'],
      },
      {
        type: 'predict',
        title: 'Predict',
        instruction: 'Which statement binds price to 100?',
        options: [
          { id: 'a', label: 'price = 100' },
          { id: 'b', label: '100 = price' },
          { id: 'c', label: 'price(100)' },
        ],
        correctId: 'a',
      },
      {
        type: 'map-shape-to-syntax',
        title: 'Map shape to syntax',
        instruction: 'Connect each name, value, and expression to the same program Lens will run.',
        exampleId: 'values-watch',
      },
      {
        type: 'watch',
        title: 'Watch it run',
        instruction: 'Watch price bind first, then track both derived values.',
        exampleId: 'values-watch',
        trace: [
          'price → 100',
          'price × 0.16 → 16.0',
          'tax → 16.0',
          'price + tax → 116.0',
          'total → 116.0',
        ],
      },
      {
        type: 'directed-exploration',
        title: 'Directed exploration',
        instruction: 'Choose one supported authored change and compare the updated bindings.',
        exampleId: 'values-watch',
        mutationIds: ['values-price-200', 'values-tax-rate', 'values-total-dependency'],
      },
      {
        type: 'vary-surface',
        title: 'Vary the surface',
        instruction: 'The names change; the dependency shape remains.',
        exampleIds: ['values-speed', 'values-area'],
      },
      {
        type: 'recognize',
        title: 'Recognize in the wild',
        instruction: 'Find the inputs, expression, and derived result without annotations.',
        exampleId: 'values-recognition',
      },
      {
        type: 'produce',
        title: 'Produce',
        instruction: 'Complete the scaffold with two values and the names used by division.',
        exampleId: 'values-production',
      },
    ],
  },
  {
    id: 'functions-and-returns',
    order: 2,
    title: 'Functions and Return Values',
    summary: 'Move values through reusable named work.',
    anchorSentence:
      'A function is a named piece of work that can receive values and produce a result.',
    primaryExampleId: 'functions-watch',
    steps: [
      {
        type: 'name-it',
        title: 'Name it',
        instruction:
          'A function is a named piece of work that can receive values and produce a result.',
      },
      {
        type: 'show-shape',
        title: 'Show the shape',
        instruction: 'Separate the definition from the later call.',
        shape: ['function name', 'inputs', 'work', 'return', 'call', 'bound result'],
      },
      {
        type: 'predict',
        title: 'Predict',
        instruction: 'What value will bind to result?',
        options: [
          { id: 'a', label: '16.0' },
          { id: 'b', label: '100' },
          { id: 'c', label: 'No value' },
        ],
        correctId: 'a',
      },
      {
        type: 'map-shape-to-syntax',
        title: 'Map shape to syntax',
        instruction: 'Map the boundary, parameters, internal work, return, and call.',
        exampleId: 'functions-watch',
      },
      {
        type: 'watch',
        title: 'Watch it run',
        instruction: 'Observe the definition, then the separate call frame and returned value.',
        exampleId: 'functions-watch',
        trace: [
          'resolve calculate_tax',
          'bind price and rate',
          'compute tax',
          'return 16.0',
          'bind result',
        ],
      },
      {
        type: 'directed-exploration',
        title: 'Directed exploration',
        instruction: 'Change only supported authored parts of the function or call.',
        exampleId: 'functions-watch',
        mutationIds: [
          'functions-arguments',
          'functions-renamed',
          'functions-no-return',
          'functions-two-calls',
          'functions-direct-return',
        ],
      },
      {
        type: 'vary-surface',
        title: 'Vary the surface',
        instruction: 'Compare functions that return, print, or use no inputs.',
        exampleIds: ['functions-triple', 'functions-greet', 'functions-roll'],
      },
      {
        type: 'recognize',
        title: 'Recognize in the wild',
        instruction: 'Identify the name, inputs, internal bindings, and returned output.',
        exampleId: 'functions-recognition',
      },
      {
        type: 'produce',
        title: 'Produce',
        instruction: 'Create triple(number). Expected work: number * 3.',
        exampleId: 'functions-production',
      },
    ],
  },
  {
    id: 'conditions-and-branches',
    order: 3,
    title: 'Conditions and Branches',
    summary: 'Choose between alternative paths.',
    anchorSentence: 'A condition lets a program choose which path to follow.',
    primaryExampleId: 'conditions-watch',
    steps: [
      {
        type: 'name-it',
        title: 'Name it',
        instruction: 'A condition lets a program choose which path to follow.',
      },
      {
        type: 'show-shape',
        title: 'Show the shape',
        instruction: 'One Boolean question selects exactly one visible route.',
        shape: ['input', 'question', 'true path', 'false path', 'output'],
      },
      {
        type: 'predict',
        title: 'Predict',
        instruction: 'For temp = 35, which path runs?',
        options: [
          { id: 'a', label: 'return "hot"' },
          { id: 'b', label: 'return "cool"' },
        ],
        correctId: 'a',
      },
      {
        type: 'map-shape-to-syntax',
        title: 'Map shape to syntax',
        instruction: 'Map the comparison and both branches before execution.',
        exampleId: 'conditions-watch',
      },
      {
        type: 'watch',
        title: 'Watch it run',
        instruction: 'Follow the true route; keep the unused route visible as the alternative.',
        exampleId: 'conditions-watch',
        trace: ['temp → 35', '35 > 30 → true', 'select hot route', 'return hot', 'bind result'],
      },
      {
        type: 'directed-exploration',
        title: 'Directed exploration',
        instruction: 'Probe the boundary with 30 and 20, then change > to >=.',
        exampleId: 'conditions-watch',
        mutationIds: ['conditions-30', 'conditions-20', 'conditions-gte-30'],
      },
      {
        type: 'vary-surface',
        title: 'Vary the surface',
        instruction: 'The same branch shape answers different questions.',
        exampleIds: ['conditions-pass', 'conditions-access'],
      },
      {
        type: 'recognize',
        title: 'Recognize in the wild',
        instruction: 'Locate the question and both shipping-cost outcomes.',
        exampleId: 'conditions-recognition',
      },
      {
        type: 'produce',
        title: 'Produce',
        instruction: 'Complete the condition with number % 2 == 0.',
        exampleId: 'conditions-production',
      },
    ],
  },
  {
    id: 'loops-over-lists',
    order: 4,
    title: 'Loops over Lists',
    summary: 'Repeat work and combine prior structures.',
    anchorSentence: 'A loop repeats the same piece of work for each item in a collection.',
    primaryExampleId: 'loops-watch',
    steps: [
      {
        type: 'name-it',
        title: 'Name it',
        instruction: 'A loop repeats the same piece of work for each item in a collection.',
      },
      {
        type: 'show-shape',
        title: 'Show the shape',
        instruction: 'Track the collection, current item, question, and changing total.',
        shape: ['collection', 'current item', 'condition', 'state update', 'repeat', 'return'],
      },
      {
        type: 'predict',
        title: 'Predict',
        instruction: 'How many scores in [72, 41, 65, 38] pass?',
        options: [
          { id: 'a', label: '1' },
          { id: 'b', label: '2' },
          { id: 'c', label: '3' },
        ],
        correctId: 'b',
      },
      {
        type: 'map-shape-to-syntax',
        title: 'Map shape to syntax',
        instruction: 'Map the list parameter, iterator, branch, update, and return.',
        exampleId: 'loops-watch',
      },
      {
        type: 'watch',
        title: 'Watch it run',
        instruction: 'Watch total progress 0 → 1 → 1 → 2 → 2.',
        exampleId: 'loops-watch',
        trace: [
          '72 → true → total 1',
          '41 → false → total 1',
          '65 → true → total 2',
          '38 → false → total 2',
          'return 2',
        ],
      },
      {
        type: 'directed-exploration',
        title: 'Directed exploration',
        instruction:
          'Use the authored mutations to isolate list, boundary, and initial-state effects.',
        exampleId: 'loops-watch',
        mutationIds: [
          'loops-add-score',
          'loops-strict-boundary',
          'loops-initial-total',
          'loops-no-condition',
          'loops-replace-list',
        ],
      },
      {
        type: 'vary-surface',
        title: 'Vary the surface',
        instruction: 'Counting and summing share a loop-and-state structure.',
        exampleIds: ['loops-recognition'],
      },
      {
        type: 'recognize',
        title: 'Recognize in the wild',
        instruction: 'Find the collection, iterator, condition, and accumulator in raw code.',
        exampleId: 'loops-recognition',
      },
      {
        type: 'produce',
        title: 'Produce',
        instruction: 'Use number % 2 == 0, increment total, and return total.',
        exampleId: 'loops-production',
      },
    ],
  },
];

export const course: PilotCourse = {
  id: 'python-foundations',
  title: 'Python Foundations',
  summary: 'Learn Python by seeing the structures beneath syntax.',
  lessonIds: lessons.map((lesson) => lesson.id),
};

export const lessonsById = Object.fromEntries(lessons.map((lesson) => [lesson.id, lesson]));

export function executableExampleIdsForLesson(lessonId: string): string[] {
  const lesson = lessonsById[lessonId];
  if (!lesson) return [];
  return [lesson.primaryExampleId, ...lesson.steps.flatMap((step) => step.mutationIds ?? [])];
}
