import { parseLensSessionSnapshot } from '@lol/lens-contracts';
import type {
  LensArtifacts,
  LensCapabilities,
  LensEngine,
  LensSessionActions,
  LensSessionKind,
  LensSessionHandle,
  LensSessionPersistence,
  LensProgram,
  LensSessionSnapshot,
  LensSessionState,
  LensViewId,
  Selection,
} from '@lol/lens-contracts';
import { parseLensArgs, sourceHasModuleEntry } from './input';
import { createRunCoordinator } from './run-coordinator';

export type LensSessionOptions = {
  id: string;
  kind: LensSessionKind;
  source: string;
  argsText: string;
  artifacts: LensArtifacts | null;
  engine: LensEngine;
  capabilities: LensCapabilities;
  persistence: LensSessionPersistence;
  persistenceKey: string;
  initialView?: LensViewId;
  onSourceEdited?: (input: { source: string; revision: number }) => void;
  onRunCompleted?: (input: { revision: number; status: LensSessionState['status'] }) => void;
  onViewChanged?: (view: LensViewId) => void;
  onFrameChanged?: (frame: number) => void;
};

function snapshot(state: LensSessionState): LensSessionSnapshot {
  return {
    schemaVersion: 1,
    id: state.id,
    kind: state.kind,
    source: state.source,
    argsText: state.argsText,
    activeView: state.activeView,
    selection: { ...state.selection },
    updatedAt: state.updatedAt,
  };
}

