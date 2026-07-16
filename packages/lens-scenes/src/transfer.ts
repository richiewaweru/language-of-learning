import type { SemanticGraph, GraphNode } from './types.js';

export type TransferCheck = {
  id: string;
  prompt: string;
  /** Expected 1-based line number */
  answerLine: number;
  nodeId: string;
  kind: string;
};

function pickNode(graph: SemanticGraph): GraphNode | undefined {
  const preferred = [
    ...graph.nodes.filter((n) => n.kind === 'binding' && n.role === 'state'),
    ...graph.nodes.filter((n) => n.kind === 'loop'),
    ...graph.nodes.filter((n) => n.kind === 'branch'),
    ...graph.nodes.filter((n) => n.kind === 'return'),
    ...graph.nodes.filter((n) => n.kind === 'function'),
  ];
  return preferred[0] ?? graph.nodes[0];
}

/** Deterministic transfer check: "which line is X?" from the graph (no LLM). */
export function buildTransferCheck(graph: SemanticGraph): TransferCheck | null {
  const node = pickNode(graph);
  if (!node) return null;

  let subject: string;
  if (node.kind === 'binding') {
    subject = `the binding \`${node.name}\``;
  } else if (node.kind === 'loop') {
    subject = `the loop over \`${node.iteratorName}\``;
  } else if (node.kind === 'branch') {
    subject = `the branch \`${node.conditionExpr ?? node.id}\``;
  } else if (node.kind === 'function') {
    subject = `the function \`${node.name}\``;
  } else if (node.kind === 'return') {
    subject = `the return at \`${node.id}\``;
  } else {
    subject = `the ${node.kind} \`${node.id}\``;
  }

  return {
    id: `transfer-${node.id}`,
    prompt: `Which line contains ${subject}?`,
    answerLine: node.sourceRange.startLine,
    nodeId: node.id,
    kind: node.kind,
  };
}

export function gradeTransferCheck(check: TransferCheck, answer: number): {
  correct: boolean;
  expected: number;
  feedback: string;
} {
  const correct = answer === check.answerLine;
  return {
    correct,
    expected: check.answerLine,
    feedback: correct
      ? `Correct — line ${check.answerLine}.`
      : `Not quite. ${check.prompt.replace(/\?$/, '')} is on line ${check.answerLine}.`,
  };
}
