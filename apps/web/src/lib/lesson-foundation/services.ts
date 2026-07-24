import type {
  LensArtifacts,
  LensEngine,
  LessonComparison,
  LessonDefinitionV3,
} from '@lol/lens-contracts';
import { parseLensArgs } from '$lib/lens/input';
import type { LessonComparisonSummary } from './verification';

function finalBindings(artifacts: LensArtifacts) {
  return artifacts.trace.steps.at(-1)?.bindings ?? {};
}

export function projectLessonComparison(
  comparison: LessonComparison,
  artifacts: LensArtifacts,
): LessonComparisonSummary {
  if (comparison.kind === 'bindings') {
    const bindings = finalBindings(artifacts);
    return Object.freeze({
      kind: comparison.kind,
      values: Object.freeze(Object.fromEntries(
        comparison.fields.map((field) => [field.key, bindings[field.key] ?? '—']),
      )),
    });
  }
  if (comparison.kind === 'frames') {
    return Object.freeze({
      kind: comparison.kind,
      values: Object.freeze({ count: String(artifacts.trace.steps.length) }),
    });
  }
  if (comparison.kind === 'path') {
    const outcomes = artifacts.trace.steps
      .filter((step) => step.event.type === 'condition_eval')
      .map((step) => step.event.type === 'condition_eval' ? String(step.event.result) : '');
    const path = outcomes
      .filter((outcome, index) => index === 0 || outcome !== outcomes[index - 1])
      .join(' → ');
    return Object.freeze({ kind: comparison.kind, values: Object.freeze({ path }) });
  }
  return Object.freeze({
    kind: comparison.kind,
    values: Object.freeze({ returnValue: artifacts.trace.result?.repr ?? '—' }),
  });
}

export async function analyzeLessonProgram(
  definition: LessonDefinitionV3,
  programId: string,
  engine: LensEngine,
  argsTextOverride?: string,
): Promise<LensArtifacts> {
  const program = definition.programs.find((candidate) => candidate.id === programId);
  if (!program) throw new Error(`Unknown lesson program: ${programId}`);
  return engine.analyze({
    language: 'python',
    source: program.source,
    argsRepr: parseLensArgs(argsTextOverride ?? program.argsText),
  });
}

export function createLessonScenarioController(
  definition: LessonDefinitionV3,
  engine: LensEngine,
) {
  return {
    async run(scenarioId: string) {
      const scenario = definition.scenarios.find((candidate) => candidate.id === scenarioId);
      if (!scenario) throw new Error(`Unknown lesson scenario: ${scenarioId}`);
      return analyzeLessonProgram(
        definition,
        scenario.programId,
        engine,
        scenario.argsText,
      );
    },
  };
}
