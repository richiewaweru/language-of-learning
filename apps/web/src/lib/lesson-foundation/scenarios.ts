import type {
  LensArtifacts,
  LensEngine,
  LessonScenarioV4,
  ScenarioResult,
} from '@lol/lens-contracts';

export async function hashSource(source: string): Promise<string> {
  const bytes = new TextEncoder().encode(source);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return [...new Uint8Array(digest)]
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

function replaceFirstAssignment(source: string, valueSource: string, requireList: boolean) {
  const matcher = requireList
    ? /^([A-Za-z_]\w*\s*=\s*)\[[^\r\n]*\]/m
    : /^([A-Za-z_]\w*\s*=\s*)([^\r\n]+)/m;
  if (!matcher.test(source)) throw new Error('No designated input binding was found.');
  return source.replace(matcher, `$1${valueSource}`);
}

function replaceFirstFunctionCall(source: string, argumentsSource: readonly string[]) {
  const functionName = source.match(/^\s*def\s+([A-Za-z_]\w*)\s*\(/m)?.[1];
  if (!functionName) throw new Error('No function definition was found.');
  const matcher = new RegExp(`(${functionName}\\s*\\()([^\\r\\n)]*)(\\))`, 'g');
  const matches = [...source.matchAll(matcher)];
  const call = matches.at(-1);
  if (!call || call.index === undefined) throw new Error('No module function call was found.');
  return `${source.slice(0, call.index)}${call[1]}${argumentsSource.join(', ')}${call[3]}${
    source.slice(call.index + call[0].length)
  }`;
}

export function sourceForScenario(source: string, scenario: LessonScenarioV4): string {
  if (scenario.strategy.type === 'replace-input-binding') {
    return replaceFirstAssignment(source, scenario.strategy.valueSource, false);
  }
  if (scenario.strategy.type === 'replace-list-literal') {
    return replaceFirstAssignment(source, scenario.strategy.valueSource, true);
  }
  return replaceFirstFunctionCall(source, scenario.strategy.argumentsSource);
}

export function artifactsAreSupported(artifacts: LensArtifacts | null): artifacts is LensArtifacts {
  return Boolean(
    artifacts
    && !artifacts.violation
    && artifacts.graph.unsupported.length === 0
    && !artifacts.trace.violation
    && !artifacts.trace.truncated
    && artifacts.trace.steps.length > 0,
  );
}

function scenarioMatches(scenario: LessonScenarioV4, artifacts: LensArtifacts) {
  const bindings = artifacts.trace.steps.at(-1)?.bindings ?? {};
  if (Object.entries(scenario.expectedBindings).some(([name, value]) => bindings[name] !== value)) {
    return false;
  }
  if (Object.values(scenario.expectedRoleValues).some(
    (expected) => !Object.values(bindings).includes(expected),
  )) {
    return false;
  }
  if (scenario.expectedBranchOutcome !== undefined) {
    const outcomes = artifacts.trace.steps.flatMap((step) =>
      step.event.type === 'condition_eval' ? [step.event.result] : []);
    if (!outcomes.includes(scenario.expectedBranchOutcome)) return false;
  }
  return true;
}

export async function runScenariosAgainstSource(input: {
  source: string;
  sourceHash: string;
  scenarios: readonly LessonScenarioV4[];
  engine: LensEngine;
}): Promise<ScenarioResult[]> {
  return Promise.all(input.scenarios.map(async (scenario): Promise<ScenarioResult> => {
    try {
      const scenarioSource = sourceForScenario(input.source, scenario);
      const artifacts = await input.engine.analyze({
        language: 'python',
        source: scenarioSource,
        argsRepr: [],
      });
      if (!artifactsAreSupported(artifacts)) {
        return {
          scenarioId: scenario.id,
          sourceHash: input.sourceHash,
          artifacts,
          error: 'Scenario did not produce supported Lens evidence.',
        };
      }
      if (!scenarioMatches(scenario, artifacts)) {
        return {
          scenarioId: scenario.id,
          sourceHash: input.sourceHash,
          artifacts,
          error: 'Scenario result did not satisfy the required outcome.',
        };
      }
      return { scenarioId: scenario.id, sourceHash: input.sourceHash, artifacts };
    } catch (error) {
      return {
        scenarioId: scenario.id,
        sourceHash: input.sourceHash,
        artifacts: null,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }));
}
