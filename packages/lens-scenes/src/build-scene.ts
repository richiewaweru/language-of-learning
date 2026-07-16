import type { Scene } from '@lol/lens-contracts';
import { layoutGraph } from './layout.js';
import { buildSceneSteps } from './scene-builder.js';
import type { SemanticGraph, Trace } from './types.js';

export function buildScene(
  graph: SemanticGraph,
  trace: Trace,
  options: { sceneId?: string; graphRef?: string } = {},
): Scene {
  const { layout } = layoutGraph(graph);
  const steps = buildSceneSteps(graph, trace);
  return {
    id: options.sceneId ?? `scene-${trace.call.functionId}`,
    graphRef: options.graphRef ?? graph.version,
    layout,
    steps,
  };
}
