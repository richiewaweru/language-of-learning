from __future__ import annotations

import json
import sys
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "packages" / "analyzer-python" / "src"))
sys.path.insert(0, str(ROOT / "packages" / "trace-runtime" / "src"))
sys.path.insert(0, str(ROOT / "tools"))

from lol_analyzer import analyze_source  # noqa: E402
from lol_trace import run_trace  # noqa: E402
from lol_trace.sandbox import SandboxViolation  # noqa: E402

from build_artifacts import ENGINE_VERSION, ArtifactError, build_artifacts  # noqa: E402
from apps.api.ai_runtime import (  # noqa: E402
    AISettings,
    ChatRequest,
    TeachingRequest,
    status as ai_runtime_status,
    teach,
)

DATA = ROOT / "data"
ANALYSES = DATA / "analyses"
EVENTS = DATA / "events.ndjson"
ANALYSES.mkdir(parents=True, exist_ok=True)
DATA.mkdir(parents=True, exist_ok=True)
if not EVENTS.exists():
    EVENTS.write_text("", encoding="utf-8")

app = FastAPI(title="Language of Learning API", version=ENGINE_VERSION)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:4173",
        "http://127.0.0.1:4173",
    ],
    allow_origin_regex=r"http://(localhost|127\.0\.0\.1):\d+",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class AnalyzeRequest(BaseModel):
    source: str
    argsRepr: list[str] = Field(default_factory=list)


class SaveAnalysisRequest(BaseModel):
    source: str
    argsRepr: list[str] = Field(default_factory=list)
    # Client-supplied artifacts are accepted for backward compatibility but
    # IGNORED — the server re-verifies and recomputes all four from source truth.
    graph: dict[str, Any] | None = None
    trace: dict[str, Any] | None = None
    pattern: dict[str, Any] | None = None
    scene: dict[str, Any] | None = None
    id: str | None = None


class EventRequest(BaseModel):
    type: str
    payload: dict[str, Any] = Field(default_factory=dict)


GRAPH_NODE_KINDS = {
    "value", "binding", "collection", "module", "function", "call",
    "builtin-call", "operation", "sequence", "branch", "loop", "return",
    "mutation", "effect",
}
TRACE_EVENT_TYPES = {
    "call_enter", "bind_param", "state_init", "loop_advance",
    "condition_eval", "state_change", "collection_append",
    "indexed_selection", "indexed_mutation", "supported_call", "loop_test",
    "loop-exit", "loop-skip", "builtin-evaluated", "effect_fire",
    "unsupported", "return_exit",
}


