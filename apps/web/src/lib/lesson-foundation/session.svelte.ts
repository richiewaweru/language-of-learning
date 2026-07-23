import type {
  LensSessionController,
  LensSessionOwnerActions,
  LessonDefinitionV1,
} from '@lol/lens-contracts';
import { z } from '@lol/lens-contracts';
import { createLensEngine } from '$lib/lens/engine';
import { createLensSession } from '$lib/lens/session.svelte';
import {
  createBrowserLensPersistence,
  lensSessionStorageKey,
} from '$lib/lens/storage';

const LOCAL_OWNER = 'local';

const LessonAttemptSnapshotSchema = z.object({
  schemaVersion: z.literal(1),
  lessonId: z.string(),
  lessonVersion: z.string(),
  attemptId: z.string(),
  activeSectionId: z.string(),
  completedSectionIds: z.array(z.string()),
  predictions: z.record(z.string(), z.string()),
  updatedAt: z.string().datetime(),
}).strict();

export type LessonAttemptState = {
  attemptId: string;
  activeSectionId: string;
  completedSectionIds: string[];
  predictions: Record<string, string>;
  initialized: boolean;
  persistenceWarning: string | null;
};

export type LessonSessionController = {
  readonly definition: LessonDefinitionV1;
  readonly state: LessonAttemptState;
  readonly lens: LensSessionController;
  readonly lensOwnerActions: LensSessionOwnerActions;
  readonly actions: {
    setActiveSection(sectionId: string): void;
    toggleSectionComplete(sectionId: string): void;
    setPrediction(id: string, answer: string): void;
    restart(): Promise<LessonSessionController>;
  };
};

function pointerKey(definition: LessonDefinitionV1) {
  return `lesson:v1:${LOCAL_OWNER}:${definition.id}:${definition.version}:active`;
}

function attemptKey(definition: LessonDefinitionV1, attemptId: string) {
  return `lesson:v1:${LOCAL_OWNER}:${definition.id}:${definition.version}:${attemptId}`;
}

function newAttemptId() {
  return crypto.randomUUID();
}

export async function createLessonSessionController(
  definition: LessonDefinitionV1,
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
        parsed?.success &&
        parsed.data.lessonId === definition.id &&
        parsed.data.lessonVersion === definition.version &&
        parsed.data.attemptId === attemptId &&
        definition.sections.some((section) => section.id === parsed.data.activeSectionId)
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
    predictions: restored?.predictions ?? {},
    initialized: false,
    persistenceWarning: warning,
  });

  const persistence = createBrowserLensPersistence(storage);
  const lensSession = createLensSession({
    id: `${attemptId}:primary`,
    kind: 'lesson',
    source: definition.lens.initialProgram.source,
    argsText: definition.lens.initialProgram.argsText,
    artifacts: null,
    engine: createLensEngine(),
    capabilities: definition.lens.capabilities,
    persistence,
    persistenceKey: lensSessionStorageKey({
      kind: 'lesson',
      ownerId: attemptId,
      sessionId: 'primary',
    }),
    initialView: definition.lens.initialView,
  });

  function saveProgress() {
    try {
      storage.setItem(attemptKey(definition, attemptId), JSON.stringify({
        schemaVersion: 1,
        lessonId: definition.id,
        lessonVersion: definition.version,
        attemptId,
        activeSectionId: state.activeSectionId,
        completedSectionIds: state.completedSectionIds,
        predictions: state.predictions,
        updatedAt: new Date().toISOString(),
      }));
      state.persistenceWarning = null;
    } catch (error) {
      state.persistenceWarning = `Lesson progress could not be saved: ${
        error instanceof Error ? error.message : String(error)
      }`;
    }
  }

  await lensSession.controller.actions.hydrate();
  const restoredFrame = lensSession.controller.state.selection.stepIndex ?? 0;
  await lensSession.controller.actions.run();
  lensSession.controller.actions.setCurrentFrame(restoredFrame);
  state.initialized = true;
  saveProgress();

  let controller: LessonSessionController;
  controller = {
    definition,
    state,
    lens: lensSession.controller,
    lensOwnerActions: lensSession.ownerActions,
    actions: {
      setActiveSection(sectionId) {
        if (!definition.sections.some((section) => section.id === sectionId)) return;
        state.activeSectionId = sectionId;
        saveProgress();
      },
      toggleSectionComplete(sectionId) {
        if (!definition.sections.some((section) => section.id === sectionId)) return;
        state.completedSectionIds = state.completedSectionIds.includes(sectionId)
          ? state.completedSectionIds.filter((id) => id !== sectionId)
          : [...state.completedSectionIds, sectionId];
        saveProgress();
      },
      setPrediction(id, answer) {
        state.predictions = { ...state.predictions, [id]: answer };
        saveProgress();
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
