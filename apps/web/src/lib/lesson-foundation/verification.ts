import type {
  LensArtifacts,
  LessonDefinitionV3,
  LessonVerification,
  SemanticGraph,
} from '@lol/lens-contracts';

export type LessonComparisonSummary = Readonly<{
  kind: 'bindings' | 'frames' | 'path' | 'return-value';
  values: Readonly<Record<string, string>>;
}>;

export type LessonVerificationContext = {
  source: string;
  artifacts: LensArtifacts | null;
  response?: string;
  baselineSummary?: LessonComparisonSummary;
  scenarioArtifacts?: readonly LensArtifacts[];
};

export type LessonVerificationResult = {
  id: string;
  correct: boolean;
  feedback: string;
  evidence: Record<string, unknown>;
};

function result(
  verification: LessonVerification,
  correct: boolean,
  feedback: string,
  evidence: Record<string, unknown> = {},
): LessonVerificationResult {
  return { id: verification.id, correct, feedback, evidence };
}

function supported(context: LessonVerificationContext) {
  const artifacts = context.artifacts;
  return Boolean(
    artifacts
      && !artifacts.violation
      && artifacts.graph.unsupported.length === 0
      && !artifacts.trace.violation
      && !artifacts.trace.truncated
      && artifacts.trace.steps.length > 0,
  );
}

function finalBindings(context: LessonVerificationContext) {
  return context.artifacts?.trace.steps.at(-1)?.bindings ?? {};
}

function nodeByName(graph: SemanticGraph, name: string) {
  return graph.nodes.find((node) => 'name' in node && node.name === name);
}

function dependenciesFor(graph: SemanticGraph, targetName: string) {
  const target = nodeByName(graph, targetName);
  if (!target) return [];
  if (target.kind === 'binding' && target.role === 'iterator') {
    const loop = graph.nodes.find(
      (node) => node.kind === 'loop' && node.iteratorName === target.name,
    );
    const collection = loop && graph.nodes.find((node) => node.id === loop.collectionRef);
    if (collection && 'name' in collection && typeof collection.name === 'string') {
      return [collection.name];
    }
  }
  const writers = graph.relations
    .filter((relation) => relation.type === 'writes' && relation.to === target.id)
    .map((relation) => relation.from);
  return graph.relations
    .filter((relation) => relation.type === 'reads' && writers.includes(relation.from))
    .map((relation) => graph.nodes.find((node) => node.id === relation.to))
    .filter((node): node is NonNullable<typeof node> => Boolean(node))
    .flatMap((node) => 'name' in node && typeof node.name === 'string' ? [node.name] : []);
}

function transitiveDependencies(graph: SemanticGraph, targetName: string, seen = new Set<string>()): Set<string> {
  if (seen.has(targetName)) return seen;
  seen.add(targetName);
  for (const dependency of dependenciesFor(graph, targetName)) {
    transitiveDependencies(graph, dependency, seen);
  }
  return seen;
}

function dependenciesFromNode(
  graph: SemanticGraph,
  nodeId: string,
  seen = new Set<string>(),
): Set<string> {
  if (seen.has(nodeId)) return new Set();
  seen.add(nodeId);
  const node = graph.nodes.find((candidate) => candidate.id === nodeId);
  if (node?.kind === 'binding') {
    return transitiveDependencies(graph, node.name);
  }
  const dependencies = new Set<string>();
  for (const relation of graph.relations.filter(
    (candidate) => candidate.from === nodeId && candidate.type === 'reads',
  )) {
    const read = graph.nodes.find((candidate) => candidate.id === relation.to);
    if (read?.kind === 'binding') {
      dependencies.add(read.name);
      for (const dependency of transitiveDependencies(graph, read.name)) {
        dependencies.add(dependency);
      }
    }
  }
  return dependencies;
}

function containsNode(graph: SemanticGraph, containerId: string | undefined, targetId: string) {
  if (!containerId) return false;
  if (containerId === targetId) return true;
  const children = graph.relations
    .filter((relation) => relation.type === 'contains' && relation.from === containerId)
    .map((relation) => relation.to);
  return children.some((child) => containsNode(graph, child, targetId));
}

