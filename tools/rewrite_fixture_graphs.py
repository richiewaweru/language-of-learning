from __future__ import annotations

import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "packages" / "analyzer-python" / "src"))

from lol_analyzer import analyze_source, canonical_json  # noqa: E402


def main() -> int:
    for fixture_dir in sorted((ROOT / "fixtures").iterdir()):
        if not fixture_dir.is_dir():
            continue
        source = (fixture_dir / "source.py").read_text(encoding="utf-8").rstrip()
        graph = analyze_source(source)
        (fixture_dir / "expected.graph.json").write_text(canonical_json(graph), encoding="utf-8")
        print(f"rewrote {fixture_dir.name}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
