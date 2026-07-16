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

from lol_analyzer import analyze_source  # noqa: E402
from lol_trace import run_trace  # noqa: E402
from lol_trace.sandbox import SandboxViolation  # noqa: E402

DATA = ROOT / "data"
ANALYSES = DATA / "analyses"
EVENTS = DATA / "events.ndjson"
ANALYSES.mkdir(parents=True, exist_ok=True)
DATA.mkdir(parents=True, exist_ok=True)
if not EVENTS.exists():
    EVENTS.write_text("", encoding="utf-8")

app = FastAPI(title="Language of Learning API", version="0.1.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:4173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class AnalyzeRequest(BaseModel):
    source: str
    argsRepr: list[str] = Field(default_factory=list)


class SaveAnalysisRequest(BaseModel):
    source: str
    argsRepr: list[str]
    graph: dict[str, Any]
    trace: dict[str, Any]
    pattern: dict[str, Any] | None = None
    scene: dict[str, Any] | None = None
    id: str | None = None


class EventRequest(BaseModel):
    type: str
    payload: dict[str, Any] = Field(default_factory=dict)


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
        # Trace needs a function node; still return graph with unsupported honestly
        has_fn = any(n.get("kind") == "function" for n in graph.get("nodes", []))
        if not has_fn:
            return {
                "graph": graph,
                "trace": {
                    "call": {"functionId": "missing", "argsRepr": req.argsRepr},
                    "steps": [],
                    "truncated": False,
                },
                "violation": None,
            }
        trace = run_trace(source, graph, req.argsRepr)
        return {
            "graph": graph,
            "trace": {k: v for k, v in trace.items() if k != "violation"},
            "violation": trace.get("violation"),
        }
    except SandboxViolation as exc:
        return {
            "graph": {"version": "0.1", "source": source, "nodes": [], "relations": [], "unsupported": []},
            "trace": {
                "call": {"functionId": "blocked", "argsRepr": req.argsRepr},
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
    payload = {
        "id": analysis_id,
        "savedAt": datetime.now(timezone.utc).isoformat(),
        "source": req.source,
        "argsRepr": req.argsRepr,
        "graph": req.graph,
        "trace": req.trace,
        "pattern": req.pattern,
        "scene": req.scene,
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
