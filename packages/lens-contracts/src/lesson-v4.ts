import { z } from 'zod';
import {
  LessonComparisonSchema,
  LessonLensCueSchema,
  LessonPedagogicalRoleSchema,
  LessonProgramSchema,
  LessonVariationV3Schema,
  LessonVerificationSchema,
} from './lesson.js';
import type { LensArtifacts } from './workspace.js';

const responseId = z.string().min(1);

export const LessonDefinitionBlockV4Schema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('prose'), paragraphs: z.array(z.string().min(1)).min(1) }).strict(),
  z.object({ type: z.literal('definition'), text: z.string().min(1) }).strict(),
  z.object({
    type: z.literal('code'),
    language: z.literal('python'),
    source: z.string(),
    caption: z.string().optional(),
  }).strict(),
  z.object({
    type: z.literal('code-shape'),
    title: z.string().optional(),
    rows: z.array(z.object({
      label: z.string().min(1),
      code: z.string(),
      explanation: z.string().min(1),
      tone: z.enum(['name', 'input', 'work', 'output', 'value']).optional(),
    }).strict()).min(1),
  }).strict(),
  z.object({
    type: z.literal('assignment-shape'),
    title: z.string().optional(),
    lines: z.array(z.object({
      source: z.string().min(1),
      target: z.string().min(1),
      operator: z.literal('='),
      expression: z.string().min(1),
      dependencies: z.array(z.string()),
    }).strict()).min(1),
  }).strict(),
  z.object({
    type: z.literal('callout'),
    label: z.string().optional(),
    text: z.string().min(1),
    tone: z.enum(['notice', 'idea', 'warning']),
  }).strict(),
  z.object({
    type: z.literal('prediction'),
    responseId,
    prompt: z.string().min(1),
    options: z.array(z.object({ id: z.string().min(1), label: z.string().min(1) }).strict()).min(2),
  }).strict(),
  z.object({ type: z.literal('observation'), text: z.string().min(1) }).strict(),
  z.object({
    type: z.literal('value-prediction'),
    responseId,
    prompt: z.string().min(1),
    fields: z.array(z.object({
      id: z.string().min(1),
      label: z.string().min(1),
    }).strict()).min(1),
  }).strict(),
  z.object({
    type: z.literal('variation-prediction'),
    responseId,
    prompt: z.string().min(1),
    options: z.array(z.string().min(1)).min(1),
    variationId: z.string().min(1),
  }).strict(),
  z.object({
    type: z.literal('recognition-check'),
    responseId,
    prompt: z.string().min(1),
    source: z.string().min(1),
    roles: z.array(z.object({
      id: z.string().min(1),
      label: z.string().min(1),
    }).strict()).min(2),
    items: z.array(z.object({
      id: z.string().min(1),
      label: z.string().min(1),
    }).strict()).min(1),
  }).strict(),
  z.object({
    type: z.literal('build'),
    responseId,
    prompt: z.string().min(1),
    programId: z.string().min(1),
    criteria: z.array(z.string().min(1)).min(1),
  }).strict(),
  z.object({
    type: z.literal('transfer-check'),
    responseId,
    phase: z.enum(['pre', 'post']),
    prompt: z.string().min(1),
    source: z.string().min(1),
    options: z.array(z.object({ id: z.string().min(1), label: z.string().min(1) }).strict()).min(2),
  }).strict(),
]);

export const NamePolicySchema = z.enum(['exact', 'role-based', 'authored-scaffold']);

export const LessonRoleVerificationSchema = z.discriminatedUnion('type', [
  z.object({
    id: z.string().min(1),
    type: z.literal('derived-assignment'),
    startingBindings: z.object({ count: z.number().int().positive() }).strict(),
    derivedBinding: z.object({ dependsOnAllStartingBindings: z.literal(true) }).strict(),
  }).strict(),
  z.object({
    id: z.string().min(1),
    type: z.literal('return-dependency-role'),
    functionSelector: z.literal('first'),
    requiredParameterIndexes: z.array(z.number().int().nonnegative()).min(1),
    requireModuleCall: z.boolean().default(true),
  }).strict(),
  z.object({
    id: z.string().min(1),
    type: z.literal('branch-role'),
    requireElse: z.boolean().default(true),
    requireDistinctScenarioResults: z.boolean().default(true),
  }).strict(),
  z.object({
    id: z.string().min(1),
    type: z.literal('loop-role'),
    requireAccumulatorDependency: z.literal(true),
  }).strict(),
]);

