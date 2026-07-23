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

CORPUS = json.loads(
    (ROOT / "tests" / "corpus" / "module-execution" / "acceptance.json").read_text(
        encoding="utf-8"
    )
)


class ModuleExecutionAcceptanceTests(unittest.TestCase):
    def test_acceptance_corpus(self) -> None:
        for case in CORPUS["cases"]:
            with self.subTest(case=case["id"]):
                graph = analyze_source(case["source"])
                trace = run_trace(case["source"], graph, [])
                self.assertEqual(trace["scope"]["kind"], "module")
                self.assertNotIn("call", trace)
                if case.get("expectedFunctionCall"):
                    frame_ids = {step["frameId"] for step in trace["steps"]}
                    self.assertIn("frame:module", frame_ids)
                    self.assertTrue(any(frame.startswith("frame:fn-") for frame in frame_ids))
                else:
                    self.assertTrue(
                        all(step["frameId"] == "frame:module" for step in trace["steps"])
                    )

                if case.get("expectedEmpty"):
                    self.assertEqual(trace["steps"], [])
                    self.assertNotIn("violation", trace)
                    continue

                expected_violation = case.get("expectedViolationConstruct")
                if expected_violation:
                    self.assertEqual(
                        trace.get("violation", {}).get("construct"),
                        expected_violation,
                    )
                    self.assertEqual(trace["steps"], [])
                    final = {}
                else:
                    self.assertNotIn("violation", trace)
                    self.assertGreaterEqual(
                        len(trace["steps"]), case.get("expectedMinimumSteps", 1)
                    )
                    final = trace["steps"][-1]["bindings"]
                    for name, expected in case.get(
                        "expectedFinalBindings", {}
                    ).items():
                        self.assertEqual(final.get(name), expected)
                    expected_lines = case.get("expectedActiveLines", [])
                    actual_lines = [step["line"] for step in trace["steps"]]
                    for line in expected_lines:
                        self.assertIn(line, actual_lines)

                for name in case.get("forbiddenFinalBindings", []):
                    self.assertNotIn(name, final)


if __name__ == "__main__":
    unittest.main(verbosity=2)
