import type {
  LensSessionController,
  LessonDefinitionV4,
  LessonResponse,
  SubmissionEvidence,
} from '@lol/lens-contracts';
import { LessonResponseSchema, z } from '@lol/lens-contracts';
import { createLensEngine } from '$lib/lens/engine';
import { createLensSession } from '$lib/lens/session.svelte';
import {
  createBrowserLensPersistence,
  lensSessionStorageKey,
} from '$lib/lens/storage';
import type { SafeStorage } from '$lib/storage/safe-storage';
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
  hashSource,
  runScenariosAgainstSource,
} from './scenarios';
import { createSubmissionGuard } from './submission-guard';

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
  storage: SafeStorage,
  forceNew = false,
): Promise<LessonSessionController> {
  let warning: string | null = null;
  let attemptId: string | null = null;
  let restored: z.infer<typeof LessonAttemptSnapshotSchema> | null = null;

  if (!forceNew) {
    const pointer = storage.readText(pointerKey(definition));
    if (pointer.ok) attemptId = pointer.value;
    else warning = `Saved lesson progress could not be read: ${pointer.message}`;
  }

  if (attemptId) {
    const key = attemptKey(definition, attemptId);
    const parsed = storage.readJson(key, (value) => LessonAttemptSnapshotSchema.parse(value));
    if (parsed.ok) {
      const snapshot = parsed.value;
      if (
        snapshot
        && snapshot.lessonId === definition.id
        && snapshot.lessonVersion === definition.version
        && snapshot.attemptId === attemptId
        && definition.sections.some((section) => section.id === snapshot.activeSectionId)
      ) {
        restored = snapshot;
      } else if (snapshot) {
        warning = 'Saved lesson progress was incompatible and has been replaced.';
        storage.remove(key);
        attemptId = null;
      }
    } else {
      warning = `${parsed.message} Saved lesson progress has been replaced.`;
      storage.remove(key);
      attemptId = null;
    }
  }

  attemptId ??= newAttemptId();
  const pointerWrite = storage.writeText(pointerKey(definition), attemptId);
  if (!pointerWrite.ok) warning = pointerWrite.message;

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
  const submissions = createSubmissionGuard();
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
    onSourceEdited: () => {
      submissions.invalidate();
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
    },
  });
  const orchestrator = createLessonLensOrchestrator(
    definition,
    lensSession,
    () => state.responses,
  );
  function saveProgress() {
    const result = storage.writeJson(attemptKey(definition, attemptId), {
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
    });
    if (
      result.ok
      && state.persistenceWarning?.startsWith('Lesson progress could not be saved:')
    ) {
      state.persistenceWarning = null;
    } else if (!result.ok) {
      state.persistenceWarning = `Lesson progress could not be saved: ${result.message}`;
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
    actions: {
      async setActiveSection(sectionId) {
        const section = definition.sections.find((candidate) => candidate.id === sectionId);
        if (!section) return;
        if (sectionId !== state.activeSectionId) submissions.invalidate();
        const previousSection = definition.sections.find(
          (candidate) => candidate.id === state.activeSectionId,
        );
        const cue = definition.cues.find((candidate) => candidate.id === section.lensCueId);
        state.activeSectionId = sectionId;
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
        state.responses = {
          ...state.responses,
          [id]: { answer, status: 'draft' },
        };
        state.interactionMessage = null;
        orchestrator.refreshReveal();
        saveProgress();
      },
      commitResponse(id, correct, feedback) {
        storeResponse(id, 'committed', { correct, feedback });
      },
      revealResponse(id, correct, feedback) {
        storeResponse(id, 'revealed', { correct, feedback });
      },
      retryResponse(id) {
        const previous = state.responses[id];
        if (!previous) return;
        state.responses = {
          ...state.responses,
          [id]: { answer: previous.answer, status: 'draft' },
        };
        orchestrator.refreshReveal();
        saveProgress();
      },
      async applyVariation(responseId, variationId) {
        submissions.invalidate();
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
        const submission = submissions.begin(attemptId);
        const block = definition.sections
          .flatMap((section) => section.blocks)
          .find((candidate) => candidate.type === 'build' && candidate.responseId === responseId);
        if (!block || block.type !== 'build') return false;
        const assessment = definition.assessments.find(
          (item) => item.type === 'build' && item.responseId === responseId,
        );
        if (!assessment || assessment.type !== 'build') return false;

        await lensSession.controller.actions.run();
        if (!submissions.isActive(submission)) return false;
        const lensState = lensSession.controller.state;
        const submittedSource = lensState.source;
        const lensRevision = lensState.revision;
        const artifacts = lensState.artifacts;
        const sourceHash = await hashSource(submittedSource);
        const identity = submissions.bind(submission, sourceHash, lensRevision);
        const isCurrent = (currentSourceHash = sourceHash) => Boolean(
          identity
          && lensSession.controller.state.source === submittedSource
          && submissions.isCurrent(identity, {
            ...identity,
            attemptId: state.attemptId,
            sourceHash: currentSourceHash,
            lensRevision: lensSession.controller.state.revision,
          }),
        );
        if (!identity || !isCurrent()) return false;
        const requiredScenarios = assessment.scenarioIds.map((scenarioId) =>
          definition.scenarios.find((scenario) => scenario.id === scenarioId))
          .filter((scenario): scenario is NonNullable<typeof scenario> => Boolean(scenario));
        const scenarioResults = await runScenariosAgainstSource({
          source: submittedSource,
          sourceHash,
          scenarios: requiredScenarios,
          engine,
          baseArtifacts: artifacts,
        });
        const currentSourceHash = await hashSource(lensSession.controller.state.source);
        if (!isCurrent(currentSourceHash)) return false;
        const evidence = runLessonVerifications(
          definition,
          assessment.verificationIds,
          {
            source: submittedSource,
            artifacts,
            response: state.responses[responseId]?.answer,
            scenarioArtifacts: scenarioResults.flatMap((scenario) =>
              scenario.artifacts ? [scenario.artifacts] : []),
            scenarioResults,
          },
        );
        if (!isCurrent()) return false;
        const scenarioIntegrity = scenarioResults.length === requiredScenarios.length
          && scenarioResults.every((scenario) =>
            scenario.sourceHash === sourceHash && !scenario.error && scenario.artifacts);
        const correct = Boolean(artifacts)
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
          ...identity,
          artifacts,
          scenarioResults,
          verificationResults: evidence,
        };
        if (!isCurrent()) return false;
        storeResponse(responseId, 'revealed', {
          correct,
          feedback: correct
            ? evidence.map((item) => item.feedback).join(' ')
            : failed.map((item) => item.feedback).join(' '),
        });
        return correct;
      },
      async restart() {
        submissions.invalidate();
        const attemptRemoval = storage.remove(attemptKey(definition, attemptId));
        const pointerRemoval = storage.remove(pointerKey(definition));
        if (!attemptRemoval.ok || !pointerRemoval.ok) {
          state.persistenceWarning = 'Saved progress could not be fully cleared. A new lesson attempt will still start.';
        }
        await lensSession.ownerActions.clearPersistence();
        return createLessonSessionController(definition, storage, true);
      },
    },
  };
  return controller;
}
