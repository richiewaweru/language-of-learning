import type {
  LensCapabilities,
  LensPresentation,
  LensSessionHandle,
  LessonDefinitionV2,
  LessonLensCue,
  LessonLensMode,
} from '@lol/lens-contracts';
import { CueTransitionGuard, InitializeOnceLedger } from './orchestration-core';

const enabledViews = ['flow', 'state', 'explain', 'structure'] as const;

function capabilitiesFor(mode: LessonLensMode): LensCapabilities {
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

function programForCue(definition: LessonDefinitionV2, cue: LessonLensCue) {
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
  };
  applyCue(cueId: string, options?: { restoring?: boolean }): Promise<boolean>;
  applyVariation(variationId: string): Promise<boolean>;
};

export function createLessonLensOrchestrator(
  definition: LessonDefinitionV2,
  lens: LensSessionHandle,
): LessonLensOrchestrator {
  const initialCue = definition.cues.find(
    (cue) => cue.sectionId === definition.sections[0].id,
  ) ?? definition.cues[0];
  const state = $state({
    cue: initialCue,
    presentation: initialCue.presentation,
    mode: initialCue.mode,
    transitionRevision: 0,
  });
  const transitions = new CueTransitionGuard();
  const initializedCues = new InitializeOnceLedger();

  async function guide(cue: LessonLensCue, restoring = false) {
    const currentGeneration = transitions.begin();
    const restoredView = lens.controller.state.activeView;
    const restoredFrame = lens.controller.state.selection.stepIndex ?? 0;
    state.cue = cue;
    state.presentation = cue.presentation;
    state.mode = cue.mode;
    state.transitionRevision += 1;
    lens.ownerActions.setCapabilitiesFromOwner(capabilitiesFor(cue.mode));

    const program = programForCue(definition, cue);
    const shouldInitialize = cue.apply === 'initialize-once'
      && !restoring
      && initializedCues.shouldApply(cue.id);
    const shouldReplace = cue.apply === 'replace-program' && !restoring;
    if (program && (shouldInitialize || shouldReplace)) {
      lens.ownerActions.loadProgramFromOwner({
        ...program,
        language: 'python',
      });
    }
    if (cue.apply === 'initialize-once' && restoring) initializedCues.shouldApply(cue.id);

    if (cue.mode !== 'build') {
      await lens.ownerActions.runFromOwner();
      if (!transitions.isCurrent(currentGeneration)) return false;
    }
    if (restoring) {
      lens.controller.actions.setActiveView(restoredView);
      lens.controller.actions.setCurrentFrame(restoredFrame);
    } else if (cue.view) {
      lens.controller.actions.setActiveView(cue.view);
    }
    if (!restoring && cue.frame !== undefined) {
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
  };
}

export function finalBindings(handle: LensSessionHandle['controller']) {
  const steps = handle.state.artifacts?.trace.steps ?? [];
  return steps.at(-1)?.bindings ?? {};
}

export function verifyBuildProgram(source: string) {
  const assignmentPattern = /^\s*([A-Za-z_]\w*)\s*=\s*(.+?)\s*$/;
  const assignments = source
    .split(/\r?\n/)
    .map((line) => assignmentPattern.exec(line))
    .filter((match): match is RegExpExecArray => Boolean(match))
    .map((match) => ({ target: match[1], expression: match[2] }));

  if (assignments.length !== 3) {
    return {
      correct: false,
      feedback: `Use exactly three assignments; Lens found ${assignments.length}.`,
    };
  }
  const [first, second, derived] = assignments;
  const identifierPattern = /\b[A-Za-z_]\w*\b/g;
  const dependencies = new Set(derived.expression.match(identifierPattern) ?? []);
  if (dependencies.has(derived.target)) {
    return {
      correct: false,
      feedback: 'The derived assignment must calculate a new value, not read itself.',
    };
  }
  const missing = [first.target, second.target].filter((name) => !dependencies.has(name));
  if (missing.length) {
    return {
      correct: false,
      feedback: `The final assignment must depend on both starting names. Missing: ${missing.join(', ')}.`,
    };
  }
  return {
    correct: true,
    feedback: `${derived.target} correctly depends on ${first.target} and ${second.target}.`,
  };
}
