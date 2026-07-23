"""Honestly regenerate golden fixture expectations from the corrected engine.

For every positive pattern fixture this writes:
  - expected.graph.json   (from the analyzer)
  - expected.trace.json   (from the tracer, using call.json args)

For negative fixtures that ship an expected.graph.json, the graph is rewritten
too. Scene-actions and pattern expectations are TypeScript-derived; this script
shells out to tools/regenerate_ts_expectations.ts when a Node toolchain is
available, and otherwise prints a note so the caller can run it manually.

Expected values are re-derived from the engine — never hand-tuned to stay green.
"""

from __future__ import annotations

import json
import shutil
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "packages" / "analyzer-python" / "src"))
sys.path.insert(0, str(ROOT / "packages" / "trace-runtime" / "src"))

from lol_analyzer import analyze_source, canonical_json  # noqa: E402
from lol_trace import canonical_json as trace_canonical_json  # noqa: E402
from lol_trace import run_trace  # noqa: E402

PATTERN_FIXTURES = ["accumulate", "count", "filter", "transform", "search", "guard"]
SUPPORTED_FIXTURES = ["array-update", "print_total", "return_total"]


def regenerate_graph(fixture_dir: Path) -> None:
    source = (fixture_dir / "source.py").read_text(encoding="utf-8").rstrip()
    graph = analyze_source(source)
    (fixture_dir / "expected.graph.json").write_text(canonical_json(graph), encoding="utf-8")
    print(f"  graph  <- {fixture_dir.relative_to(ROOT)}")


def regenerate_trace(fixture_dir: Path) -> None:
    call_path = fixture_dir / "call.json"
    if not call_path.exists():
        return
    source = (fixture_dir / "source.py").read_text(encoding="utf-8").rstrip()
    graph = analyze_source(source)
    call = json.loads(call_path.read_text(encoding="utf-8"))
    trace = run_trace(source, graph, call["argsRepr"])
    (fixture_dir / "expected.trace.json").write_text(trace_canonical_json(trace), encoding="utf-8")
    print(f"  trace  <- {fixture_dir.relative_to(ROOT)}")


def regenerate_positive_fixtures() -> None:
    print("Positive pattern fixtures:")
    for name in PATTERN_FIXTURES:
        fixture_dir = ROOT / "fixtures" / name
        regenerate_graph(fixture_dir)
        regenerate_trace(fixture_dir)
    print("Additional supported fixtures:")
    for name in SUPPORTED_FIXTURES:
        fixture_dir = ROOT / "fixtures" / name
        regenerate_graph(fixture_dir)
        regenerate_trace(fixture_dir)


def regenerate_negative_fixtures() -> None:
    negative_root = ROOT / "fixtures" / "negative"
    if not negative_root.exists():
        return
    print("Negative fixtures (graphs only):")
    for fixture_dir in sorted(p for p in negative_root.iterdir() if p.is_dir()):
        if (fixture_dir / "expected.graph.json").exists():
            regenerate_graph(fixture_dir)


def regenerate_ts_expectations() -> None:
    """Regenerate pattern + scene-actions expectations via the TS engine."""
    script = ROOT / "tools" / "regenerate_ts_expectations.ts"
    pnpm = shutil.which("pnpm")
    if pnpm is None:
        print(
            "NOTE: pnpm not found — skipped scene-actions/pattern regeneration.\n"
            f"      Run manually: pnpm exec tsx {script.relative_to(ROOT)}"
        )
        return
    print("TypeScript expectations (scene-actions + pattern):")
    try:
        result = subprocess.run(
            [pnpm, "exec", "tsx", str(script)],
            cwd=ROOT,
            capture_output=True,
            text=True,
            check=False,
        )
    except OSError as exc:  # pragma: no cover - environment dependent
        print(f"NOTE: could not launch tsx ({exc}). Run manually: pnpm exec tsx {script}")
        return
    sys.stdout.write(result.stdout)
    if result.returncode != 0:
        sys.stderr.write(result.stderr)
        print(
            "NOTE: TS regeneration failed (see above). Graph/trace expectations were\n"
            "      still regenerated; run the TS script manually once the toolchain is ready."
        )


def main() -> int:
    regenerate_positive_fixtures()
    regenerate_negative_fixtures()
    regenerate_ts_expectations()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
