export { layoutGraph, assertNoOverlap, LayoutError, GRID, MAX_NESTING } from './layout.js';
export {
  buildSceneActions,
  buildSceneSteps,
  renderCaption,
  CAPTION_TEMPLATES,
} from './scene-builder.js';
export { resolveSelection, pickPrimary } from './selection.js';
export { buildScene } from './build-scene.js';
export type {
  SemanticGraph,
  Trace,
  TraceStep,
  LayoutResult,
  GraphNode,
} from './types.js';
