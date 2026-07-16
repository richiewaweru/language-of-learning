export const API_BASE = import.meta.env.VITE_API_BASE ?? 'http://127.0.0.1:8000';

export type AnalyzeResponse = {
  graph: import('@lol/lens-scenes').SemanticGraph;
  trace: import('@lol/lens-scenes').Trace;
  violation: { construct: string; message: string } | null;
};

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
