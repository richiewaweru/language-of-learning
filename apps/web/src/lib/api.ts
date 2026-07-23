export const API_BASE = import.meta.env.VITE_API_BASE ?? 'http://127.0.0.1:8000';

export type AnalyzeResponse = {
  graph: import('@lol/lens-scenes').SemanticGraph;
  trace: import('@lol/lens-scenes').Trace;
  violation: { code: string; construct: string; message: string; diagnostic?: string } | null;
};

export type AIStatus = {
  enabled: boolean;
  provider: string;
  model: string | null;
  configured: boolean;
  capabilities: {
    explainStep: boolean;
    explainProgram: boolean;
    chat: boolean;
    fallback: boolean;
  };
};

export type TeachingRequest = {
  source: string;
  argsRepr: string[];
  stepIndex: number;
  learnerLevel?: string;
  lessonGoal?: string;
};

export type TeachingResponse = {
  answer: string;
  summary: string;
  vocabulary: string[];
  supportStatus: 'supported' | 'unsupported';
  stepIndex: number | null;
  sourceLine: number | null;
  grounding: string[];
  provider: string;
  model: string | null;
  fallback: boolean;
};

async function apiJson<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, init);
  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    try {
      const body = await res.json();
      message = body.detail?.message ?? body.detail ?? message;
    } catch {
      // Keep the safe status-based message when the response is not JSON.
    }
    throw new Error(typeof message === 'string' ? message : `Request failed (${res.status})`);
  }
  return res.json() as Promise<T>;
}

export async function analyzeSource(source: string, argsRepr: string[]): Promise<AnalyzeResponse> {
  const res = await fetch(`${API_BASE}/analyze`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ source, argsRepr }),
  });
  if (!res.ok) {
    const detail = await res.text();
    throw new Error(detail || `analyze failed (${res.status})`);
  }
  return res.json();
}

export function getAIStatus(): Promise<AIStatus> {
  return apiJson<AIStatus>('/ai/status');
}

export function explainStep(payload: TeachingRequest): Promise<TeachingResponse> {
  return apiJson<TeachingResponse>('/ai/explain-step', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

export function explainProgram(payload: TeachingRequest): Promise<TeachingResponse> {
  return apiJson<TeachingResponse>('/ai/explain-program', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

export function askLensChat(payload: TeachingRequest & { question: string }): Promise<TeachingResponse> {
  return apiJson<TeachingResponse>('/ai/chat', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

export async function saveAnalysis(payload: Record<string, unknown>): Promise<{ id: string }> {
  const res = await fetch(`${API_BASE}/analyses`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`save failed (${res.status})`);
  return res.json();
}

export async function loadAnalysis(id: string): Promise<Record<string, unknown>> {
  const res = await fetch(`${API_BASE}/analyses/${id}`);
  if (!res.ok) throw new Error(`load failed (${res.status})`);
  return res.json();
}

export async function recordEvent(type: string, payload: Record<string, unknown> = {}): Promise<void> {
  await fetch(`${API_BASE}/events`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ type, payload }),
  }).catch(() => {
    /* telemetry must not break the UI */
  });
}
