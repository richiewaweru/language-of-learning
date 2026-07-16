from __future__ import annotations

import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "packages" / "analyzer-python" / "src"))
sys.path.insert(0, str(ROOT / "packages" / "trace-runtime" / "src"))

from lol_analyzer import analyze_source  # noqa: E402
from lol_trace import canonical_json, run_trace  # noqa: E402


FIXTURES = ["accumulate", "count", "filter", "transform", "search", "guard"]


def main() -> int:
    for fixture in FIXTURES:
        fixture_dir = ROOT / "fixtures" / fixture
        source = (fixture_dir / "source.py").read_text(encoding="utf-8").rstrip()
        graph = analyze_source(source)
        call = __import__("json").loads((fixture_dir / "call.json").read_text(encoding="utf-8"))
        trace = run_trace(source, graph, call["argsRepr"])
        (fixture_dir / "expected.trace.json").write_text(canonical_json(trace), encoding="utf-8")
        print(f"rewrote {fixture}/expected.trace.json ({len(trace['steps'])} steps)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
