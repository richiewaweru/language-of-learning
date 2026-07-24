import type {
  LensSessionController,
  LessonDefinitionV3,
  LessonResponse,
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
  createLessonScenarioController,
  projectLessonComparison,
} from './services';
import {
  runLessonVerifications,
  type LessonVerificationResult,
} from './verification';

const LOCAL_OWNER = 'local';

const LessonAttemptSnapshotSchema = z.object({
  schemaVersion: z.literal(3),
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
};

export type LessonSessionController = {
  readonly definition: LessonDefinitionV3;
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

function pointerKey(definition: LessonDefinitionV3) {
  return `lesson:v3:${LOCAL_OWNER}:${definition.id}:${definition.version}:active`;
}

function attemptKey(definition: LessonDefinitionV3, attemptId: string) {
  return `lesson:v3:${LOCAL_OWNER}:${definition.id}:${definition.version}:${attemptId}`;
}

function newAttemptId() {
  return crypto.randomUUID();
}

function responseSection(definition: LessonDefinitionV3, responseId: string) {
  return definition.sections.find((section) =>
    section.blocks.some((block) => 'responseId' in block && block.responseId === responseId),
  );
}

export async function createLessonSessionController(
  definition: LessonDefinitionV3,
  storage: Storage,
  forceNew = false,
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
  });

  const persistence = createBrowserLensPersistence(storage);
  const engine = createLensEngine();
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
  });
  const orchestrator = createLessonLensOrchestrator(
    definition,
    lensSession,
    () => state.responses,
  );
  const scenarios = createLessonScenarioController(definition, engine);

  function saveProgress() {
    try {
      storage.setItem(attemptKey(definition, attemptId), JSON.stringify({
        schemaVersion: 3,
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

  async function scenarioArtifacts() {
    return Promise.all(definition.scenarios.map((scenario) => scenarios.run(scenario.id)));
  }

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
            scenarioArtifacts: await scenarioArtifacts(),
          },
        );
        const correct = response.correct !== false && evidence.every((item) => item.correct);
        state.selectedVariationId = variationId;
        state.selectedScenarioId = definition.scenarios.find(
          (scenario) => scenario.programId === variation.programId,
        )?.id ?? null;
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

        await lensSession.controller.actions.run();
        const lensState = lensSession.controller.state;
        const evidence = runLessonVerifications(
          definition,
          block.verificationIds,
          {
            source: lensState.source,
            artifacts: lensState.artifacts,
            response: state.responses[responseId]?.answer,
            scenarioArtifacts: await scenarioArtifacts(),
          },
        );
        const correct = evidence.every((item) => item.correct);
        const failed = evidence.filter((item) => !item.correct);
        storeResponse(responseId, 'revealed', {
          correct,
          feedback: correct
            ? evidence.map((item) => item.feedback).join(' ')
            : failed.map((item) => item.feedback).join(' '),
        });
        return correct;
      },
      async restart() {
        storage.removeItem(attemptKey(definition, attemptId));
        storage.removeItem(pointerKey(definition));
        await lensSession.ownerActions.clearPersistence();
        return createLessonSessionController(definition, storage, true);
      },
    },
  };
  return controller;
}