export const LessonVerificationV4Schema = z.union([
  LessonVerificationSchema,
  LessonRoleVerificationSchema,
]);

export const LessonScenarioStrategySchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('replace-input-binding'),
    selector: z.object({ role: z.literal('first-starting-binding') }).strict(),
    valueSource: z.string().min(1),
  }).strict(),
  z.object({
    type: z.literal('supply-function-arguments'),
    functionSelector: z.literal('first'),
    argumentsSource: z.array(z.string().min(1)).min(1),
  }).strict(),
  z.object({
    type: z.literal('replace-list-literal'),
    selector: z.object({ role: z.literal('first-collection-binding') }).strict(),
    valueSource: z.string().min(1),
  }).strict(),
]);

export const LessonAssessmentSchema = z.discriminatedUnion('type', [
  z.object({
    id: z.string().min(1),
    responseId,
    type: z.literal('prediction'),
    expected: z.record(z.string(), z.union([z.string(), z.number()])),
    successFeedback: z.string().min(1),
    retryFeedback: z.string().min(1),
  }).strict(),
  z.object({
    id: z.string().min(1),
    responseId,
    type: z.literal('selection'),
    expected: z.array(z.string().min(1)).min(1),
    successFeedback: z.string().min(1),
    retryFeedback: z.string().min(1),
  }).strict(),
  z.object({
    id: z.string().min(1),
    responseId,
    type: z.literal('recognition'),
    expectedRoles: z.record(z.string(), z.string().min(1)),
    successFeedback: z.string().min(1),
    retryFeedback: z.string().min(1),
  }).strict(),
  z.object({
    id: z.string().min(1),
    responseId,
    type: z.literal('build'),
    namePolicy: NamePolicySchema,
    verificationIds: z.array(z.string().min(1)).min(1),
    scenarioIds: z.array(z.string().min(1)).default([]),
  }).strict(),
  z.object({
    id: z.string().min(1),
    responseId,
    type: z.literal('transfer'),
    phase: z.enum(['pre', 'post']),
    expectedOptionId: z.string().min(1),
    successFeedback: z.string().min(1),
    retryFeedback: z.string().min(1),
  }).strict(),
]);

export const LessonScenarioV4Schema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  strategy: LessonScenarioStrategySchema,
  expectedBindings: z.record(z.string(), z.string()).default({}),
  expectedRoleValues: z.record(
    z.enum(['derived-binding', 'module-result', 'branch-result', 'accumulator']),
    z.string(),
  ).default({}),
  expectedBranchOutcome: z.boolean().optional(),
}).strict();

