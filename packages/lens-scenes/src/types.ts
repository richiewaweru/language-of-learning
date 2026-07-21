import type { LayoutNode, Scene, SceneAction, SceneStep } from '@lol/lens-contracts';
import type { Selection } from '@lol/lens-contracts';

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
  conditionExpr?: string;
  targetRef?: string;
  mutationType?: string;
  valueRef?: string;
  params?: string[];
  repr?: string;
  items?: string[];
  sourceRange: {
    startLine: number;
    startCol: number;
    endLine: number;
    endCol: number;
  };
};

export type GraphRelation = { from: string; type: string; to: string };

export type SemanticGraph = {
  version: string;
  source: string;
  nodes: GraphNode[];
  relations: GraphRelation[];
  unsupported: unknown[];
};

export type TraceEvent =
  | { type: 'call_enter'; functionId: string }
  | { type: 'bind_param'; name: string; repr: string }
  | { type: 'state_init'; binding: string; repr: string }
  | { type: 'loop_advance'; loop: string; itemIndex: number; itemRepr: string }
  | { type: 'condition_eval'; branch: string; result: boolean }
  | { type: 'state_change'; binding: string; oldRepr: string; newRepr: string }
  | { type: 'collection_append'; collection: string; valueRepr: string }
  | { type: 'indexed_selection'; collection: string; indexRepr: string; valueRepr: string }
  | { type: 'indexed_mutation'; collection: string; indexRepr: string; oldRepr: string; newRepr: string }
  | { type: 'supported_call'; callee: 'len' | 'range'; argsRepr: string[]; resultRepr: string }
  | { type: 'loop_test'; loop: string; iteration: number; result: boolean }
  | { type: 'effect_fire'; effect: string; repr: string }
  | { type: 'unsupported'; construct: string; message: string }
  | { type: 'return_exit'; repr: string };

export type TraceStep = {
  index: number;
  line: number;
  focus: string[];
  bindings: Record<string, string>;
  objectIds?: Record<string, string>;
  frameId?: string;
  event: TraceEvent;
};

export type Trace = {
  call: { functionId: string; argsRepr: string[] };
  steps: TraceStep[];
  result?: { repr: string };
  violation?: { construct: string; message: string };
  truncated: boolean;
};

export type LayoutResult = {
  layout: LayoutNode[];
  width: number;
  height: number;
  nestingDepth: number;
};

export type { LayoutNode, Scene, SceneAction, SceneStep, Selection };