function verifyOne(
  verification: LessonVerification,
  context: LessonVerificationContext,
): LessonVerificationResult {
  const graph = context.artifacts?.graph;
  const trace = context.artifacts?.trace;

  if (verification.type === 'supported-execution') {
    const correct = supported(context);
    return result(
      verification,
      correct,
      correct ? 'The program executes with supported Python.' : 'Use supported Python that executes successfully.',
      { supported: correct },
    );
  }

  if (!graph || !trace || !supported(context)) {
    return result(
      verification,
      false,
      'Lens could not collect enough supported semantic evidence for this check.',
      { artifactsAvailable: Boolean(context.artifacts) },
    );
  }

  if (verification.type === 'execution-values' || verification.type === 'binding-values') {
    const bindings = finalBindings(context);
    const expected = Object.fromEntries(
      Object.entries(verification.expectedBindings).map(([key, value]) => [key, String(value)]),
    );
    const missing = Object.entries(expected)
      .filter(([key, value]) => bindings[key] !== value)
      .map(([key]) => key);
    return result(
      verification,
      missing.length === 0,
      missing.length === 0
        ? 'The final stored values match the lesson definition.'
        : `Check the final value${missing.length === 1 ? '' : 's'} for ${missing.join(', ')}.`,
      { expected, actual: bindings, mismatches: missing },
    );
  }

  if (verification.type === 'assignment-count' || verification.type === 'program-shape') {
    const assignments = graph.nodes.filter(
      (node) => node.kind === 'binding' && node.role !== 'parameter' && node.role !== 'iterator',
    );
    const expected = verification.type === 'assignment-count'
      ? verification.expected
      : verification.requiredAssignments;
    const derivedTargets = verification.type === 'program-shape'
      ? verification.derivedTargets
      : [];
    const missingTargets = derivedTargets.filter((name) => !nodeByName(graph, name));
    const correct = assignments.length === expected && missingTargets.length === 0;
    return result(
      verification,
      correct,
      correct
        ? `Lens found the required ${expected} assignments.`
        : `Use ${expected} assignments${missingTargets.length ? ` including ${missingTargets.join(', ')}` : ''}; Lens found ${assignments.length}.`,
      { expected, actual: assignments.length, missingTargets },
    );
  }

  if (verification.type === 'assignment-dependencies') {
    const missing = Object.entries(verification.requiredDependencies).flatMap(([target, required]) => {
      const dependencies = transitiveDependencies(graph, target);
      return required
        .filter((name) => !dependencies.has(name))
        .map((name) => `${target} ← ${name}`);
    });
    return result(
      verification,
      missing.length === 0,
      missing.length === 0
        ? 'The required assignment dependencies are present.'
        : `Add the missing dependenc${missing.length === 1 ? 'y' : 'ies'}: ${missing.join(', ')}.`,
      { missing },
    );
  }

  if (verification.type === 'function-shape') {
    const functions = graph.nodes.filter((node) => node.kind === 'function');
    const fn = verification.functionName
      ? functions.find((node) => node.name === verification.functionName)
      : functions[0];
    const invoked = fn
      ? graph.relations.some((relation) => relation.type === 'invokes' && relation.to === fn.id)
      : false;
    const correct = Boolean(
      fn
      && fn.params.length === verification.parameterCount
      && (!verification.requireModuleCall || invoked),
    );
    return result(
      verification,
      correct,
      correct
        ? 'The function has the required parameter shape and is called by the program.'
        : `Define ${verification.functionName ?? 'a function'} with ${verification.parameterCount} parameter${verification.parameterCount === 1 ? '' : 's'}${verification.requireModuleCall ? ' and call it from the program' : ''}.`,
      { functionName: fn?.name, parameterCount: fn?.params.length, invoked },
    );
  }

  if (verification.type === 'return-dependency') {
    const returnEvidence = graph.nodes
      .filter((node) => node.kind === 'return')
      .map((node) => ({
        id: node.id,
        dependencies: dependenciesFromNode(graph, node.valueRef),
      }));
    const passingReturn = returnEvidence.find(({ dependencies }) =>
      verification.parameterNames.every((name) => dependencies.has(name)));
    const dependencies = passingReturn?.dependencies ?? returnEvidence[0]?.dependencies ?? new Set<string>();
    const missing = verification.parameterNames.filter((name) => !dependencies.has(name));
    const correct = Boolean(passingReturn);
    return result(
      verification,
      correct,
      correct
        ? 'The returned result depends on the required parameter.'
        : `Return a value that depends on ${missing.join(', ') || verification.parameterNames.join(', ')}.`,
      { returnNode: passingReturn?.id, dependencies: [...dependencies], missing },
    );
  }

  if (verification.type === 'branch-shape') {
    const branch = graph.nodes.find((node) => node.kind === 'branch');
    const resultNode = verification.resultBinding
      ? nodeByName(graph, verification.resultBinding)
      : undefined;
    const branchWritesResult = !resultNode || Boolean(
      branch
      && containsNode(graph, branch.trueBody, resultNode.id)
      && (!verification.requireElse || containsNode(graph, branch.falseBody, resultNode.id)),
    );
    const correct = Boolean(
      branch
      && (!verification.requireElse || branch.falseBody)
      && branch.conditionExpr.trim()
      && branchWritesResult,
    );
    return result(
      verification,
      correct,
      correct
        ? 'The program contains a supported decision with the required branches.'
        : 'Use a supported Boolean if/else decision that assigns the result.',
      { condition: branch?.conditionExpr, hasElse: Boolean(branch?.falseBody), branchWritesResult },
    );
  }

  if (verification.type === 'branch-coverage') {
    const artifacts = [context.artifacts, ...(context.scenarioArtifacts ?? [])];
    const outcomes = new Set(
      artifacts.flatMap((item) =>
        item.trace.steps
          .filter((step) => step.event.type === 'condition_eval')
          .map((step) => step.event.type === 'condition_eval' && step.event.result),
      ),
    );
    const missing = verification.expectedOutcomes.filter((expected) => !outcomes.has(expected));
    return result(
      verification,
      missing.length === 0,
      missing.length === 0
        ? 'The configured scenarios exercise the required decision paths.'
        : 'Run deterministic scenarios that exercise both decision paths.',
      { outcomes: [...outcomes], missing },
    );
  }

  if (verification.type === 'loop-shape') {
    const loop = graph.nodes.find(
      (node) => node.kind === 'loop' && node.iteratorName === verification.iterator,
    );
    const accumulator = nodeByName(graph, verification.accumulator);
    const updateInsideLoop = Boolean(
      loop
      && accumulator
      && graph.relations.some(
        (relation) =>
          relation.type === 'writes'
          && relation.to === accumulator.id
          && containsNode(graph, loop.id, relation.from),
      ),
    );
    const initializedBefore = Boolean(
      loop
      && accumulator
      && accumulator.sourceRange.startLine < loop.sourceRange.startLine,
    );
    const correct = Boolean(loop && accumulator && initializedBefore && updateInsideLoop);
    return result(
      verification,
      correct,
      correct
        ? 'The loop and accumulator have the required structure.'
        : `Initialize ${verification.accumulator} before the loop and update it inside the loop using ${verification.iterator}.`,
      { loop: loop?.id, initializedBefore, updateInsideLoop },
    );
  }

  if (verification.type === 'loop-iterations') {
    const actual = trace.steps.filter((step) => step.event.type === 'loop_advance').length;
    return result(
      verification,
      actual === verification.expected,
      actual === verification.expected
        ? `The loop runs ${actual} times as expected.`
        : `Expected ${verification.expected} loop iterations; Lens observed ${actual}.`,
      { expected: verification.expected, actual },
    );
  }

  const dependencies = transitiveDependencies(graph, verification.accumulator);
  const correct = dependencies.has(verification.iterator);
  return result(
    verification,
    correct,
    correct
      ? `The ${verification.accumulator} update depends on ${verification.iterator}.`
      : `Update ${verification.accumulator} using the current ${verification.iterator}.`,
    { dependencies: [...dependencies] },
  );
}

export function runLessonVerifications(
  definition: LessonDefinitionV3,
  verificationIds: readonly string[],
  context: LessonVerificationContext,
): LessonVerificationResult[] {
  return verificationIds.map((id) => {
    const verification = definition.verifications.find((candidate) => candidate.id === id);
    return verification
      ? verifyOne(verification, context)
      : { id, correct: false, feedback: `Unknown lesson verification: ${id}.`, evidence: {} };
  });
}
