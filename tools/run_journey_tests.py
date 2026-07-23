from __future__ import annotations

import json
import shutil
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from fastapi.testclient import TestClient  # noqa: E402

from apps.api.main import EVENTS, app  # noqa: E402


FRESH = [
    {
        "name": "sum_scores",
        "source": (
            "def sum_scores(scores):\n"
            "    total = 0\n"
            "    for score in scores:\n"
            "        total = total + score\n"
            "    return total\n"
        ),
        "argsRepr": ["[2, 4, 6]"],
        "expectPatternHint": "ACCUMULATE",
    },
    {
        "name": "keep_positive",
        "source": (
            "def keep_positive(nums):\n"
            "    out = []\n"
            "    for n in nums:\n"
            "        if n > 0:\n"
            "            out.append(n)\n"
            "    return out\n"
        ),
        "argsRepr": ["[-2, 1, 5]"],
        "expectPatternHint": "FILTER",
    },
    {
        "name": "first_match",
        "source": (
            "def first_match(nums):\n"
            "    for n in nums:\n"
            "        if n > 0:\n"
            "            return n\n"
            "    return -1\n"
        ),
        "argsRepr": ["[-3, -1, 4, 2]"],
        "expectPatternHint": "SEARCH",
    },
]


def transfer_from_graph(graph: dict) -> dict:
    nodes = graph.get("nodes", [])
    preferred = (
        [n for n in nodes if n.get("kind") == "binding" and n.get("role") == "state"]
        or [n for n in nodes if n.get("kind") == "loop"]
        or [n for n in nodes if n.get("kind") == "branch"]
        or [n for n in nodes if n.get("kind") == "function"]
        or nodes
    )
    node = preferred[0]
    line = node["sourceRange"]["startLine"]
    return {"nodeId": node["id"], "answerLine": line, "kind": node["kind"]}


def main() -> int:
    client = TestClient(app)
    health = client.get("/health")
    assert health.status_code == 200, health.text

    before_events = EVENTS.read_text(encoding="utf-8") if EVENTS.exists() else ""
    completed = 0

    for snippet in FRESH:
        print(f"journey: {snippet['name']}")
        analyzed = client.post(
            "/analyze",
            json={"source": snippet["source"], "argsRepr": snippet["argsRepr"]},
        )
        assert analyzed.status_code == 200, analyzed.text
        body = analyzed.json()
        graph = body["graph"]
        trace = body["trace"]
        assert any(n["kind"] == "function" for n in graph["nodes"]), snippet["name"]
        assert len(trace["steps"]) >= 2, snippet["name"]
        assert trace["steps"][0]["event"]["type"] == "call_enter"
        assert trace["steps"][-1]["event"]["type"] == "return_exit"
        # T1: stepping back restores bindings
        if len(trace["steps"]) >= 2:
            assert "bindings" in trace["steps"][0]
            assert "bindings" in trace["steps"][1]

        check = transfer_from_graph(graph)
        assert check["answerLine"] >= 1

        saved = client.post(
            "/analyses",
            json={
                "source": snippet["source"],
                "argsRepr": snippet["argsRepr"],
                "graph": graph,
                "trace": trace,
                "pattern": {"pattern": snippet["expectPatternHint"], "confidence": "deterministic", "memberNodes": [], "related": []},
                "scene": None,
            },
        )
        assert saved.status_code == 200, saved.text
        analysis_id = saved.json()["id"]
        loaded = client.get(f"/analyses/{analysis_id}")
        assert loaded.status_code == 200
        assert loaded.json()["source"].strip() == snippet["source"].strip()

        event = client.post(
            "/events",
            json={"type": "journey_step", "payload": {"name": snippet["name"], "transferLine": check["answerLine"]}},
        )
        assert event.status_code == 200

        # Client pipeline: pattern + scene + transfer (tsx)
        import subprocess

        tmp = ROOT / "data" / f"_journey_{snippet['name']}.json"
        tmp.write_text(json.dumps({"graph": graph, "trace": trace}), encoding="utf-8")
        pnpm = shutil.which("pnpm.cmd") or shutil.which("pnpm")
        if pnpm is None:
            raise RuntimeError("pnpm executable not found")
        pipe = subprocess.run(
            [pnpm, "exec", "tsx", "tools/journey_pipeline.ts", str(tmp)],
            cwd=str(ROOT),
            capture_output=True,
            text=True,
            shell=False,
        )
        if pipe.returncode != 0:
            print(pipe.stdout)
            print(pipe.stderr)
            raise SystemExit(pipe.returncode)
        pipe_out = json.loads(pipe.stdout.strip().splitlines()[-1])
        assert pipe_out["pattern"] == snippet["expectPatternHint"], (
            snippet["name"],
            pipe_out.get("pattern"),
        )
        assert pipe_out["sceneSteps"] >= 2
        assert pipe_out["transferLine"] == check["answerLine"]
        assert pipe_out["transferOk"] is True

        completed += 1
        print(f"  ok analyze/save/load/transfer/pattern={pipe_out['pattern']}")

    after = EVENTS.read_text(encoding="utf-8")
    assert len(after) > len(before_events)
    print(f"{completed}/3 fresh snippets complete")
    return 0 if completed == 3 else 1


if __name__ == "__main__":
    raise SystemExit(main())
