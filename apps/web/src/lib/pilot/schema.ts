export const PILOT_STEP_TYPES = [
  'name-it',
  'show-shape',
  'predict',
  'map-shape-to-syntax',
  'watch',
  'directed-exploration',
  'vary-surface',
  'recognize',
  'produce',
] as const;

export type PilotStepType = (typeof PILOT_STEP_TYPES)[number];
export type ExamplePurpose =
  'primary' | 'prediction' | 'watch' | 'exploration' | 'variation' | 'recognition' | 'production';

export type LensExample = {
  id: string;
  lessonId: string;
  purpose: ExamplePurpose;
  title: string;
  code: string;
  executable: boolean;
  expectedNodeKinds?: string[];
  expectedFinalBindings?: Record<string, string>;
};

export type PilotStep = {
  type: PilotStepType;
  title: string;
  instruction: string;
  exampleId?: string;
  options?: Array<{ id: string; label: string }>;
  correctId?: string;
  shape?: string[];
  trace?: string[];
  mutationIds?: string[];
  exampleIds?: string[];
};

export type PilotLesson = {
  id: string;
  order: number;
  title: string;
  summary: string;
  anchorSentence: string;
  primaryExampleId: string;
  steps: PilotStep[];
};

export type PilotCourse = {
  id: 'python-foundations';
  title: string;
  summary: string;
  lessonIds: string[];
};
