"""Export a variation fixture as graph+trace JSON for web SSR loaders."""
from __future__ import annotations

import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "packages" / "analyzer-python" / "src"))
sys.path.insert(0, str(ROOT / "packages" / "trace-runtime" / "src"))

from lol_analyzer import analyze_source, canonical_json  # noqa: E402
from lol_trace import canonical_json as trace_canonical_json  # noqa: E402
from lol_trace import run_trace  # noqa: E402


def main() -> int:
    if len(sys.argv) < 2:
        print("usage: export_variation_pack.py <variation-or-fixture-name>", file=sys.stderr)
        return 2
    name = sys.argv[1]
    base = ROOT / "fixtures" / "variations" / name
    if not base.is_dir():
        alt = ROOT / "fixtures" / name
        if alt.is_dir():
            base = alt
        else:
            print(f"unknown variation: {name}", file=sys.stderr)
            return 1
    source = (base / "source.py").read_text(encoding="utf-8").rstrip()
    call = json.loads((base / "call.json").read_text(encoding="utf-8"))
    graph = analyze_source(source)
    trace = run_trace(source, graph, call["argsRepr"])
    payload = {
        "id": name,
        "source": source,
        "argsRepr": call["argsRepr"],
        "graph": json.loads(canonical_json(graph)),
        "trace": json.loads(trace_canonical_json(trace)),
    }
    sys.stdout.write(json.dumps(payload))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