export const LessonDefinitionV4Schema = z.object({
  schemaVersion: z.literal(4),
  id: z.string().min(1),
  slug: z.string().min(1),
  version: z.string().min(1),
  courseId: z.string().min(1),
  title: z.string().min(1),
  subtitle: z.string().optional(),
  goal: z.string().min(1),
  sections: z.array(z.object({
    id: z.string().min(1),
    heading: z.string().min(1),
    internalRole: LessonPedagogicalRoleSchema,
    blocks: z.array(LessonDefinitionBlockV4Schema),
    lensCueId: z.string().min(1),
  }).strict()).min(1),
  lens: z.object({
    initialProgramId: z.string().min(1),
    initialView: z.enum(['flow', 'state', 'explain', 'structure']),
  }).strict(),
  programs: z.array(LessonProgramSchema).min(1),
  scenarios: z.array(LessonScenarioV4Schema).default([]),
  variations: z.array(LessonVariationV3Schema).default([]),
  cues: z.array(LessonLensCueSchema).min(1),
  verifications: z.array(LessonVerificationV4Schema).default([]),
  assessments: z.array(LessonAssessmentSchema).min(1),
}).strict().superRefine((lesson, context) => {
  const programIds = new Set(lesson.programs.map((program) => program.id));
  const scenarioIds = new Set(lesson.scenarios.map((scenario) => scenario.id));
  const verificationIds = new Set(lesson.verifications.map((verification) => verification.id));
  if (!programIds.has(lesson.lens.initialProgramId)) {
    context.addIssue({
      code: 'custom',
      path: ['lens', 'initialProgramId'],
      message: 'Initial program does not exist.',
    });
  }
  const responseIds = new Set(
    lesson.sections.flatMap((section) =>
      section.blocks.flatMap((block) => 'responseId' in block ? [block.responseId] : [])),
  );
  const assessmentResponses = new Set<string>();
  lesson.assessments.forEach((assessment, index) => {
    if (!responseIds.has(assessment.responseId)) {
      context.addIssue({
        code: 'custom',
        path: ['assessments', index, 'responseId'],
        message: `Assessment references unknown response ${assessment.responseId}.`,
      });
    }
    if (assessmentResponses.has(assessment.responseId)) {
      context.addIssue({
        code: 'custom',
        path: ['assessments', index, 'responseId'],
        message: `Duplicate assessment response ${assessment.responseId}.`,
      });
    }
    assessmentResponses.add(assessment.responseId);
    if (assessment.type === 'build') {
      for (const id of assessment.verificationIds) {
        if (!verificationIds.has(id)) {
          context.addIssue({
            code: 'custom',
            path: ['assessments', index, 'verificationIds'],
            message: `Unknown verification ${id}.`,
          });
        }
      }
      for (const id of assessment.scenarioIds) {
        if (!scenarioIds.has(id)) {
          context.addIssue({
            code: 'custom',
            path: ['assessments', index, 'scenarioIds'],
            message: `Unknown scenario ${id}.`,
          });
        }
      }
    }
  });
  for (const response of responseIds) {
    if (!assessmentResponses.has(response)) {
      context.addIssue({
        code: 'custom',
        path: ['assessments'],
        message: `Response ${response} has no assessment record.`,
      });
    }
  }
  lesson.sections.forEach((section, sectionIndex) => {
    section.blocks.forEach((block, blockIndex) => {
      if (block.type === 'build' && !programIds.has(block.programId)) {
        context.addIssue({
          code: 'custom',
          path: ['sections', sectionIndex, 'blocks', blockIndex, 'programId'],
          message: `Unknown Build program ${block.programId}.`,
        });
      }
    });
  });
});

export const LessonVerificationResultSchema = z.object({
  id: z.string(),
  correct: z.boolean(),
  feedback: z.string(),
  evidence: z.record(z.string(), z.unknown()),
}).strict();

export const ScenarioResultSchema = z.object({
  scenarioId: z.string().min(1),
  sourceHash: z.string().min(1),
  artifacts: z.custom<LensArtifacts>((value) =>
    Boolean(value && typeof value === 'object' && 'graph' in value && 'trace' in value),
  ).nullable(),
  error: z.string().optional(),
}).strict();

export const SubmissionEvidenceSchema = z.object({
  sourceHash: z.string().min(1),
  runRevision: z.number().int().nonnegative(),
  artifacts: z.custom<LensArtifacts>((value) =>
    Boolean(value && typeof value === 'object' && 'graph' in value && 'trace' in value),
  ).nullable(),
  scenarioResults: z.array(ScenarioResultSchema),
  verificationResults: z.array(LessonVerificationResultSchema),
}).strict();

export type LessonDefinitionBlockV4 = z.infer<typeof LessonDefinitionBlockV4Schema>;
export type LessonDefinitionV4 = z.infer<typeof LessonDefinitionV4Schema>;
export type LessonAssessment = z.infer<typeof LessonAssessmentSchema>;
export type LessonScenarioV4 = z.infer<typeof LessonScenarioV4Schema>;
export type ScenarioResult = z.infer<typeof ScenarioResultSchema>;
export type SubmissionEvidence = z.infer<typeof SubmissionEvidenceSchema>;
export type NamePolicy = z.infer<typeof NamePolicySchema>;
export type LessonVerificationV4 = z.infer<typeof LessonVerificationV4Schema>;

// Re-exported to keep comparison consumers on one public V4 module.
export { LessonComparisonSchema };