export function createLensSession(options: LensSessionOptions): LensSessionHandle {
  const initial = {
    source: options.source,
    argsText: options.argsText,
    artifacts: options.artifacts,
    activeView: options.initialView ?? 'flow',
  };
  const runs = createRunCoordinator();
  const capabilities = $state<LensCapabilities>({
    ...options.capabilities,
    enabledViews: [...options.capabilities.enabledViews],
  });

  const state = $state<LensSessionState>({
    schemaVersion: 1,
    id: options.id,
    kind: options.kind,
    source: initial.source,
    argsText: initial.argsText,
    activeView: initial.activeView,
    selection: { stepIndex: 0 },
    updatedAt: new Date().toISOString(),
    initialized: false,
    hydrationStatus: 'not-requested',
    revision: 0,
    persistenceWarning: null,
    status: initial.artifacts?.violation ? 'unsupported' : initial.artifacts ? 'supported' : 'idle',
    artifacts: initial.artifacts,
    error: '',
  });

  let pendingSnapshot: LensSessionSnapshot | null = null;
  let persistenceDrain: Promise<void> | null = null;
  let hydrationPromise: Promise<void> | null = null;

  async function flushPersistence() {
    while (pendingSnapshot) {
      const next = pendingSnapshot;
      pendingSnapshot = null;
      try {
        await options.persistence.save(options.persistenceKey, next);
        if (state.hydrationStatus !== 'failed' && state.hydrationStatus !== 'invalid') {
          state.persistenceWarning = null;
        }
      } catch (error) {
        state.persistenceWarning = `Progress could not be saved: ${
          error instanceof Error ? error.message : String(error)
        }`;
      }
    }
  }

  function requestPersistenceFlush() {
    if (persistenceDrain) return;
    persistenceDrain = flushPersistence().finally(() => {
      persistenceDrain = null;
      if (pendingSnapshot) requestPersistenceFlush();
    });
  }

  function touch() {
    state.revision += 1;
    state.updatedAt = new Date().toISOString();
    pendingSnapshot = snapshot(state);
    requestPersistenceFlush();
  }

  function applyProgram(program: LensProgram) {
    runs.invalidate();
    state.source = program.source;
    state.argsText = program.argsText;
    state.selection = { stepIndex: 0 };
    state.artifacts = null;
    state.status = 'idle';
    state.error = '';
    touch();
  }

  async function runProgram() {
    const generation = runs.begin();
    state.status = 'running';
    state.error = '';
    // Verified artifacts are invalid as soon as a new run begins.
    state.artifacts = null;
    state.selection = { stepIndex: 0 };
    try {
      const artifacts = await options.engine.analyze({
        language: 'python',
        source: state.source,
        argsRepr: sourceHasModuleEntry(state.source) ? [] : parseLensArgs(state.argsText),
      });
      if (!runs.isCurrent(generation)) return;
      state.artifacts = artifacts;
      state.status = artifacts.violation ? 'unsupported' : 'supported';
    } catch (error) {
      if (!runs.isCurrent(generation)) return;
      state.artifacts = null;
      state.status = 'invalid';
      state.error = error instanceof Error ? error.message : String(error);
    } finally {
      if (runs.isCurrent(generation)) {
        touch();
        options.onRunCompleted?.({ revision: state.revision, status: state.status });
      }
    }
  }

  const actions: LensSessionActions = {
    async hydrate() {
      if (hydrationPromise) return hydrationPromise;
      hydrationPromise = (async () => {
        state.hydrationStatus = 'loading';
        try {
          const loaded = await options.persistence.load(options.persistenceKey);
          if (loaded === null) {
            state.hydrationStatus = 'empty';
          } else {
            const parsed = parseLensSessionSnapshot(loaded, {
              id: options.id,
              kind: options.kind,
              enabledViews: capabilities.enabledViews,
            });
            if (!parsed.success) {
              state.hydrationStatus = 'invalid';
              state.persistenceWarning = parsed.reason;
            } else {
              state.source = parsed.data.source;
              state.argsText = parsed.data.argsText;
              state.activeView = parsed.data.activeView;
              state.selection = { ...parsed.data.selection };
              state.updatedAt = parsed.data.updatedAt;
              state.artifacts = null;
              state.status = 'idle';
              state.error = '';
              state.revision += 1;
              state.hydrationStatus = 'restored';
            }
          }
        } catch (error) {
          state.hydrationStatus = 'failed';
          state.persistenceWarning = `Progress could not be restored: ${
            error instanceof Error ? error.message : String(error)
          }`;
        } finally {
          state.initialized = true;
        }
      })();
      return hydrationPromise;
    },
    setSourceFromUser(source) {
      if (!capabilities.canEditSource) return;
      runs.invalidate();
      state.source = source;
      state.artifacts = null;
      state.status = 'idle';
      state.error = '';
      touch();
      options.onSourceEdited?.({ source, revision: state.revision });
    },
    replaceProgramFromUser(program) {
      if (!capabilities.canReplaceProgram) return;
      applyProgram(program);
    },
    setArgsText(argsText) {
      if (!capabilities.canUseFreeformInput) return;
      runs.invalidate();
      state.argsText = argsText;
      state.artifacts = null;
      state.status = 'idle';
      state.error = '';
      touch();
    },
    async run() {
      if (!capabilities.canRun) return;
      await runProgram();
    },
    reset() {
      if (!capabilities.canReset) return;
      runs.invalidate();
      state.source = initial.source;
      state.argsText = initial.argsText;
      state.activeView = initial.activeView;
      state.selection = { stepIndex: 0 };
      state.artifacts = initial.artifacts;
      state.status = initial.artifacts?.violation ? 'unsupported' : initial.artifacts ? 'supported' : 'idle';
      state.error = '';
      touch();
    },
    setActiveView(view) {
      if (!capabilities.enabledViews.includes(view)) return;
      state.activeView = view;
      options.onViewChanged?.(view);
      touch();
    },
    setCurrentFrame(frame) {
      const last = Math.max(0, (state.artifacts?.semanticScene?.steps.length ?? 1) - 1);
      state.selection = {
        ...state.selection,
        stepIndex: Math.min(last, Math.max(0, frame)),
      };
      options.onFrameChanged?.(state.selection.stepIndex ?? 0);
      touch();
    },
    setSelection(selection) {
      state.selection = { ...selection };
      touch();
    },
  };

  const controller = {
    state,
    actions,
    capabilities,
    persistenceKey: options.persistenceKey,
  };

  return {
    controller,
    ownerActions: {
      loadProgramFromOwner(program) {
        applyProgram(program);
      },
      setCapabilitiesFromOwner(nextCapabilities) {
        Object.assign(capabilities, {
          ...nextCapabilities,
          enabledViews: [...nextCapabilities.enabledViews],
        });
        if (!capabilities.enabledViews.includes(state.activeView)) {
          state.activeView = capabilities.enabledViews[0] ?? 'flow';
          touch();
        }
      },
      async runFromOwner() {
        await runProgram();
      },
      async clearPersistence() {
        pendingSnapshot = null;
        try {
          if (persistenceDrain) await persistenceDrain;
          pendingSnapshot = null;
          await options.persistence.remove(options.persistenceKey);
          state.persistenceWarning = null;
        } catch (error) {
          state.persistenceWarning = `Saved progress could not be cleared: ${
            error instanceof Error ? error.message : String(error)
          }`;
        }
      },
    },
  };
}
