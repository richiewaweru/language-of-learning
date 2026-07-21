export type SemanticRole =
  | "value" | "binding" | "collection" | "state" | "cursor"
  | "range" | "call-frame" | "reference" | "result"
  | "generic" | "unsupported";

export type SemanticEventType =
  | "bind" | "read" | "select" | "move" | "calculate"
  | "compare" | "branch" | "repeat" | "update" | "insert"
  | "remove" | "swap" | "call" | "return" | "effect";

export type EvidenceConfidence = "verified" | "inferred" | "generic" | "unsupported";

export interface SourceRange {
  startLine: number; startColumn: number; endLine: number; endColumn: number;
}

export interface SemanticEntity {
  id: string;
  role: SemanticRole;
  label?: string;
  sourceNodeId?: string;
  sourceRange?: SourceRange;
  objectId?: string;
  confidence: EvidenceConfidence;
  properties: Record<string, unknown>;
}

export interface SemanticEvent {
  id: string;
  type: SemanticEventType;
  entityIds: string[];
  sourceRange?: SourceRange;
  stepIndex: number;
  confidence: EvidenceConfidence;
  payload: Record<string, unknown>;
}

export interface EntitySnapshot {
  entityId: string;
  value?: unknown;
  previousValue?: unknown;
  status: "idle" | "active" | "selected" | "changing" | "completed" | "unsupported";
  properties?: Record<string, unknown>;
}

export interface SceneStep {
  index: number;
  activeSourceRange?: SourceRange;
  activeEntityIds: string[];
  activeEvent: SemanticEvent;
  snapshots: EntitySnapshot[];
  caption: { key: string; variables: Record<string, string | number | boolean> };
}

