from __future__ import annotations

import argparse
import ast
import json
import sys
import unittest
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "packages" / "analyzer-python" / "src"))
sys.path.insert(0, str(ROOT / "packages" / "trace-runtime" / "src"))

from lol_analyzer import analyze_source  # noqa: E402
from lol_trace import run_trace  # noqa: E402

CORPUS = ROOT / "tests" / "corpus"


def load_json(path: Path) -> Any:
    return json.loads(path.read_text(encoding="utf-8"))


def value_from_repr(value: str) -> Any:
    return ast.literal_eval(value)


def assert_ordered(test: unittest.TestCase, actual: list[str], required: list[str]) -> None:
    cursor = 0
    for event_type in actual:
        if cursor < len(required) and event_type == required[cursor]:
            cursor += 1
    test.assertEqual(cursor, len(required), f"missing ordered subsequence {required!r} in {actual!r}")


class WaveACorpusTests(unittest.TestCase):
    maxDiff = None

    def test_positive_corpus(self) -> None:
        checked = 0
        for case_dir in sorted((CORPUS / "wave-a").iterdir()):
            with self.subTest(case=case_dir.name):
                source = (case_dir / "source.py").read_text(encoding="utf-8").rstrip()
                inputs = load_json(case_dir / "input.json")["runs"]
                expected_structure = load_json(case_dir / "expected-structure.json")
                expected_events = load_json(case_dir / "expected-events.json")["runs"]
                expected_results = load_json(case_dir / "expected-result.json")["runs"]
                graph = analyze_source(source)
                self.assertEqual(graph["unsupported"], [], case_dir.name)
                kinds = [node["kind"] for node in graph["nodes"]]
                for kind in expected_structure.get("requiredNodeKinds", []):
                    self.assertIn(kind, kinds)
                for kind in expected_structure.get("forbiddenNodeKinds", []):
                    self.assertNotIn(kind, kinds)
                nodes_by_id = {node["id"]: node for node in graph["nodes"]}
                for requirement in expected_structure.get("requiredRelations", []):
                    self.assertTrue(
                        any(
                            relation["type"] == requirement["type"]
                            and nodes_by_id.get(relation["from"], {}).get("kind") == requirement["fromKind"]
                            and nodes_by_id.get(relation["to"], {}).get("kind") == requirement["toKind"]
                            for relation in graph["relations"]
                        ),
                        requirement,
                    )
                for requirement in expected_structure.get("requiredNodeProperties", []):
                    self.assertTrue(
                        any(all(node.get(key) == value for key, value in requirement.items()) for node in graph["nodes"]),
                        requirement,
                    )
                for run_index, run in enumerate(inputs):
                    trace = run_trace(source, graph, run["argsRepr"])
                    self.assertNotIn("violation", trace, f"{case_dir.name} run {run_index}")
                    actual_types = [step["event"]["type"] for step in trace["steps"]]
                    event_expectation = expected_events[run_index]
                    for event_type in event_expectation.get("required", []):
                        self.assertIn(event_type, actual_types)
                    for event_type in event_expectation.get("forbidden", []):
                        self.assertNotIn(event_type, actual_types)
                    assert_ordered(self, actual_types, event_expectation.get("ordered", []))
                    for event_type, count in event_expectation.get("counts", {}).items():
                        self.assertEqual(actual_types.count(event_type), count)
                    result_expectation = expected_results[run_index]
                    self.assertEqual(value_from_repr(trace["result"]["repr"]), result_expectation["return"])
                    final_bindings = trace["steps"][-1]["bindings"]
                    for name, expected_value in result_expectation.get("finalBindings", {}).items():
                        self.assertIn(name, final_bindings)
                        self.assertEqual(value_from_repr(final_bindings[name]), expected_value)
                checked += 1
        self.assertEqual(checked, 15)

    def test_all_augmented_assignment_operators(self) -> None:
        cases = [("+=", 9), ("-=", 3), ("*=", 18), ("//=", 2), ("%=", 0)]
        for operator, expected in cases:
            with self.subTest(operator=operator):
                source = f"def update(value):\n    value {operator} 3\n    return value"
                graph = analyze_source(source)
                self.assertEqual(graph["unsupported"], [])
                kinds = [node["kind"] for node in graph["nodes"]]
                self.assertIn("operation", kinds)
                self.assertIn("mutation", kinds)
                trace = run_trace(source, graph, ["6"])
                self.assertNotIn("violation", trace)
                self.assertEqual(value_from_repr(trace["result"]["repr"]), expected)

    def test_true_division_assignment_stays_out_of_scope(self) -> None:
        source = "def update(value):\n    value /= 2\n    return value"
        graph = analyze_source(source)
        self.assertTrue(graph["unsupported"])
        self.assertEqual(graph["nodes"], [])


class NegativeCorpusTests(unittest.TestCase):
    maxDiff = None

    def test_negative_corpus_is_atomic_and_canonical(self) -> None:
        checked = 0
        for case_dir in sorted((CORPUS / "negative").iterdir()):
            with self.subTest(case=case_dir.name):
                source = (case_dir / "source.py").read_text(encoding="utf-8").rstrip()
                expected = load_json(case_dir / "expected-events.json")
                graph = analyze_source(source)
                self.assertEqual(graph["nodes"], [])
                self.assertEqual(graph["relations"], [])
                self.assertTrue(graph["unsupported"])
                rejection = graph["unsupported"][0]
                self.assertEqual(rejection["code"], expected["code"])
                self.assertEqual(rejection["message"], expected["message"])
                trace = run_trace(source, graph, [])
                self.assertEqual(trace["steps"], [])
                self.assertNotIn("result", trace)
                self.assertEqual(trace["violation"]["code"], expected["code"])
                self.assertEqual(trace["violation"]["message"], expected["message"])
                checked += 1
        self.assertEqual(checked, 10)


def freeze_goldens() -> None:
    for case_dir in sorted((CORPUS / "wave-a").iterdir()):
        source = (case_dir / "source.py").read_text(encoding="utf-8").rstrip()
        graph = analyze_source(source)
        runs = load_json(case_dir / "input.json")["runs"]
        traces = [run_trace(source, graph, run["argsRepr"]) for run in runs]
        (case_dir / "expected-graph.json").write_text(json.dumps(graph, indent=2) + "\n", encoding="utf-8")
        (case_dir / "expected-trace.json").write_text(json.dumps({"runs": traces}, indent=2) + "\n", encoding="utf-8")


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--freeze", action="store_true")
    args = parser.parse_args()
    if args.freeze:
        freeze_goldens()
        return 0
    suite = unittest.TestSuite()
    suite.addTests(unittest.defaultTestLoader.loadTestsFromTestCase(WaveACorpusTests))
    suite.addTests(unittest.defaultTestLoader.loadTestsFromTestCase(NegativeCorpusTests))
    result = unittest.TextTestRunner(verbosity=2).run(suite)
    return 0 if result.wasSuccessful() else 1


if __name__ == "__main__":
    raise SystemExit(main())
