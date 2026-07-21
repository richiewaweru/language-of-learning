export { layoutGraph, assertNoOverlap, LayoutError, GRID, MAX_NESTING } from './layout.js';
export {
  buildSceneActions,
  buildSceneSteps,
  renderCaption,
  CAPTION_TEMPLATES,
} from './scene-builder.js';
export { resolveSelection, pickPrimary } from './selection.js';
export { buildScene } from './build-scene.js';
export { deriveMotionState, emptyMotionState, reduceSceneActions } from './motion-state.js';
export { buildTransferCheck, gradeTransferCheck } from './transfer.js';
export { deriveStepLabel, deriveLearnerCaption } from './learner-labels.js';
export { resolveTruthDetail } from './truth-detail.js';
export type { TruthDetail } from './truth-detail.js';
export type { TransferCheck } from './transfer.js';
export type {
  SemanticGraph,
  Trace,
  TraceStep,
  LayoutResult,
  GraphNode,
} from './types.js';

