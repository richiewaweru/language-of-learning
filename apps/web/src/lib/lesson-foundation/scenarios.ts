import type {
  LensArtifacts,
  LensEngine,
  LessonScenarioV4,
  ScenarioResult,
  SemanticGraph,
  SourceRange,
} from '@lol/lens-contracts';

type ScenarioRole = keyof LessonScenarioV4['expectedRoleValues'];

export async function hashSource(source: string): Promise<string> {
  const bytes = new TextEncoder().encode(source);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return [...new Uint8Array(digest)]
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

function sourceOffsets(source: string) {
  const starts = [0];
  for (let index = 0; index < source.length; index += 1) {
    if (source[index] === '\n') starts.push(index + 1);
  }
  return starts;
}

function rangeOffsets(source: string, range: SourceRange): [number, number] {
  const starts = sourceOffsets(source);
  const start = starts[range.startLine - 1];
  const end = starts[range.endLine - 1];
  if (start === undefined || end === undefined) {
    throw new Error('Semantic source range is outside the submitted source.');
  }
  return [start + range.startCol, end + range.endCol];
}

function replaceRange(
  source: string,
  start: number,
  end: number,
  replacement: string,
) {
  if (start < 0 || end < start || end > source.length) {
    throw new Error('Semantic source range is invalid.');
  }
  return `${source.slice(0, start)}${replacement}${source.slice(end)}`;
}

function assignmentValueRange(statement: string): [number, number] {
  let quote: "'" | '"' | null = null;
  let escaped = false;
  let depth = 0;
  let assignment = -1;
  for (let index = 0; index < statement.length; index += 1) {
    const character = statement[index];
    if (quote) {
      if (escaped) escaped = false;
      else if (character === '\\') escaped = true;
      else if (character === quote) quote = null;
      continue;
    }
    if (character === "'" || character === '"') {
      quote = character;
      continue;
    }
    if (character === '#') break;
    if (character === '(' || character === '[' || character === '{') depth += 1;
    else if (character === ')' || character === ']' || character === '}') depth -= 1;
    else if (
      character === '='
      && depth === 0
      && statement[index - 1] !== '<'
      && statement[index - 1] !== '>'
      && statement[index - 1] !== '!'
      && statement[index - 1] !== '='
      && statement[index + 1] !== '='
    ) {
      if (assignment !== -1) throw new Error('The selected assignment target is ambiguous.');
      assignment = index;
    }
  }
  if (assignment === -1) throw new Error('The selected semantic node is not an assignment.');
  let start = assignment + 1;
  while (start < statement.length && /\s/.test(statement[start])) start += 1;
  let end = statement.length;
  while (end > start && /\s/.test(statement[end - 1])) end -= 1;
  if (start === end) throw new Error('The selected assignment has no value expression.');
  return [start, end];
}

function callArgumentsRange(callSource: string): [number, number] {
  let quote: "'" | '"' | null = null;
  let escaped = false;
  let open = -1;
  let depth = 0;
  for (let index = 0; index < callSource.length; index += 1) {
    const character = callSource[index];
    if (quote) {
      if (escaped) escaped = false;
      else if (character === '\\') escaped = true;
      else if (character === quote) quote = null;
      continue;
    }
    if (character === "'" || character === '"') {
      quote = character;
      continue;
    }
    if (character === '(') {
      if (open === -1) open = index;
      depth += 1;
    } else if (character === ')') {
      depth -= 1;
      if (depth === 0 && open !== -1) return [open + 1, index];
      if (depth < 0) break;
    }
  }
  throw new Error('The selected call has an invalid argument range.');
}

function moduleContains(graph: SemanticGraph, nodeId: string) {
  const module = graph.nodes.find((node) => node.kind === 'module');
  return Boolean(module && graph.relations.some(
    (relation) =>
      relation.type === 'contains'
      && relation.from === module.id
      && relation.to === nodeId,
  ));
}

function descendants(graph: SemanticGraph, nodeId: string, seen = new Set<string>()): Set<string> {
  if (seen.has(nodeId)) return seen;
  seen.add(nodeId);
  for (const relation of graph.relations) {
    if (relation.type === 'contains' && relation.from === nodeId) {
      descendants(graph, relation.to, seen);
    }
  }
  return seen;
}

function exactlyOne<T>(items: readonly T[], label: string): T {
  if (items.length === 0) throw new Error(`No ${label} was found.`);
  if (items.length > 1) throw new Error(`The ${label} is ambiguous (${items.length} matches).`);
  return items[0];
}

function startingBinding(graph: SemanticGraph) {
  const constants = graph.nodes.filter(
    (node) => node.kind === 'binding' && node.role === 'constant' && moduleContains(graph, node.id),
  );
  const conditionReads = new Set(
    graph.nodes
      .filter((node) => node.kind === 'branch')
      .flatMap((branch) =>
        graph.relations
          .filter((relation) =>
            relation.type === 'contains'
            && relation.from === branch.id)
          .map((relation) => graph.nodes.find((node) => node.id === relation.to))
          .filter((node) =>
            node?.kind === 'operation'
            && node.sourceRange.startLine === branch.sourceRange.startLine)
          .flatMap((operation) =>
            graph.relations
              .filter((relation) =>
                relation.type === 'reads'
                && relation.from === operation?.id)
              .map((relation) => relation.to)),
      ),
  );
  const semanticInputs = constants.filter((node) => conditionReads.has(node.id));
  if (semanticInputs.length) return exactlyOne(semanticInputs, 'starting binding used by the decision');
  return constants.sort(
    (left, right) =>
      left.sourceRange.startLine - right.sourceRange.startLine
      || left.sourceRange.startCol - right.sourceRange.startCol,
  )[0] ?? (() => {
    throw new Error('No starting binding was found.');
  })();
}

function collectionBinding(graph: SemanticGraph) {
  const iteratedIds = new Set(
    graph.nodes
      .filter((node) => node.kind === 'loop')
      .map((loop) => loop.collectionRef),
  );
  return exactlyOne(
    graph.nodes.filter((node) => node.kind === 'collection' && iteratedIds.has(node.id)),
    'collection binding used by the loop',
  );
}

function moduleFunctionCall(graph: SemanticGraph) {
  const firstFunction = graph.nodes
    .filter((node) => node.kind === 'function')
    .sort(
      (left, right) =>
        left.sourceRange.startLine - right.sourceRange.startLine
        || left.sourceRange.startCol - right.sourceRange.startCol,
    )[0];
  if (!firstFunction) throw new Error('No function definition was found.');
  const invokedBy = new Set(
    graph.relations
      .filter((relation) => relation.type === 'invokes' && relation.to === firstFunction.id)
      .map((relation) => relation.from),
  );
  return exactlyOne(
    graph.nodes.filter(
      (node) => node.kind === 'call' && invokedBy.has(node.id) && moduleContains(graph, node.id),
    ),
    'module call for the selected function',
  );
}

export function sourceForScenario(
  source: string,
  scenario: LessonScenarioV4,
  graph: SemanticGraph,
): string {
  if (graph.source !== source) {
    throw new Error('Scenario evidence does not match the submitted source.');
  }
  if (scenario.strategy.type === 'supply-function-arguments') {
    const call = moduleFunctionCall(graph);
    const [nodeStart, nodeEnd] = rangeOffsets(source, call.sourceRange);
    const callSource = source.slice(nodeStart, nodeEnd);
    const [argumentStart, argumentEnd] = callArgumentsRange(callSource);
    return replaceRange(
      source,
      nodeStart + argumentStart,
      nodeStart + argumentEnd,
      scenario.strategy.argumentsSource.join(', '),
    );
  }

  const target = scenario.strategy.type === 'replace-list-literal'
    ? collectionBinding(graph)
    : startingBinding(graph);
  const [nodeStart, nodeEnd] = rangeOffsets(source, target.sourceRange);
  const statement = source.slice(nodeStart, nodeEnd);
  const [valueStart, valueEnd] = assignmentValueRange(statement);
  return replaceRange(
    source,
    nodeStart + valueStart,
    nodeStart + valueEnd,
    scenario.strategy.valueSource,
  );
}

function roleBindingName(artifacts: LensArtifacts, role: ScenarioRole): string {
  const graph = artifacts.graph;
  if (role === 'module-result') {
    const call = moduleFunctionCall(graph);
    const targets = graph.relations
      .filter((relation) => relation.type === 'writes' && relation.from === call.id)
      .map((relation) => graph.nodes.find((node) => node.id === relation.to))
      .filter((node): node is Extract<SemanticGraph['nodes'][number], { kind: 'binding' }> =>
        node?.kind === 'binding');
    return exactlyOne(targets, 'module result binding').name;
  }

  if (role === 'branch-result') {
    const branch = exactlyOne(
      graph.nodes.filter((node) => node.kind === 'branch'),
      'branch',
    );
    if (!branch.falseBody) throw new Error('The selected branch has no else result.');
    const trueNodes = descendants(graph, branch.trueBody);
    const falseNodes = descendants(graph, branch.falseBody);
    const targets = graph.nodes.filter(
      (node) =>
        node.kind === 'binding'
        && trueNodes.has(node.id)
        && falseNodes.has(node.id),
    );
    return exactlyOne(targets, 'branch result binding').name;
  }

  if (role === 'accumulator') {
    const loop = exactlyOne(graph.nodes.filter((node) => node.kind === 'loop'), 'loop');
    const loopNodes = descendants(graph, loop.id);
    const targets = graph.nodes.filter((node) => {
      if (node.kind !== 'binding' || node.role === 'iterator') return false;
      return graph.relations.some((write) =>
        write.type === 'writes'
        && write.to === node.id
        && loopNodes.has(write.from)
        && graph.relations.some((read) =>
          read.type === 'reads'
          && read.from === write.from
          && read.to === node.id));
    });
    return exactlyOne(targets, 'loop accumulator binding').name;
  }

  const targets = graph.nodes.filter((node) => {
    if (node.kind !== 'binding' || !moduleContains(graph, node.id)) return false;
    return graph.relations.some((write) =>
      write.type === 'writes'
      && write.to === node.id
      && graph.relations.some((read) =>
        read.type === 'reads'
        && read.from === write.from));
  });
  return exactlyOne(targets, 'derived binding').name;
}

export function resolveScenarioRoleValue(
  artifacts: LensArtifacts,
  role: ScenarioRole,
): { bindingName: string; value: string } {
  const bindingName = roleBindingName(artifacts, role);
  const bindings = artifacts.trace.steps.at(-1)?.bindings ?? {};
  if (!(bindingName in bindings)) {
    throw new Error(`The ${role} binding ${bindingName} has no final runtime value.`);
  }
  return { bindingName, value: bindings[bindingName] };
}

function scenarioMismatch(
  scenario: LessonScenarioV4,
  artifacts: LensArtifacts,
): string | null {
  const bindings = artifacts.trace.steps.at(-1)?.bindings ?? {};
  for (const [name, value] of Object.entries(scenario.expectedBindings)) {
    if (bindings[name] !== value) return `Binding ${name} did not satisfy the required outcome.`;
  }
  for (const [role, expected] of Object.entries(scenario.expectedRoleValues)) {
    try {
      const resolved = resolveScenarioRoleValue(artifacts, role as ScenarioRole);
      if (resolved.value !== expected) {
        return `${role} (${resolved.bindingName}) did not satisfy the required outcome.`;
      }
    } catch (error) {
      return error instanceof Error ? error.message : String(error);
    }
  }
  if (scenario.expectedBranchOutcome !== undefined) {
    const outcomes = artifacts.trace.steps.flatMap((step) =>
      step.event.type === 'condition_eval' ? [step.event.result] : []);
    if (!outcomes.includes(scenario.expectedBranchOutcome)) {
      return 'The scenario did not exercise the required decision path.';
    }
  }
  return null;
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

export async function runScenariosAgainstSource(input: {
  source: string;
  sourceHash: string;
  scenarios: readonly LessonScenarioV4[];
  engine: LensEngine;
  baseArtifacts?: LensArtifacts | null;
}): Promise<ScenarioResult[]> {
  let baseArtifacts = input.baseArtifacts;
  if (!baseArtifacts) {
    baseArtifacts = await input.engine.analyze({
      language: 'python',
      source: input.source,
      argsRepr: [],
    });
  }
  if (!artifactsAreSupported(baseArtifacts) || baseArtifacts.graph.source !== input.source) {
    return input.scenarios.map((scenario) => ({
      scenarioId: scenario.id,
      sourceHash: input.sourceHash,
      artifacts: null,
      error: 'Submitted source did not produce supported semantic targeting evidence.',
    }));
  }

  return Promise.all(input.scenarios.map(async (scenario): Promise<ScenarioResult> => {
    try {
      const scenarioSource = sourceForScenario(input.source, scenario, baseArtifacts.graph);
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
      const mismatch = scenarioMismatch(scenario, artifacts);
      if (mismatch) {
        return {
          scenarioId: scenario.id,
          sourceHash: input.sourceHash,
          artifacts,
          error: mismatch,
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
