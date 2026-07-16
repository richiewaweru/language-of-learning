"""Generalization guard for the analyzer (corrective-run F1-05).

`fixtures/variations/` holds renamed / re-literaled variants of the six
patterns (each ≥2×) plus a two-append variant. There are deliberately NO
expected-graph files — the suite asserts *structure*, not bytes:

  - declared counts (state bindings, loops, branches, mutations, returns)
  - the detected pattern (via the TS registry, the single source of truth)
  - zero unsupported regions
  - every emitted id is position-based (contract N2)
  - the tracer runs the sample call without a sandbox violation
  - a two-append variant produces distinct mutation ids per append event

Because these fixtures share no bytes with the golden set, passing here means
the engine generalizes rather than memorizing fixture names or literals.
"""

from __future__ import annotations

import argparse
import json
import re
import shutil
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "packages" / "analyzer-python" / "src"))
sys.path.insert(0, str(ROOT / "packages" / "trace-runtime" / "src"))

from lol_analyzer import analyze_source  # noqa: E402
from lol_trace import run_trace  # noqa: E402

VARIATIONS_ROOT = ROOT / "fixtures" / "variations"
POSITION_ID_RE = re.compile(r"^[a-z]+-L[0-9]+C[0-9]+(-[0-9]+)?$")

COUNT_KINDS = {
    "loopCount": "loop",
    "branchCount": "branch",
    "mutationCount": "mutation",
    "returnsCount": "return",
}


def variation_dirs() -> list[Path]:
    return sorted(p for p in VARIATIONS_ROOT.iterdir() if p.is_dir() and (p / "source.py").exists())


def analyze(fixture_dir: Path) -> dict:
    source = (fixture_dir / "source.py").read_text(encoding="utf-8").rstrip()
    return analyze_source(source)


def state_binding_count(graph: dict) -> int:
    return sum(1 for n in graph["nodes"] if n["kind"] == "binding" and n.get("role") == "state")


def kind_count(graph: dict, kind: str) -> int:
    return sum(1 for n in graph["nodes"] if n["kind"] == kind)


def detect_patterns(graphs: dict[str, dict]) -> dict[str, str | None]:
    """Run the TS pattern registry over analyzed graphs (single source of truth)."""
    pnpm = shutil.which("pnpm")
    if pnpm is None:
        raise unittest.SkipTest("pnpm not available; cannot run TS pattern registry")
    with tempfile.TemporaryDirectory() as tmp:
        in_path = Path(tmp) / "graphs.json"
        out_path = Path(tmp) / "patterns.json"
        in_path.write_text(json.dumps(graphs), encoding="utf-8")
        result = subprocess.run(
            [pnpm, "exec", "tsx", str(ROOT / "tools" / "detect_patterns_batch.ts"), str(in_path), str(out_path)],
            cwd=ROOT,
            capture_output=True,
            text=True,
            check=False,
        )
        if result.returncode != 0:
            raise AssertionError(f"pattern detection failed:\n{result.stdout}\n{result.stderr}")
        return json.loads(out_path.read_text(encoding="utf-8"))


class VariationTests(unittest.TestCase):
    maxDiff = None

    @classmethod
    def setUpClass(cls) -> None:
        cls.dirs = variation_dirs()
        cls.graphs = {d.name: analyze(d) for d in cls.dirs}
        cls.patterns = detect_patterns(cls.graphs)

    def test_at_least_twelve_variants(self) -> None:
        self.assertGreaterEqual(len(self.dirs), 12, "F1-05 requires 12+ variation fixtures")

    def test_each_variation(self) -> None:
        for fixture_dir in self.dirs:
            name = fixture_dir.name
            with self.subTest(variation=name):
                graph = self.graphs[name]
                expect = json.loads((fixture_dir / "expect.json").read_text(encoding="utf-8"))

                self.assertEqual(graph["unsupported"], [], f"{name}: unexpected unsupported regions")

                for node in graph["nodes"]:
                    self.assertRegex(node["id"], POSITION_ID_RE, f"{name}: non-positional id {node['id']!r}")

                self.assertEqual(
                    state_binding_count(graph),
                    expect["stateBindingCount"],
                    f"{name}: stateBindingCount",
                )
                for key, kind in COUNT_KINDS.items():
                    self.assertEqual(kind_count(graph, kind), expect[key], f"{name}: {key}")

                self.assertEqual(self.patterns[name], expect["pattern"], f"{name}: pattern")

                # The sample call must execute cleanly through the tracer.
                call = json.loads((fixture_dir / "call.json").read_text(encoding="utf-8"))
                source = (fixture_dir / "source.py").read_text(encoding="utf-8").rstrip()
                trace = run_trace(source, graph, call["argsRepr"])
                self.assertIsNone(trace.get("violation"), f"{name}: sandbox violation {trace.get('violation')}")
                self.assertFalse(trace.get("truncated"), f"{name}: trace truncated")

                # F1-03: multi-mutation variants must yield distinct mutation ids per event.
                if expect["mutationCount"] >= 2:
                    append_ids = {
                        step["focus"][0]
                        for step in trace["steps"]
                        if step["event"].get("type") == "collection_append"
                    }
                    self.assertGreaterEqual(
                        len(append_ids),
                        2,
                        f"{name}: expected distinct mutation ids across append events, got {append_ids}",
                    )


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("keywords", nargs="*", help="Optional substrings to select tests")
    args = parser.parse_args()

    suite = unittest.defaultTestLoader.loadTestsFromTestCase(VariationTests)
    if args.keywords:
        selected = unittest.TestSuite()
        lowered = [k.lower() for k in args.keywords]
        for test in iterate_suite(suite):
            name = test.id().split(".")[-1].lower()
            if any(keyword in name for keyword in lowered):
                selected.addTest(test)
        suite = selected

    runner = unittest.TextTestRunner(verbosity=2)
    result = runner.run(suite)
    return 0 if result.wasSuccessful() else 1


def iterate_suite(suite: unittest.TestSuite):
    for test in suite:
        if isinstance(test, unittest.TestSuite):
            yield from iterate_suite(test)
        else:
            yield test


if __name__ == "__main__":
    raise SystemExit(main())
