import {
  buildScene,
  buildTransferCheck,
  normalizeSemanticScene,
  type SemanticGraph as SceneSemanticGraph,
  type Trace as SceneTrace,
} from '@lol/lens-scenes';
import { detectPattern } from '@lol/lens-patterns';
import type {
  LensArtifacts,
  LensEngine,
  LensViolation,
  SemanticGraph,
  Trace,
} from '@lol/lens-contracts';
import { analyzeSource, type AnalyzeResponse } from '$lib/api';

export type AnalyzeSource = (
  source: string,
  argsRepr: string[],
) => Promise<AnalyzeResponse>;

export function buildLensArtifacts(input: {
  graph: SceneSemanticGraph;
  trace: SceneTrace;
  violation?: LensViolation | null;
  scene?: ReturnType<typeof buildScene> | null;
  semanticScene?: ReturnType<typeof normalizeSemanticScene> | null;
}): LensArtifacts {
  const violation = input.violation ?? null;
  const verified = !violation && input.trace.steps.length > 0;
  const graph = input.graph as SemanticGraph;
  const trace = input.trace as Trace;

  return {
    graph,
    trace,
    violation,
    diagnostics: violation
      ? [{
          code: violation.code ?? violation.construct,
          message: violation.message,
          severity: 'error',
        }]
      : [],
    pattern: detectPattern(input.graph),
    scene: verified ? (input.scene ?? buildScene(input.graph, input.trace)) : null,
    semanticScene: verified
      ? (input.semanticScene ?? normalizeSemanticScene(input.graph, input.trace))
      : null,
    transfer: buildTransferCheck(input.graph),
  };
}

export function createLensEngine(analyze: AnalyzeSource = analyzeSource): LensEngine {
  return {
    async analyze(request) {
      if (request.language !== 'python') {
        throw new Error(`Unsupported Lens language: ${request.language}`);
      }
      const result = await analyze(request.source, request.argsRepr);
      return buildLensArtifacts({
        graph: result.graph,
        trace: result.trace,
        violation: result.violation,
      });
    },
  };
}
