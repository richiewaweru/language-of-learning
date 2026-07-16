import type { PatternHit } from '@lol/lens-contracts';

export type GraphNode = {
  id: string;
  kind: string;
  name?: string;
  role?: string;
  expr?: string;
  iteratorName?: string;
  collectionRef?: string;
  body?: string;
  trueBody?: string;
  falseBody?: string;
  targetRef?: string;
  mutationType?: string;
  valueRef?: string;
  params?: string[];
  sourceRange?: {
    startLine: number;
    startCol: number;
    endLine: number;
    endCol: number;
  };
};

export type GraphRelation = {
  from: string;
  type: string;
  to: string;
};

export type SemanticGraph = {
  version: string;
  source: string;
  nodes: GraphNode[];
  relations: GraphRelation[];
  unsupported: unknown[];
};

export type PatternId = PatternHit['pattern'];

export type DetectResult = PatternHit | null;
