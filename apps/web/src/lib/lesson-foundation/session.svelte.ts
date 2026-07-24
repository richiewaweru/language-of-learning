import type {
  LensSessionController,
  LessonAssessment,
  LessonDefinitionV4,
  LessonResponse,
  PilotExport,
  StudyContext,
  SubmissionEvidence,
} from '@lol/lens-contracts';
import { LessonResponseSchema, z } from '@lol/lens-contracts';
import { createLensEngine } from '$lib/lens/engine';
import { createLensSession } from '$lib/lens/session.svelte';
import {
  createBrowserLensPersistence,
  lensSessionStorageKey,
} from '$lib/lens/storage';
import {
  createLessonLensOrchestrator,
  type LessonLensOrchestrator,
} from './orchestrator.svelte';
import {
  analyzeLessonProgram,
  projectLessonComparison,
} from './services';
import {
  runLessonVerifications,
  type LessonVerificationResult,
} from './verification';
import {
  createLearningEventStore,
  type AssessmentEventContext,
  type LearningEventStore,
} from './pilot-events';
import {
  hashSource,
  runScenariosAgainstSource,
} from './scenarios';

const LOCAL_OWNER = 'local';

const LessonAttemptSnapshotSchema = z.object({
  schemaVersion: z.literal(4),
  lessonId: z.string(),
  lessonVersion: z.string(),
  attemptId: z.string(),
  activeSectionId: z.string(),
  completedSectionIds: z.array(z.string()),
  responses: z.record(z.string(), LessonResponseSchema),
  selectedVariationId: z.string().nullable(),
  selectedScenarioId: z.string().nullable(),
  appliedCueIds: z.array(z.string()),
  updatedAt: z.string().datetime(),
}).strict();

export type LessonComparisonState = {
  kind: 'bindings' | 'frames' | 'path' | 'return-value';
  rows: Array<{ label: string; baseline: string; current: string }>;
  evidence: LessonVerificationResult[];
} | null;

export type LessonAttemptState = {
  attemptId: string;
  activeSectionId: string;
  completedSectionIds: string[];
  responses: Record<string, LessonResponse>;
  selectedVariationId: string | null;
  selectedScenarioId: string | null;
  appliedCueIds: string[];
  comparison: LessonComparisonState;
  initialized: boolean;
  persistenceWarning: string | null;
  interactionMessage: string | null;
  submissionEvidence: SubmissionEvidence | null;
};

export type LessonSessionController = {
  readonly definition: LessonDefinitionV4;
  readonly state: LessonAttemptState;
  readonly lens: LensSessionController;
  readonly orchestrator: LessonLensOrchestrator;
  readonly pilot: {
    readonly participantCode: string | null;
    readonly isRecording: boolean;
    status: LearningEventStore['status'];
    summaries: LearningEventStore['summaries'];
    exportData(): Promise<PilotExport>;
    deleteData(): void;
  };
  readonly actions: {
    setActiveSection(sectionId: string): Promise<void>;
    setResponseDraft(id: string, answer: string): void;
    commitResponse(id: string, correct?: boolean, feedback?: string): void;
    revealResponse(id: string, correct?: boolean, feedback?: string): void;
    retryResponse(id: string): void;
    applyVariation(responseId: string, variationId: string): Promise<boolean>;
    checkBuild(responseId: string): Promise<boolean>;
    restart(): Promise<LessonSessionController>;
  };
};

function pointerKey(definition: LessonDefinitionV4) {
  return `lesson:v4:${LOCAL_OWNER}:${definition.id}:${definition.version}:active`;
}

function attemptKey(definition: LessonDefinitionV4, attemptId: string) {
  return `lesson:v4:${LOCAL_OWNER}:${definition.id}:${definition.version}:${attemptId}`;
}

function newAttemptId() {
  return crypto.randomUUID();
}

function responseSection(definition: LessonDefinitionV4, responseId: string) {
  return definition.sections.find((section) =>
    section.blocks.some((block) => 'responseId' in block && block.responseId === responseId),
  );
}

