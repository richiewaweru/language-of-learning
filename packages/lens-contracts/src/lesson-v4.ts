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
  function unique(
    items: readonly { id: string }[],
    path: string,
    label: string,
  ): Set<string> {
    const ids = new Set<string>();
    items.forEach((item, index) => {
      if (ids.has(item.id)) {
        context.addIssue({
          code: 'custom',
          path: [path, index, 'id'],
          message: `Duplicate ${label} id: ${item.id}.`,
        });
      }
      ids.add(item.id);
    });
    return ids;
  }

  const sectionIds = unique(lesson.sections, 'sections', 'section');
  const programIds = unique(lesson.programs, 'programs', 'program');
  const scenarioIds = unique(lesson.scenarios, 'scenarios', 'scenario');
  const variationIds = unique(lesson.variations, 'variations', 'variation');
  const cueIds = unique(lesson.cues, 'cues', 'cue');
  const verificationIds = unique(lesson.verifications, 'verifications', 'verification');
  unique(lesson.assessments, 'assessments', 'assessment');

  if (!programIds.has(lesson.lens.initialProgramId)) {
    context.addIssue({
      code: 'custom',
      path: ['lens', 'initialProgramId'],
      message: 'Initial program does not exist.',
    });
  }
  const responseIds = new Set<string>();
  const responseBlocks = new Map<string, {
    type: LessonDefinitionBlockV4['type'];
    phase?: 'pre' | 'post';
  }>();
  lesson.sections.forEach((section, sectionIndex) => {
    const cue = lesson.cues.find((candidate) => candidate.id === section.lensCueId);
    if (!cueIds.has(section.lensCueId)) {
      context.addIssue({
        code: 'custom',
        path: ['sections', sectionIndex, 'lensCueId'],
        message: `Unknown Lens cue ${section.lensCueId}.`,
      });
    } else if (cue?.sectionId !== section.id) {
      context.addIssue({
        code: 'custom',
        path: ['sections', sectionIndex, 'lensCueId'],
        message: 'Lens cue belongs to a different section.',
      });
    }
    section.blocks.forEach((block, blockIndex) => {
      if ('responseId' in block) {
        if (responseIds.has(block.responseId)) {
          context.addIssue({
            code: 'custom',
            path: ['sections', sectionIndex, 'blocks', blockIndex, 'responseId'],
            message: `Duplicate response id: ${block.responseId}.`,
          });
        }
        responseIds.add(block.responseId);
        responseBlocks.set(block.responseId, {
          type: block.type,
          ...(block.type === 'transfer-check' ? { phase: block.phase } : {}),
        });
      }
      if (block.type === 'variation-prediction' && !variationIds.has(block.variationId)) {
        context.addIssue({
          code: 'custom',
          path: ['sections', sectionIndex, 'blocks', blockIndex, 'variationId'],
          message: `Unknown variation ${block.variationId}.`,
        });
      }
      if (block.type === 'build' && !programIds.has(block.programId)) {
        context.addIssue({
          code: 'custom',
          path: ['sections', sectionIndex, 'blocks', blockIndex, 'programId'],
          message: `Unknown Build program ${block.programId}.`,
        });
      }
    });
  });

  lesson.cues.forEach((cue, index) => {
    if (!sectionIds.has(cue.sectionId)) {
      context.addIssue({
        code: 'custom',
        path: ['cues', index, 'sectionId'],
        message: `Unknown section ${cue.sectionId}.`,
      });
    }
    if (cue.programId && !programIds.has(cue.programId)) {
      context.addIssue({
        code: 'custom',
        path: ['cues', index, 'programId'],
        message: `Unknown program ${cue.programId}.`,
      });
    }
    if (cue.variationId && !variationIds.has(cue.variationId)) {
      context.addIssue({
        code: 'custom',
        path: ['cues', index, 'variationId'],
        message: `Unknown variation ${cue.variationId}.`,
      });
    }
    if (cue.requiresResponseId && !responseIds.has(cue.requiresResponseId)) {
      context.addIssue({
        code: 'custom',
        path: ['cues', index, 'requiresResponseId'],
        message: `Unknown response ${cue.requiresResponseId}.`,
      });
    }
    if (cue.revealPolicy && !responseIds.has(cue.revealPolicy.responseId)) {
      context.addIssue({
        code: 'custom',
        path: ['cues', index, 'revealPolicy', 'responseId'],
        message: `Unknown reveal response ${cue.revealPolicy.responseId}.`,
      });
    }
    if (!lesson.sections.some((section) => section.lensCueId === cue.id)) {
      context.addIssue({
        code: 'custom',
        path: ['cues', index, 'id'],
        message: `Lens cue ${cue.id} is not used by a section.`,
      });
    }
  });

  lesson.variations.forEach((variation, index) => {
    if (!programIds.has(variation.programId)) {
      context.addIssue({
        code: 'custom',
        path: ['variations', index, 'programId'],
        message: `Unknown variation program ${variation.programId}.`,
      });
    }
    if (!programIds.has(variation.comparison.baselineProgramId)) {
      context.addIssue({
        code: 'custom',
        path: ['variations', index, 'comparison', 'baselineProgramId'],
        message: `Unknown baseline program ${variation.comparison.baselineProgramId}.`,
      });
    }
    variation.verificationIds.forEach((id) => {
      if (!verificationIds.has(id)) {
        context.addIssue({
          code: 'custom',
          path: ['variations', index, 'verificationIds'],
          message: `Unknown verification ${id}.`,
        });
      }
    });
    if (variation.predictionId && !responseIds.has(variation.predictionId)) {
      context.addIssue({
        code: 'custom',
        path: ['variations', index, 'predictionId'],
        message: `Unknown prediction response ${variation.predictionId}.`,
      });
    }
  });

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
    const block = responseBlocks.get(assessment.responseId);
    const expectedAssessmentType = block?.type === 'variation-prediction'
      ? 'selection'
      : block?.type === 'recognition-check'
        ? 'recognition'
        : block?.type === 'build'
          ? 'build'
          : block?.type === 'transfer-check'
            ? 'transfer'
            : block?.type === 'prediction' || block?.type === 'value-prediction'
              ? 'prediction'
              : null;
    if (expectedAssessmentType && assessment.type !== expectedAssessmentType) {
      context.addIssue({
        code: 'custom',
        path: ['assessments', index, 'type'],
        message: `Assessment type ${assessment.type} does not match ${block?.type} response ${assessment.responseId}.`,
      });
    }
    if (
      assessment.type === 'transfer'
      && block?.type === 'transfer-check'
      && assessment.phase !== block.phase
    ) {
      context.addIssue({
        code: 'custom',
        path: ['assessments', index, 'phase'],
        message: `Transfer phase does not match response ${assessment.responseId}.`,
      });
    }
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
  submissionId: z.string().min(1),
  attemptId: z.string().min(1),
  sourceHash: z.string().min(1),
  lensRevision: z.number().int().nonnegative(),
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
