/** Pure helpers for renderer truth (F4) — unit-tested without mounting Svelte. */

export type TraceStepLike = {
  event: { type: string; itemIndex?: number; repr?: string; [key: string]: unknown };
};

export type SceneStepLike = {
  actions: Array<{ type: string; repr?: string; itemIndex?: number; [key: string]: unknown }>;
};

export function loopItemCountFromTrace(
  steps: TraceStepLike[],
  fallbackCollectionLength = 0,
): number {
  let maxIndex = -1;
  for (const step of steps) {
    if (step.event?.type === 'loop_advance' && typeof step.event.itemIndex === 'number') {
      maxIndex = Math.max(maxIndex, step.event.itemIndex);
    }
  }
  if (maxIndex >= 0) return maxIndex + 1;
  return fallbackCollectionLength;
}

export function returnReprFromScene(
  sceneSteps: SceneStepLike[],
  stepIndex: number,
  fallbackResultRepr = '',
): string {
  for (let i = stepIndex; i >= 0; i--) {
    for (const a of sceneSteps[i]?.actions ?? []) {
      if (a.type === 'exit_return' && typeof a.repr === 'string') return a.repr;
    }
  }
  return fallbackResultRepr;
}
