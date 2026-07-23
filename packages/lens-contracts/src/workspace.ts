import type { PatternHit } from './pattern.js';
import type { Scene } from './scene.js';
import type { Selection } from './selection.js';
import type { SemanticGraph } from './graph.js';
import type { SemanticScene } from './semantic.js';
import type { Trace } from './trace.js';

export type LensSessionKind = 'decode' | 'lesson' | 'playground' | 'harness';

/**
 * These IDs intentionally retain Decode's existing public test IDs.
 * `explain` renders Guided Trace and `structure` renders Graph Inspector.
 */
export type LensViewId = 'flow' | 'state' | 'explain' | 'structure';

export type LensRunStatus = 'idle' | 'running' | 'supported' | 'unsupported' | 'invalid';

export type LensDiagnostic = {
  code: string;
  message: string;
  severity: 'info' | 'warning' | 'error';
  line?: number;
  column?: number;
};

export type LensViolation = {
  code?: string;
  construct: string;
  message: string;
  diagnostic?: string;
};

export type LensTransferCheck = {
  id: string;
  prompt: string;
  answerLine: number;
  nodeId: string;
  kind: string;
};

export type LensEngineRequest = {
  language: 'python';
  source: string;
  argsRepr: string[];
};

export type LensArtifacts = {
  graph: SemanticGraph;
  trace: Trace;
  pattern: PatternHit | null;
  scene: Scene | null;
  semanticScene: SemanticScene | null;
  transfer: LensTransferCheck | null;
  violation: LensViolation | null;
  diagnostics: LensDiagnostic[];
};

export interface LensEngine {
  analyze(request: LensEngineRequest): Promise<LensArtifacts>;
}

export type LensCapabilities = {
  canEditSource: boolean;
  canPasteSource: boolean;
  canReplaceProgram: boolean;
  canRun: boolean;
  canReset: boolean;
  canUseFreeformInput: boolean;
  enabledViews: readonly LensViewId[];
};

export type LensSessionSnapshot = {
  schemaVersion: 1;
  id: string;
  kind: LensSessionKind;
  source: string;
  argsText: string;
  activeView: LensViewId;
  selection: Selection;
  updatedAt: string;
};

export type LensSessionState = LensSessionSnapshot & {
  status: LensRunStatus;
  artifacts: LensArtifacts | null;
  error: string;
};

export interface LensSessionActions {
  setSource(source: string): void;
  setArgsText(argsText: string): void;
  run(): Promise<void>;
  reset(): void;
  setActiveView(view: LensViewId): void;
  setCurrentFrame(frame: number): void;
  setSelection(selection: Selection): void;
}

export interface LensSessionPersistence {
  load(key: string): Promise<LensSessionSnapshot | null>;
  save(key: string, session: LensSessionSnapshot): Promise<void>;
  remove(key: string): Promise<void>;
}

export type LensSessionController = {
  readonly state: LensSessionState;
  readonly actions: LensSessionActions;
  readonly capabilities: LensCapabilities;
  readonly persistenceKey: string;
};
