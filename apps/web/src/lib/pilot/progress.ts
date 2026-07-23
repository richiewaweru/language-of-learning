export type PilotProgress = {
  currentLessonId: string;
  completedLessonIds: string[];
  completedSteps: Record<string, number[]>;
  predictionAnswers: Record<string, string>;
  explorationExampleIds: Record<string, string[]>;
  productionAttempts: Record<string, string>;
};

export const PILOT_PROGRESS_KEY = 'lens:python-foundations:progress:v2';

export function emptyProgress(): PilotProgress {
  return {
    currentLessonId: 'values-and-variables',
    completedLessonIds: [],
    completedSteps: {},
    predictionAnswers: {},
    explorationExampleIds: {},
    productionAttempts: {},
  };
}

export function loadPilotProgress(): PilotProgress {
  if (typeof window === 'undefined') return emptyProgress();
  try {
    const stored = window.localStorage.getItem(PILOT_PROGRESS_KEY);
    return stored ? { ...emptyProgress(), ...JSON.parse(stored) } : emptyProgress();
  } catch {
    return emptyProgress();
  }
}

export function savePilotProgress(progress: PilotProgress): PilotProgress {
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(PILOT_PROGRESS_KEY, JSON.stringify(progress));
  }
  return progress;
}

export function resetPilotProgress(): PilotProgress {
  if (typeof window !== 'undefined') window.localStorage.removeItem(PILOT_PROGRESS_KEY);
  return emptyProgress();
}
