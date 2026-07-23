from __future__ import annotations

import json
import sys
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "packages" / "analyzer-python" / "src"))
sys.path.insert(0, str(ROOT / "packages" / "trace-runtime" / "src"))

from lol_analyzer import analyze_source  # noqa: E402
from lol_trace import run_trace  # noqa: E402


class PilotEngineTests(unittest.TestCase):
    def test_every_lens_fixture_rebuilds_deterministically(self) -> None:
        for fixture in sorted((ROOT / "fixtures" / "pilot").iterdir()):
            expect_path = fixture / "expect.json"
            if not expect_path.exists():
                continue
            with self.subTest(example=fixture.name):
                source = (fixture / "source.py").read_text(encoding="utf-8").rstrip()
                expected = json.loads(expect_path.read_text(encoding="utf-8"))
                graph = analyze_source(source)
                self.assertEqual(graph["unsupported"], [])
                trace = run_trace(source, graph, [])
                self.assertNotIn("violation", trace)
                self.assertTrue(trace["steps"])
                kinds = {node["kind"] for node in graph["nodes"]}
                self.assertTrue(set(expected["expectedNodeKinds"]).issubset(kinds))
                final = trace["steps"][-1]["bindings"]
                for name, value in expected["expectedFinalBindings"].items():
                    self.assertEqual(final.get(name), value)

    def test_production_operators_are_supported(self) -> None:
        source = """def count_even(numbers):
    total = 0
    for number in numbers:
        if number % 2 == 0:
            total = total + 1
    return total

result = count_even([1, 2, 4, 7])"""
        graph = analyze_source(source)
        self.assertEqual(graph["unsupported"], [])
        trace = run_trace(source, graph, [])
        self.assertNotIn("violation", trace)
        self.assertEqual(trace["steps"][-1]["bindings"]["result"], "2")


if __name__ == "__main__":
    unittest.main()
