"""F2-01 server re-verification tests (FastAPI TestClient).

Proves POST /analyses ignores client-supplied artifacts and recomputes truth:

  1. tamper  — a TRANSFORM source posted with a client graph/pattern claiming
               ACCUMULATE is stored as recomputed TRANSFORM truth.
  2. hostile — a sandbox-violating source returns HTTP 422 with a structured
               `violation` body and persists nothing.
"""
from __future__ import annotations

import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from fastapi.testclient import TestClient  # noqa: E402

from apps.api.main import ANALYSES, app  # noqa: E402

TRANSFORM_SOURCE = (
    "def double_all(values):\n"
    "    doubled = []\n"
    "    for v in values:\n"
    "        doubled.append(v * 2)\n"
    "    return doubled\n"
)

# A deliberately wrong client payload: claims ACCUMULATE + a bogus graph/trace.
TAMPERED_GRAPH = {"version": "0.1", "source": "LIE", "nodes": [], "relations": [], "unsupported": []}
TAMPERED_TRACE = {"call": {"functionId": "lie", "argsRepr": []}, "steps": [], "truncated": False}
TAMPERED_PATTERN = {"pattern": "ACCUMULATE", "confidence": "deterministic", "memberNodes": [], "related": []}

HOSTILE_SOURCE = (
    "def sneaky(x):\n"
    "    return eval(x)\n"
)


def test_tamper_recomputes_truth() -> None:
    client = TestClient(app)
    analysis_id = "_test_api_save_tamper"
    path = ANALYSES / f"{analysis_id}.json"
    try:
        resp = client.post(
            "/analyses",
            json={
                "id": analysis_id,
                "source": TRANSFORM_SOURCE,
                "argsRepr": ["[1, 2, 3]"],
                "graph": TAMPERED_GRAPH,
                "trace": TAMPERED_TRACE,
                "pattern": TAMPERED_PATTERN,
                "scene": None,
            },
        )
        assert resp.status_code == 200, resp.text
        assert resp.json()["id"] == analysis_id

        loaded = client.get(f"/analyses/{analysis_id}").json()
        # Client claimed ACCUMULATE + a fabricated graph — server stored TRANSFORM truth.
        assert loaded["pattern"]["pattern"] == "TRANSFORM", loaded["pattern"]
        assert loaded["graph"]["source"] != "LIE"
        assert any(n["kind"] == "function" for n in loaded["graph"]["nodes"])
        assert loaded["trace"]["steps"], "recomputed trace has steps"
        assert loaded["engineVersion"] == "0.1.1", loaded.get("engineVersion")
        assert loaded["scene"] and loaded["scene"]["steps"], "recomputed scene present"
        print("  ok tamper: stored recomputed TRANSFORM truth, engineVersion 0.1.1")
    finally:
        path.unlink(missing_ok=True)


def test_hostile_source_422() -> None:
    client = TestClient(app)
    before = {p.name for p in ANALYSES.glob("*.json")}
    resp = client.post(
        "/analyses",
        json={"source": HOSTILE_SOURCE, "argsRepr": ["1"]},
    )
    assert resp.status_code == 422, resp.text
    body = resp.json()
    violation = body["detail"]["violation"]
    assert violation["construct"], violation
    assert violation["message"], violation
    after = {p.name for p in ANALYSES.glob("*.json")}
    assert after == before, "hostile save must persist nothing"
    print(f"  ok hostile: 422 violation={violation['construct']}, nothing persisted")


def main() -> int:
    test_tamper_recomputes_truth()
    test_hostile_source_422()
    print("api-save: 2/2 re-verification tests passed")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
