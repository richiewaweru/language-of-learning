"""Deterministic artifact builder shared by the API save path and content rebuild.

Recomputes all four analysis artifacts from source truth:
  1. graph   — Python analyzer (analyze_source)
  2. trace   — Python trace runtime (run_trace, sandboxed)
  3. pattern — TS detector (packages/lens-patterns) via subprocess
  4. scene   — TS scene builder (packages/lens-scenes) via subprocess

Client-supplied graph/trace/pattern/scene are never trusted; the server derives
every artifact here so a tampered payload cannot be persisted.

CLI:
  python tools/build_artifacts.py <input.json> <output.json> [--engine-only]

  input.json : { "source": str, "argsRepr": [str], "sceneId"?: str, "graphRef"?: str }
  output.json: { "graph", "trace", "pattern", "scene", "engineVersion" }
               (--engine-only omits pattern/scene: { "graph", "trace" })

  On a SandboxViolation or function-less graph the CLI writes
  { "violation": { "construct", "message" } } and exits non-zero.
"""
from __future__ import annotations

import json
import subprocess
import sys
import tempfile
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "packages" / "analyzer-python" / "src"))
sys.path.insert(0, str(ROOT / "packages" / "trace-runtime" / "src"))

from lol_analyzer import analyze_source  # noqa: E402
from lol_trace import run_trace  # noqa: E402

ENGINE_VERSION = "0.1.1"


class ArtifactError(Exception):
    """Recompute failed with a structured, honest violation body."""

    def __init__(self, violation: dict[str, str]) -> None:
        self.violation = violation
        super().__init__(violation.get("message", "artifact build failed"))


def build_graph_and_trace(source: str, args_repr: list[str]) -> tuple[dict[str, Any], dict[str, Any]]:
    """Recompute graph + trace from source. Raises ArtifactError on any violation."""
    source = source.strip()
    if not source:
        raise ArtifactError({"construct": "empty_source", "message": "source is required"})
    try:
        graph = analyze_source(source)
    except SyntaxError as exc:
        raise ArtifactError({"construct": "syntax", "message": f"Source failed to parse: {exc.msg}"}) from exc
    has_fn = any(node.get("kind") == "function" for node in graph.get("nodes", []))
    if not has_fn:
        raise ArtifactError(
            {"construct": "no_function", "message": "Source defines no analyzable function node."}
        )
    trace = run_trace(source, graph, args_repr)
    violation = trace.get("violation")
    if violation:
        raise ArtifactError({"construct": violation["construct"], "message": violation["message"]})
    return graph, trace


def _run_pattern_scene(
    graph: dict[str, Any],
    trace: dict[str, Any],
    scene_id: str | None,
    graph_ref: str | None,
) -> dict[str, Any]:
    with tempfile.TemporaryDirectory() as tmp:
        inp = Path(tmp) / "in.json"
        outp = Path(tmp) / "out.json"
        inp.write_text(
            json.dumps({"graph": graph, "trace": trace, "sceneId": scene_id, "graphRef": graph_ref}),
            encoding="utf-8",
        )
        argv = ["exec", "tsx", "tools/build_pattern_scene.ts", str(inp), str(outp)]
        proc = subprocess.run(
            ["pnpm.cmd", *argv],
            cwd=str(ROOT),
            capture_output=True,
            text=True,
            shell=False,
        )
        if proc.returncode != 0:
            # Fallback for environments where pnpm.cmd resolution differs (POSIX).
            proc = subprocess.run(
                f'pnpm exec tsx tools/build_pattern_scene.ts "{inp}" "{outp}"',
                cwd=str(ROOT),
                capture_output=True,
                text=True,
                shell=True,
            )
        if proc.returncode != 0:
            raise RuntimeError(
                f"pattern/scene subprocess failed (exit {proc.returncode}):\n{proc.stderr or proc.stdout}"
            )
        return json.loads(outp.read_text(encoding="utf-8"))


def build_artifacts(
    source: str,
    args_repr: list[str],
    scene_id: str | None = None,
    graph_ref: str | None = None,
) -> dict[str, Any]:
    """Recompute all four artifacts + engine version. Raises ArtifactError on violation."""
    graph, trace = build_graph_and_trace(source, args_repr)
    built = _run_pattern_scene(graph, trace, scene_id, graph_ref)
    return {
        "graph": graph,
        "trace": trace,
        "pattern": built.get("pattern"),
        "scene": built.get("scene"),
        "engineVersion": ENGINE_VERSION,
    }


def _main(argv: list[str]) -> int:
    args = [a for a in argv if not a.startswith("--")]
    engine_only = "--engine-only" in argv
    if len(args) != 2:
        print("usage: python tools/build_artifacts.py <input.json> <output.json> [--engine-only]", file=sys.stderr)
        return 2
    input_path, output_path = Path(args[0]), Path(args[1])
    payload = json.loads(input_path.read_text(encoding="utf-8"))
    source = payload["source"]
    args_repr = payload.get("argsRepr", [])
    try:
        if engine_only:
            graph, trace = build_graph_and_trace(source, args_repr)
            result: dict[str, Any] = {"graph": graph, "trace": trace}
        else:
            result = build_artifacts(
                source,
                args_repr,
                scene_id=payload.get("sceneId"),
                graph_ref=payload.get("graphRef"),
            )
    except ArtifactError as exc:
        output_path.write_text(json.dumps({"violation": exc.violation}, indent=2), encoding="utf-8")
        print(json.dumps({"violation": exc.violation}), file=sys.stderr)
        return 1
    output_path.write_text(json.dumps(result, indent=2), encoding="utf-8")
    return 0


if __name__ == "__main__":
    raise SystemExit(_main(sys.argv[1:]))
