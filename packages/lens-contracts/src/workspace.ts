import type { PatternHit } from './pattern.js';
import type { Scene } from './scene.js';
import type { Selection } from './selection.js';
import type { SemanticGraph } from './graph.js';
import type { SemanticScene } from './semantic.js';
import type { Trace } from './trace.js';
import { z } from 'zod';
import { SelectionSchema } from './selection.js';

export type LensSessionKind = 'decode' | 'lesson' | 'playground' | 'harness';

/**
 * These IDs intentionally retain Decode's existing public test IDs.
 * `explain` renders Guided Trace and `structure` renders Graph Inspector.
 */
export type LensViewId = 'flow' | 'state' | 'explain' | 'structure';

export type LensRunStatus = 'idle' | 'running' | 'supported' | 'unsupported' | 'invalid';

export type LensHydrationStatus =
  | 'not-requested'
  | 'loading'
  | 'restored'
  | 'empty'
  | 'invalid'
  | 'failed';

export type LensProgram = {
  id: string;
  language: 'python';
  source: string;
  argsText: string;
};

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
  initialized: boolean;
  hydrationStatus: LensHydrationStatus;
  revision: number;
  persistenceWarning: string | null;
  status: LensRunStatus;
  artifacts: LensArtifacts | null;
  error: string;
};

export interface LensSessionActions {
  hydrate(): Promise<void>;
  setSourceFromUser(source: string): void;
  replaceProgramFromUser(program: LensProgram): void;
  setArgsText(argsText: string): void;
  run(): Promise<void>;
  reset(): void;
  setActiveView(view: LensViewId): void;
  setCurrentFrame(frame: number): void;
  setSelection(selection: Selection): void;
}

export interface LensSessionOwnerActions {
  loadProgramFromOwner(program: LensProgram): void;
  clearPersistence(): Promise<void>;
}

export interface LensSessionPersistence {
  load(key: string): Promise<unknown | null>;
  save(key: string, session: LensSessionSnapshot): Promise<void>;
  remove(key: string): Promise<void>;
}

export type LensSessionController = {
  readonly state: LensSessionState;
  readonly actions: LensSessionActions;
  readonly capabilities: LensCapabilities;
  readonly persistenceKey: string;
};

export type LensSessionHandle = {
  readonly controller: LensSessionController;
  readonly ownerActions: LensSessionOwnerActions;
};

const LensViewIdSchema = z.enum(['flow', 'state', 'explain', 'structure']);
const LensSessionKindSchema = z.enum(['decode', 'lesson', 'playground', 'harness']);

export const LensSessionSnapshotSchema = z.object({
  schemaVersion: z.literal(1),
  id: z.string().min(1),
  kind: LensSessionKindSchema,
  source: z.string(),
  argsText: z.string(),
  activeView: LensViewIdSchema,
  selection: SelectionSchema,
  updatedAt: z.string().datetime(),
}).strict();

export type LensSnapshotExpectation = {
  id: string;
  kind: LensSessionKind;
  enabledViews: readonly LensViewId[];
};

export type LensSnapshotValidationResult =
  | { success: true; data: LensSessionSnapshot }
  | { success: false; reason: string };

export function parseLensSessionSnapshot(
  value: unknown,
  expected: LensSnapshotExpectation,
): LensSnapshotValidationResult {
  const parsed = LensSessionSnapshotSchema.safeParse(value);
  if (!parsed.success) {
    return { success: false, reason: 'Snapshot shape or schema version is invalid.' };
  }
  if (parsed.data.id !== expected.id) {
    return { success: false, reason: 'Snapshot session identity does not match.' };
  }
  if (parsed.data.kind !== expected.kind) {
    return { success: false, reason: 'Snapshot session kind does not match.' };
  }
  if (!expected.enabledViews.includes(parsed.data.activeView)) {
    return { success: false, reason: 'Snapshot view is not enabled for this session.' };
  }
  return { success: true, data: parsed.data };
}
