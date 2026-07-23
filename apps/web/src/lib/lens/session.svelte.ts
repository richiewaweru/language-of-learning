import type {
  LensArtifacts,
  LensCapabilities,
  LensEngine,
  LensSessionActions,
  LensSessionKind,
  LensSessionPersistence,
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

export function createLensSession(options: LensSessionOptions): {
  state: LensSessionState;
  actions: LensSessionActions;
  capabilities: LensCapabilities;
  persistenceKey: string;
} {
  const initial = {
    source: options.source,
    argsText: options.argsText,
    artifacts: options.artifacts,
    activeView: options.initialView ?? 'flow',
  };
  const runs = createRunCoordinator();

  const state = $state<LensSessionState>({
    schemaVersion: 1,
    id: options.id,
    kind: options.kind,
    source: initial.source,
    argsText: initial.argsText,
    activeView: initial.activeView,
    selection: { stepIndex: 0 },
    updatedAt: new Date().toISOString(),
    status: initial.artifacts?.violation ? 'unsupported' : initial.artifacts ? 'supported' : 'idle',
    artifacts: initial.artifacts,
    error: '',
  });

  function touch() {
    state.updatedAt = new Date().toISOString();
    void options.persistence.save(options.persistenceKey, snapshot(state));
  }

  const actions: LensSessionActions = {
    setSource(source) {
      if (!options.capabilities.canEditSource) return;
      state.source = source;
      touch();
    },
    setArgsText(argsText) {
      if (!options.capabilities.canUseFreeformInput) return;
      state.argsText = argsText;
      touch();
    },
    async run() {
      if (!options.capabilities.canRun) return;
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
        if (runs.isCurrent(generation)) touch();
      }
    },
    reset() {
      if (!options.capabilities.canReset) return;
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
      if (!options.capabilities.enabledViews.includes(view)) return;
      state.activeView = view;
      touch();
    },
    setCurrentFrame(frame) {
      const last = Math.max(0, (state.artifacts?.semanticScene?.steps.length ?? 1) - 1);
      state.selection = {
        ...state.selection,
        stepIndex: Math.min(last, Math.max(0, frame)),
      };
      touch();
    },
    setSelection(selection) {
      state.selection = { ...selection };
      touch();
    },
  };

  return {
    state,
    actions,
    capabilities: Object.freeze({
      ...options.capabilities,
      enabledViews: Object.freeze([...options.capabilities.enabledViews]),
    }),
    persistenceKey: options.persistenceKey,
  };
}
