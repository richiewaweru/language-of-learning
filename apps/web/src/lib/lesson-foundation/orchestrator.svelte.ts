import type {
  LensCapabilities,
  LensPresentation,
  LensSessionHandle,
  LessonDefinitionV3,
  LessonLensCue,
  LessonLensMode,
  LessonResponse,
} from '@lol/lens-contracts';
import { CueTransitionGuard, InitializeOnceLedger } from './orchestration-core';

const allViews = ['flow', 'state', 'explain', 'structure'] as const;

function revealUnlocked(cue: LessonLensCue, responses: Record<string, LessonResponse>) {
  const policy = cue.revealPolicy;
  if (!policy) return true;
  const response = responses[policy.responseId];
  if (!response) return false;
  return policy.unlockAt === 'committed'
    ? response.status === 'committed' || response.status === 'revealed'
    : response.status === 'revealed';
}

function capabilitiesFor(
  mode: LessonLensMode,
  cue: LessonLensCue,
  responses: Record<string, LessonResponse>,
): LensCapabilities {
  const unlocked = revealUnlocked(cue, responses);
  const enabledViews = unlocked || !cue.revealPolicy
    ? [...allViews]
    : allViews.filter((view) => !cue.revealPolicy?.concealedViews.includes(view));
  return {
    canEditSource: mode === 'build',
    canPasteSource: mode === 'build',
    canReplaceProgram: false,
    canRun: mode === 'build',
    canReset: false,
    canUseFreeformInput: mode === 'build',
    enabledViews,
  };
}

function programForCue(definition: LessonDefinitionV3, cue: LessonLensCue) {
  const variation = cue.variationId
    ? definition.variations.find((candidate) => candidate.id === cue.variationId)
    : undefined;
  const programId = variation?.programId ?? cue.programId;
  return programId
    ? definition.programs.find((candidate) => candidate.id === programId)
    : undefined;
}

export type LessonLensOrchestrator = {
  readonly state: {
    cue: LessonLensCue;
    presentation: LensPresentation;
    mode: LessonLensMode;
    transitionRevision: number;
    revealUnlocked: boolean;
  };
  applyCue(cueId: string, options?: { restoring?: boolean }): Promise<boolean>;
  applyVariation(variationId: string): Promise<boolean>;
  refreshReveal(): void;
};

export function createLessonLensOrchestrator(
  definition: LessonDefinitionV3,
  lens: LensSessionHandle,
  getResponses: () => Record<string, LessonResponse>,
): LessonLensOrchestrator {
  const initialCue = definition.cues.find(
    (cue) => cue.sectionId === definition.sections[0].id,
  ) ?? definition.cues[0];
  const state = $state({
    cue: initialCue,
    presentation: initialCue.presentation,
    mode: initialCue.mode,
    transitionRevision: 0,
    revealUnlocked: revealUnlocked(initialCue, getResponses()),
  });
  const transitions = new CueTransitionGuard();
  const initializedCues = new InitializeOnceLedger();

  function applyCapabilities(cue: LessonLensCue) {
    state.revealUnlocked = revealUnlocked(cue, getResponses());
    const capabilities = capabilitiesFor(cue.mode, cue, getResponses());
    lens.ownerActions.setCapabilitiesFromOwner(capabilities);
    if (!capabilities.enabledViews.includes(lens.controller.state.activeView)) {
      lens.controller.actions.setActiveView(capabilities.enabledViews[0]);
    }
    if (!state.revealUnlocked && cue.revealPolicy) {
      lens.controller.actions.setCurrentFrame(0);
    }
  }

  async function guide(cue: LessonLensCue, restoring = false) {
    const currentGeneration = transitions.begin();
    const restoredView = lens.controller.state.activeView;
    const restoredFrame = lens.controller.state.selection.stepIndex ?? 0;
    state.cue = cue;
    state.presentation = cue.presentation;
    state.mode = cue.mode;
    state.transitionRevision += 1;
    applyCapabilities(cue);

    const program = programForCue(definition, cue);
    const shouldInitialize = cue.apply === 'initialize-once'
      && !restoring
      && initializedCues.shouldApply(cue.id);
    const shouldReplace = cue.apply === 'replace-program' && !restoring;
    if (program && (shouldInitialize || shouldReplace)) {
      lens.ownerActions.loadProgramFromOwner({ ...program, language: 'python' });
    }
    if (cue.apply === 'initialize-once' && restoring) initializedCues.shouldApply(cue.id);

    if (cue.mode !== 'build') {
      await lens.ownerActions.runFromOwner();
      if (!transitions.isCurrent(currentGeneration)) return false;
    }

    const capabilities = capabilitiesFor(cue.mode, cue, getResponses());
    if (restoring && capabilities.enabledViews.includes(restoredView)) {
      lens.controller.actions.setActiveView(restoredView);
      lens.controller.actions.setCurrentFrame(
        state.revealUnlocked ? restoredFrame : 0,
      );
    } else if (cue.view && capabilities.enabledViews.includes(cue.view)) {
      lens.controller.actions.setActiveView(cue.view);
    } else {
      lens.controller.actions.setActiveView(capabilities.enabledViews[0]);
    }
    if (!restoring && cue.frame !== undefined && state.revealUnlocked) {
      const last = Math.max(
        0,
        (lens.controller.state.artifacts?.semanticScene?.steps.length ?? 1) - 1,
      );
      lens.controller.actions.setCurrentFrame(
        cue.frame === 'start' ? 0 : cue.frame === 'end' ? last : cue.frame,
      );
    }
    return transitions.isCurrent(currentGeneration);
  }

  return {
    state,
    async applyCue(cueId, options) {
      const cue = definition.cues.find((candidate) => candidate.id === cueId);
      if (!cue) return false;
      return guide(cue, options?.restoring);
    },
    async applyVariation(variationId) {
      const variation = definition.variations.find(
        (candidate) => candidate.id === variationId,
      );
      const program = variation
        ? definition.programs.find((candidate) => candidate.id === variation.programId)
        : undefined;
      if (!program || state.mode !== 'explore') return false;
      const currentGeneration = transitions.begin();
      lens.ownerActions.loadProgramFromOwner({ ...program, language: 'python' });
      await lens.ownerActions.runFromOwner();
      if (!transitions.isCurrent(currentGeneration)) return false;
      lens.controller.actions.setActiveView('state');
      const last = Math.max(
        0,
        (lens.controller.state.artifacts?.semanticScene?.steps.length ?? 1) - 1,
      );
      lens.controller.actions.setCurrentFrame(last);
      return true;
    },
    refreshReveal() {
      applyCapabilities(state.cue);
    },
  };
}

export function finalBindings(handle: LensSessionHandle['controller']) {
  const steps = handle.state.artifacts?.trace.steps ?? [];
  return steps.at(-1)?.bindings ?? {};
}