def validate_analysis_contracts(graph: dict[str, Any], trace: dict[str, Any]) -> None:
    """Reject internal writer drift before a successful analysis response."""
    if not isinstance(graph.get("version"), str) or not isinstance(graph.get("source"), str):
        raise ValueError("Semantic graph is missing version or source.")
    nodes = graph.get("nodes")
    relations = graph.get("relations")
    unsupported = graph.get("unsupported")
    if not isinstance(nodes, list) or not isinstance(relations, list) or not isinstance(unsupported, list):
        raise ValueError("Semantic graph collections are invalid.")
    node_ids = {
        node.get("id")
        for node in nodes
        if isinstance(node, dict) and node.get("kind") in GRAPH_NODE_KINDS
    }
    if len(node_ids) != len(nodes) or None in node_ids:
        raise ValueError("Semantic graph contains an invalid or duplicate node.")
    if not unsupported:
        roots = [node for node in nodes if node.get("kind") in {"module", "function"}]
        if len(roots) != 1:
            raise ValueError("Semantic graph must contain one execution scope.")
    for relation in relations:
        if relation.get("from") not in node_ids or relation.get("to") not in node_ids:
            raise ValueError("Semantic graph relation references an unknown node.")

    scope = trace.get("scope")
    if not isinstance(scope, dict) or scope.get("kind") not in {"module", "function"}:
        raise ValueError("Trace execution scope is invalid.")
    if not isinstance(scope.get("id"), str) or not isinstance(scope.get("label"), str):
        raise ValueError("Trace execution scope identity is invalid.")
    if scope["kind"] == "function":
        if not isinstance(scope.get("functionId"), str) or not isinstance(scope.get("argsRepr"), list):
            raise ValueError("Function trace scope metadata is incomplete.")
        call = trace.get("call")
        if not isinstance(call, dict) or call.get("functionId") != scope["functionId"]:
            raise ValueError("Function compatibility call metadata is inconsistent.")
    steps = trace.get("steps")
    if not isinstance(steps, list) or not isinstance(trace.get("truncated"), bool):
        raise ValueError("Trace steps or truncation state is invalid.")
    for index, step in enumerate(steps):
        if (
            not isinstance(step, dict)
            or step.get("index") != index
            or not isinstance(step.get("line"), int)
            or step["line"] < 1
            or not isinstance(step.get("focus"), list)
            or not isinstance(step.get("bindings"), dict)
            or not isinstance(step.get("frameId"), str)
            or step.get("event", {}).get("type") not in TRACE_EVENT_TYPES
        ):
            raise ValueError(f"Trace step {index} is invalid.")


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/analyze")
def analyze(req: AnalyzeRequest) -> dict[str, Any]:
    source = req.source.strip()
    if not source:
        raise HTTPException(status_code=400, detail="source is required")
    try:
        graph = analyze_source(source)
        # Analyzer rejections are intentionally node-free. Let the trace layer
        # translate the canonical rejection before the missing-function check so
        # callers receive one atomic, structured failure with no partial trace.
        if graph.get("unsupported"):
            trace = run_trace(source, graph, req.argsRepr)
            validate_analysis_contracts(graph, trace)
            return {
                "graph": graph,
                "trace": {k: v for k, v in trace.items() if k != "violation"},
                "violation": trace.get("violation"),
            }
        trace = run_trace(source, graph, req.argsRepr)
        validate_analysis_contracts(graph, trace)
        return {
            "graph": graph,
            "trace": {k: v for k, v in trace.items() if k != "violation"},
            "violation": trace.get("violation"),
        }
    except SandboxViolation as exc:
        return {
            "graph": {"version": "0.1", "source": source, "nodes": [], "relations": [], "unsupported": []},
            "trace": {
                "scope": {
                    "kind": "module",
                    "id": "module:main",
                    "label": "Program",
                },
                "steps": [],
                "truncated": True,
            },
            "violation": exc.as_dict(),
        }
    except Exception as exc:  # noqa: BLE001 — surface honestly to Decode UI
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@app.post("/analyses")
def save_analysis(req: SaveAnalysisRequest) -> dict[str, Any]:
    analysis_id = req.id or str(uuid.uuid4())
    # Re-verify on save: recompute all four artifacts from source + argsRepr.
    # Client-supplied graph/trace/pattern/scene are ignored entirely so a
    # tampered payload (or a hostile source) can never be persisted.
    try:
        artifacts = build_artifacts(
            req.source,
            req.argsRepr,
            scene_id=f"scene-{analysis_id}",
        )
    except ArtifactError as exc:
        # Nothing persisted; surface the structured violation to the caller.
        raise HTTPException(
            status_code=422,
            detail={"violation": exc.violation, "message": exc.violation["message"]},
        ) from exc

    payload = {
        "id": analysis_id,
        "savedAt": datetime.now(timezone.utc).isoformat(),
        "engineVersion": artifacts["engineVersion"],
        "source": req.source,
        "argsRepr": req.argsRepr,
        "graph": artifacts["graph"],
        "trace": artifacts["trace"],
        "pattern": artifacts["pattern"],
        "scene": artifacts["scene"],
    }
    path = ANALYSES / f"{analysis_id}.json"
    path.write_text(json.dumps(payload, indent=2) + "\n", encoding="utf-8")
    return {"id": analysis_id, "path": str(path.relative_to(ROOT))}


@app.get("/analyses/{analysis_id}")
def load_analysis(analysis_id: str) -> dict[str, Any]:
    path = ANALYSES / f"{analysis_id}.json"
    if not path.exists():
        raise HTTPException(status_code=404, detail="analysis not found")
    return json.loads(path.read_text(encoding="utf-8"))


@app.get("/analyses")
def list_analyses() -> dict[str, Any]:
    items = []
    for path in sorted(ANALYSES.glob("*.json")):
        data = json.loads(path.read_text(encoding="utf-8"))
        items.append({"id": data.get("id", path.stem), "savedAt": data.get("savedAt")})
    return {"items": items}


@app.post("/events")
def post_event(req: EventRequest) -> dict[str, str]:
    record = {
        "ts": datetime.now(timezone.utc).isoformat(),
        "type": req.type,
        "payload": req.payload,
    }
    with EVENTS.open("a", encoding="utf-8") as fh:
        fh.write(json.dumps(record) + "\n")
    return {"status": "recorded"}


@app.get("/ai/status")
def ai_status() -> dict[str, Any]:
    """Return safe runtime capability information; never return credentials."""
    return ai_runtime_status(AISettings.load())


@app.post("/ai/explain-step")
def ai_explain_step(req: TeachingRequest) -> dict[str, Any]:
    return teach(req, "explain_step").model_dump()


@app.post("/ai/explain-program")
def ai_explain_program(req: TeachingRequest) -> dict[str, Any]:
    return teach(req, "explain_program").model_dump()


@app.post("/ai/chat")
def ai_chat(req: ChatRequest) -> dict[str, Any]:
    return teach(req, "chat", req.question).model_dump()