export async function createLessonSessionController(
  definition: LessonDefinitionV4,
  storage: Storage,
  forceNew = false,
  study: StudyContext | null = null,
): Promise<LessonSessionController> {
  let warning: string | null = null;
  let attemptId = forceNew ? newAttemptId() : storage.getItem(pointerKey(definition));
  let restored: z.infer<typeof LessonAttemptSnapshotSchema> | null = null;

  if (attemptId) {
    try {
      const raw = storage.getItem(attemptKey(definition, attemptId));
      const parsed = raw ? LessonAttemptSnapshotSchema.safeParse(JSON.parse(raw)) : null;
      if (
        parsed?.success
        && parsed.data.lessonId === definition.id
        && parsed.data.lessonVersion === definition.version
        && parsed.data.attemptId === attemptId
        && definition.sections.some((section) => section.id === parsed.data.activeSectionId)
      ) {
        restored = parsed.data;
      } else if (raw) {
        warning = 'Saved lesson progress was incompatible and has been replaced.';
        attemptId = null;
      }
    } catch {
      warning = 'Saved lesson progress could not be read and has been replaced.';
      attemptId = null;
    }
  }

  attemptId ??= newAttemptId();
  storage.setItem(pointerKey(definition), attemptId);

  const state = $state<LessonAttemptState>({
    attemptId,
    activeSectionId: restored?.activeSectionId ?? definition.sections[0].id,
    completedSectionIds: restored?.completedSectionIds.filter((id) =>
      definition.sections.some((section) => section.id === id)) ?? [],
    responses: restored?.responses ?? {},
    selectedVariationId: restored?.selectedVariationId ?? null,
    selectedScenarioId: restored?.selectedScenarioId ?? null,
    appliedCueIds: restored?.appliedCueIds ?? [],
    comparison: null,
    initialized: false,
    persistenceWarning: warning,
    interactionMessage: null,
    submissionEvidence: null,
  });

  const persistence = createBrowserLensPersistence(storage);
  const engine = createLensEngine();
  const eventStore = createLearningEventStore(storage, {
    attemptId,
    lessonId: definition.id,
    lessonVersion: definition.version,
  }, study);
  const initialProgram = definition.programs.find(
    (program) => program.id === definition.lens.initialProgramId,
  );
  if (!initialProgram) throw new Error(`Missing initial program ${definition.lens.initialProgramId}.`);

  const lensSession = createLensSession({
    id: `${attemptId}:primary`,
    kind: 'lesson',
    source: initialProgram.source,
    argsText: initialProgram.argsText,
    artifacts: null,
    engine,
    capabilities: {
      canEditSource: false,
      canPasteSource: false,
      canReplaceProgram: false,
      canRun: false,
      canReset: false,
      canUseFreeformInput: false,
      enabledViews: ['flow', 'state', 'explain', 'structure'],
    },
    persistence,
    persistenceKey: lensSessionStorageKey({
      kind: 'lesson',
      ownerId: attemptId,
      sessionId: 'primary',
    }),
    initialView: definition.lens.initialView,
    onSourceEdited: ({ source, revision }) => {
      state.submissionEvidence = null;
      for (const assessment of definition.assessments.filter((item) => item.type === 'build')) {
        const previous = state.responses[assessment.responseId];
        if (previous?.status === 'revealed') {
          state.responses = {
            ...state.responses,
            [assessment.responseId]: { answer: previous.answer, status: 'draft' },
          };
        }
      }
      void hashSource(source).then((sourceHash) => {
        eventStore.append('source_edited', { sourceHash, revision, length: source.length });
      });
    },
    onRunCompleted: ({ revision, status }) => {
      eventStore.append('program_run', { revision, status }, `run:${revision}`);
    },
    onViewChanged: (view) => {
      eventStore.append('lens_view_changed', { view });
    },
    onFrameChanged: (frame) => {
      eventStore.append('lens_frame_changed', { frame });
    },
  });
  const orchestrator = createLessonLensOrchestrator(
    definition,
    lensSession,
    () => state.responses,
  );
  eventStore.append('lesson_started', {}, 'lesson-started');

  function assessmentContext(
    assessment: LessonAssessment | undefined,
  ): AssessmentEventContext | undefined {
    if (!assessment) return undefined;
    return {
      assessmentId: assessment.id,
      assessmentType: assessment.type,
      phase: assessment.type === 'transfer' ? assessment.phase : 'lesson',
    };
  }

  function saveProgress() {
    try {
      storage.setItem(attemptKey(definition, attemptId), JSON.stringify({
        schemaVersion: 4,
        lessonId: definition.id,
        lessonVersion: definition.version,
        attemptId,
        activeSectionId: state.activeSectionId,
        completedSectionIds: state.completedSectionIds,
        responses: state.responses,
        selectedVariationId: state.selectedVariationId,
        selectedScenarioId: state.selectedScenarioId,
        appliedCueIds: state.appliedCueIds,
        updatedAt: new Date().toISOString(),
      }));
      state.persistenceWarning = null;
    } catch (error) {
      state.persistenceWarning = `Lesson progress could not be saved: ${
        error instanceof Error ? error.message : String(error)
      }`;
    }
  }

  function completeSection(sectionId: string) {
    if (!state.completedSectionIds.includes(sectionId)) {
      state.completedSectionIds = [...state.completedSectionIds, sectionId];
    }
  }

  function storeResponse(
    id: string,
    status: LessonResponse['status'],
    options?: { correct?: boolean; feedback?: string },
  ) {
    const previous = state.responses[id] ?? { answer: '', status: 'draft' as const };
    state.responses = {
      ...state.responses,
      [id]: {
        answer: previous.answer,
        status,
        ...(options?.correct === undefined ? {} : { correct: options.correct }),
        ...(options?.feedback ? { feedback: options.feedback } : {}),
      },
    };
    if (status === 'revealed' && options?.correct !== false) {
      const section = responseSection(definition, id);
      if (section) completeSection(section.id);
    }
    orchestrator.refreshReveal();
    saveProgress();
  }

  await lensSession.controller.actions.hydrate();
  const activeSection = definition.sections.find(
    (section) => section.id === state.activeSectionId,
  ) ?? definition.sections[0];
  await orchestrator.applyCue(activeSection.lensCueId, { restoring: Boolean(restored) });
  if (!state.appliedCueIds.includes(activeSection.lensCueId)) {
    state.appliedCueIds = [...state.appliedCueIds, activeSection.lensCueId];
  }
  state.initialized = true;
  saveProgress();

  let controller: LessonSessionController;
  controller = {
    definition,
    state,
    lens: lensSession.controller,
    orchestrator,
    pilot: {
      participantCode: eventStore.participantCode,
      isRecording: eventStore.isRecording,
      status: eventStore.status,
      summaries: eventStore.summaries,
      exportData: eventStore.exportData,
      deleteData: eventStore.deleteParticipantData,
    },
    actions: {
      async setActiveSection(sectionId) {
        const section = definition.sections.find((candidate) => candidate.id === sectionId);
        if (!section) return;
        const previousSection = definition.sections.find(
          (candidate) => candidate.id === state.activeSectionId,
        );
        const cue = definition.cues.find((candidate) => candidate.id === section.lensCueId);
        state.activeSectionId = sectionId;
        if (previousSection?.internalRole === 'guided-explore') {
          eventStore.append('guided_completed', { sectionId: previousSection.id });
        }
        eventStore.append('section_opened', { sectionId });
        if (section.internalRole === 'guided-explore') {
          eventStore.append('guided_started', { sectionId });
        }
        state.interactionMessage = null;
        if (previousSection && !previousSection.blocks.some((block) => 'responseId' in block)) {
          completeSection(previousSection.id);
        }
        if (cue?.requiresResponseId) {
          const response = state.responses[cue.requiresResponseId];
          if (!response || response.status === 'draft') {
            state.interactionMessage = 'Commit the prediction before Lens reveals this guided execution.';
            saveProgress();
            return;
          }
        }
        await orchestrator.applyCue(section.lensCueId);
        if (!state.appliedCueIds.includes(section.lensCueId)) {
          state.appliedCueIds = [...state.appliedCueIds, section.lensCueId];
        }
        saveProgress();
      },
      setResponseDraft(id, answer) {
        const firstDraft = !state.responses[id]?.answer;
        state.responses = {
          ...state.responses,
          [id]: { answer, status: 'draft' },
        };
        state.interactionMessage = null;
        orchestrator.refreshReveal();
        const assessment = definition.assessments.find((item) => item.responseId === id);
        if (firstDraft) {
          eventStore.append(
            'prediction_drafted',
            { responseId: id },
            undefined,
            assessmentContext(assessment),
          );
        }
        saveProgress();
      },
      commitResponse(id, correct, feedback) {
        storeResponse(id, 'committed', { correct, feedback });
        const assessment = definition.assessments.find((item) => item.responseId === id);
        eventStore.append(
          'prediction_committed',
          { responseId: id, correct: correct ?? null },
          undefined,
          assessmentContext(assessment),
        );
      },
      revealResponse(id, correct, feedback) {
        storeResponse(id, 'revealed', { correct, feedback });
        const assessment = definition.assessments.find((item) => item.responseId === id);
        if (assessment?.type === 'transfer') {
          eventStore.append('transfer_submitted', {
            responseId: id,
            correct: correct ?? false,
          }, undefined, assessmentContext(assessment));
        } else {
          eventStore.append('execution_revealed', {
            responseId: id,
            correct: correct ?? null,
          }, undefined, assessmentContext(assessment));
        }
        const postTransfer = definition.assessments.find(
          (item) => item.type === 'transfer' && item.phase === 'post',
        );
        const build = definition.assessments.find((item) => item.type === 'build');
        if (
          postTransfer?.responseId === id
          && state.responses[build?.responseId ?? '']?.correct === true
          && definition.assessments
            .filter((item) => item.type === 'prediction')
            .every((item) => state.responses[item.responseId]?.status === 'revealed')
        ) {
          eventStore.append('lesson_completed', {}, 'lesson-completed');
        }
      },
      retryResponse(id) {
        const previous = state.responses[id];
        if (!previous) return;
        state.responses = {
          ...state.responses,
          [id]: { answer: previous.answer, status: 'draft' },
        };
        orchestrator.refreshReveal();
        const assessment = definition.assessments.find((item) => item.responseId === id);
        eventStore.append(
          'response_retried',
          { responseId: id },
          undefined,
          assessmentContext(assessment),
        );
        saveProgress();
      },
      async applyVariation(responseId, variationId) {
        const response = state.responses[responseId];
        const variation = definition.variations.find((candidate) => candidate.id === variationId);
        if (!response || response.status === 'draft' || !variation) return false;

        const baselineArtifacts = await analyzeLessonProgram(
          definition,
          variation.comparison.baselineProgramId,
          engine,
        );
        const baseline = projectLessonComparison(variation.comparison, baselineArtifacts);
        const applied = await orchestrator.applyVariation(variationId);
        if (!applied || !lensSession.controller.state.artifacts) return false;

        const currentArtifacts = lensSession.controller.state.artifacts;
        const current = projectLessonComparison(variation.comparison, currentArtifacts);
        const evidence = runLessonVerifications(
          definition,
          variation.verificationIds,
          {
            source: lensSession.controller.state.source,
            artifacts: currentArtifacts,
            response: response.answer,
            baselineSummary: baseline,
          },
        );
        const correct = response.correct !== false && evidence.every((item) => item.correct);
        state.selectedVariationId = variationId;
        state.selectedScenarioId = null;
        const assessment = definition.assessments.find(
          (item) => item.responseId === responseId,
        );
        eventStore.append(
          'variation_applied',
          { responseId, variationId },
          undefined,
          assessmentContext(assessment),
        );
        state.comparison = {
          kind: variation.comparison.kind,
          rows: variation.comparison.kind === 'bindings'
            ? variation.comparison.fields.map((field) => ({
                label: field.label,
                baseline: baseline.values[field.key] ?? '—',
                current: current.values[field.key] ?? '—',
              }))
            : [{
                label: variation.comparison.kind === 'return-value'
                  ? 'Return value'
                  : variation.comparison.kind === 'frames'
                    ? 'Frames'
                    : 'Path',
                baseline: Object.values(baseline.values)[0] ?? '—',
                current: Object.values(current.values)[0] ?? '—',
              }],
          evidence,
        };
        storeResponse(responseId, 'revealed', {
          correct,
          feedback: correct ? variation.successFeedback : variation.retryFeedback,
        });
        return true;
      },
      async checkBuild(responseId) {
        const block = definition.sections
          .flatMap((section) => section.blocks)
          .find((candidate) => candidate.type === 'build' && candidate.responseId === responseId);
        if (!block || block.type !== 'build') return false;
        const assessment = definition.assessments.find(
          (item) => item.type === 'build' && item.responseId === responseId,
        );
        if (!assessment || assessment.type !== 'build') return false;

        await lensSession.controller.actions.run();
        const lensState = lensSession.controller.state;
        const submittedSource = lensState.source;
        const sourceHash = await hashSource(submittedSource);
        const requiredScenarios = assessment.scenarioIds.map((scenarioId) =>
          definition.scenarios.find((scenario) => scenario.id === scenarioId))
          .filter((scenario): scenario is NonNullable<typeof scenario> => Boolean(scenario));
        const scenarioResults = await runScenariosAgainstSource({
          source: submittedSource,
          sourceHash,
          scenarios: requiredScenarios,
          engine,
        });
        const evidence = runLessonVerifications(
          definition,
          assessment.verificationIds,
          {
            source: submittedSource,
            artifacts: lensState.artifacts,
            response: state.responses[responseId]?.answer,
            scenarioArtifacts: scenarioResults.flatMap((scenario) =>
              scenario.artifacts ? [scenario.artifacts] : []),
            scenarioResults,
          },
        );
        const currentHash = await hashSource(lensSession.controller.state.source);
        const scenarioIntegrity = scenarioResults.length === requiredScenarios.length
          && scenarioResults.every((scenario) =>
            scenario.sourceHash === sourceHash && !scenario.error && scenario.artifacts);
        const correct = sourceHash === currentHash
          && Boolean(lensState.artifacts)
          && scenarioIntegrity
          && evidence.every((item) => item.correct);
        const failed = evidence.filter((item) => !item.correct);
        if (!scenarioIntegrity) {
          failed.push({
            id: 'learner-source-scenarios',
            correct: false,
            feedback: 'One or more learner-source scenarios did not satisfy the required outcome.',
            evidence: {
              failures: scenarioResults.filter((scenario) => scenario.error)
                .map((scenario) => ({ scenarioId: scenario.scenarioId, error: scenario.error })),
            },
          });
        }
        state.submissionEvidence = {
          sourceHash,
          runRevision: lensState.revision,
          artifacts: lensState.artifacts,
          scenarioResults,
          verificationResults: evidence,
        };
        eventStore.append('verification_completed', {
          responseId,
          sourceHash,
          runRevision: lensState.revision,
          correct,
          failedCriteria: failed.map((item) => item.id),
        }, undefined, assessmentContext(assessment));
        eventStore.append('build_submission_completed', {
          responseId,
          sourceHash,
          correct,
          failedCriteria: failed.map((item) => item.id),
        }, undefined, assessmentContext(assessment));
        storeResponse(responseId, 'revealed', {
          correct,
          feedback: correct
            ? evidence.map((item) => item.feedback).join(' ')
            : failed.map((item) => item.feedback).join(' '),
        });
        return correct;
      },
      async restart() {
        eventStore.append('lesson_restarted');
        storage.removeItem(attemptKey(definition, attemptId));
        storage.removeItem(pointerKey(definition));
        await lensSession.ownerActions.clearPersistence();
        return createLessonSessionController(definition, storage, true, study);
      },
    },
  };
  return controller;
}
