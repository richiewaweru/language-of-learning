from __future__ import annotations

import argparse
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "packages" / "analyzer-python" / "src"))

from lol_analyzer import analyze_source, canonical_json  # noqa: E402


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("source", help="Path to a Python source file")
    args = parser.parse_args()
    source = Path(args.source).read_text(encoding="utf-8")
    print(canonical_json(analyze_source(source)), end="")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
