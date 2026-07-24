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
from lol_trace.tracer import Tracer  # noqa: E402

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
                frozen_graph = case_dir / "expected-graph.json"
                if frozen_graph.exists():
                    self.assertEqual(graph, load_json(frozen_graph), f"{case_dir.name} graph regression lock")
                actual_traces = []
                for run_index, run in enumerate(inputs):
                    trace = run_trace(source, graph, run["argsRepr"])
                    actual_traces.append(trace)
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
                frozen_trace = case_dir / "expected-trace.json"
                if frozen_trace.exists():
                    self.assertEqual({"runs": actual_traces}, load_json(frozen_trace), f"{case_dir.name} trace regression lock")
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
        self.assertEqual(
            graph["unsupported"][0]["code"],
            "UNSUPPORTED_TRUE_DIVISION_ASSIGNMENT",
        )
        self.assertEqual(graph["nodes"], [])


class HardeningCorpusTests(unittest.TestCase):
    maxDiff = None

    def assert_atomic_rejection(
        self,
        source: str,
        code: str,
        message: str | None = None,
    ) -> None:
        graph = analyze_source(source)
        self.assertEqual(graph["nodes"], [])
        self.assertEqual(graph["relations"], [])
        self.assertTrue(graph["unsupported"])
        rejection = graph["unsupported"][0]
        self.assertEqual(rejection["code"], code)
        if message is not None:
            self.assertEqual(rejection["message"], message)
        trace = run_trace(source, graph, [])
        self.assertEqual(trace["steps"], [])
        self.assertNotIn("result", trace)
        self.assertEqual(trace["violation"]["code"], code)
        if message is not None:
            self.assertEqual(trace["violation"]["message"], message)

    def test_p01_literal_list_parity(self) -> None:
        source = (
            "def literal_list():\n"
            "    values = [1, 2, 3]\n"
            "    return values"
        )
        graph = analyze_source(source)
        self.assertEqual(graph["unsupported"], [])
        collection = next(node for node in graph["nodes"] if node["kind"] == "collection")
        self.assertEqual(collection["items"], ["1", "2", "3"])
        tracer = Tracer(source, graph, [])
        trace = tracer.run()
        self.assertNotIn("violation", trace)
        self.assertEqual(value_from_repr(trace["result"]["repr"]), [1, 2, 3])
        self.assertEqual(tracer.sandbox.memory_estimate, 64)

    def test_p02_empty_list_still_works(self) -> None:
        source = "def empty_list():\n    values = []\n    return values"
        graph = analyze_source(source)
        collection = next(node for node in graph["nodes"] if node["kind"] == "collection")
        self.assertEqual(collection["items"], [])
        trace = run_trace(source, graph, [])
        self.assertEqual(value_from_repr(trace["result"]["repr"]), [])

    def test_p03_separate_list_identity(self) -> None:
        source = (
            "def separate_lists():\n"
            "    left = [1]\n"
            "    right = [1]\n"
            "    left.append(2)\n"
            "    return right"
        )
        graph = analyze_source(source)
        self.assertEqual(graph["unsupported"], [])
        trace = run_trace(source, graph, [])
        self.assertNotIn("violation", trace)
        self.assertEqual(value_from_repr(trace["result"]["repr"]), [1])
        append_step = next(
            step for step in trace["steps"] if step["event"]["type"] == "collection_append"
        )
        self.assertNotIn("objectIds", append_step)

    def test_p04_aliasing_remains_honest(self) -> None:
        source = (
            "def alias_list():\n"
            "    left = [1]\n"
            "    right = left\n"
            "    left.append(2)\n"
            "    return right"
        )
        graph = analyze_source(source)
        self.assertEqual(graph["unsupported"], [])
        trace = run_trace(source, graph, [])
        self.assertNotIn("violation", trace)
        self.assertEqual(value_from_repr(trace["result"]["repr"]), [1, 2])
        append_step = next(
            step for step in trace["steps"] if step["event"]["type"] == "collection_append"
        )
        self.assertEqual(append_step["objectIds"]["left"], append_step["objectIds"]["right"])

    def test_p05_unsupported_list_element_rejects_atomically(self) -> None:
        source = (
            "def invalid_list(value):\n"
            "    values = [helper(value)]\n"
            "    return values"
        )
        self.assert_atomic_rejection(source, "UNSUPPORTED_HELPER_FUNCTION")

    def test_p06_parameter_shadowing_rejects_atomically(self) -> None:
        message = (
            "Lens does not support shadowing built-in function names. "
            "Rename the parameter or local variable."
        )
        for name in ("len", "range", "min", "max", "sum", "abs", "print"):
            with self.subTest(name=name):
                source = f"def calculate({name}, values):\n    return {name}(values)"
                self.assert_atomic_rejection(
                    source,
                    "UNSUPPORTED_BUILTIN_SHADOWING",
                    message,
                )

    def test_p07_local_shadowing_rejects_atomically(self) -> None:
        source = (
            "def calculate(values):\n"
            "    sum = 4\n"
            "    return sum(values)"
        )
        self.assert_atomic_rejection(source, "UNSUPPORTED_BUILTIN_SHADOWING")

    def test_shadowing_binding_forms_are_detected(self) -> None:
        cases = {
            "assignment": "def f(values):\n    max = 1\n    return max(values)",
            "loop-target": (
                "def f(values):\n"
                "    for max in values:\n"
                "        max = max\n"
                "    return max(values)"
            ),
            "augmented-target": "def f(values):\n    max += 1\n    return max(values)",
        }
        for binding_form, source in cases.items():
            with self.subTest(binding_form=binding_form):
                self.assert_atomic_rejection(
                    source,
                    "UNSUPPORTED_BUILTIN_SHADOWING",
                )

    def test_all_deferred_list_methods_reject_atomically(self) -> None:
        calls = ("values.pop()", "values.insert(0, 1)", "values.remove(1)")
        for call in calls:
            with self.subTest(call=call):
                source = f"def update(values):\n    {call}\n    return values"
                self.assert_atomic_rejection(source, "UNSUPPORTED_LIST_METHOD")

    def test_tuple_swaps_membership_and_nested_access_use_specific_codes(self) -> None:
        cases = {
            "indexed-swap": (
                "def swap(values):\n"
                "    values[0], values[1] = values[1], values[0]\n"
                "    return values",
                "UNSUPPORTED_TUPLE_UNPACKING",
            ),
            "not-in": (
                "def missing(values, target):\n"
                "    return target not in values",
                "UNSUPPORTED_MEMBERSHIP",
            ),
            "nested-access": (
                "def pick(values):\n"
                "    return values[0][0]",
                "UNSUPPORTED_NESTED_LIST",
            ),
        }
        for case, (source, code) in cases.items():
            with self.subTest(case=case):
                self.assert_atomic_rejection(source, code)

    def test_p08_non_called_special_name_is_an_ordinary_read(self) -> None:
        source = "def calculate(sum):\n    return sum + 1"
        graph = analyze_source(source)
        self.assertEqual(graph["unsupported"], [])
        parameter = next(
            node
            for node in graph["nodes"]
            if node["kind"] == "binding" and node["name"] == "sum"
        )
        operation = next(node for node in graph["nodes"] if node["kind"] == "operation")
        self.assertIn(
            {"from": operation["id"], "type": "reads", "to": parameter["id"]},
            graph["relations"],
        )
        trace = run_trace(source, graph, ["4"])
        self.assertNotIn("violation", trace)
        self.assertEqual(value_from_repr(trace["result"]["repr"]), 5)

    def test_p09_normal_special_builtins_remain_verified(self) -> None:
        source = (
            "def show(values):\n"
            "    size = len(values)\n"
            "    for index in range(size):\n"
            "        print(index)\n"
            "    return max(values)"
        )
        graph = analyze_source(source)
        self.assertEqual(graph["unsupported"], [])
        trace = run_trace(source, graph, ["[3, 8]"])
        self.assertNotIn("violation", trace)
        self.assertEqual(value_from_repr(trace["result"]["repr"]), 8)
        event_types = [step["event"]["type"] for step in trace["steps"]]
        self.assertIn("supported_call", event_types)
        self.assertIn("effect_fire", event_types)
        self.assertIn("builtin-evaluated", event_types)


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
        self.assertEqual(checked, len(list((CORPUS / "negative").iterdir())))


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
    suite.addTests(unittest.defaultTestLoader.loadTestsFromTestCase(HardeningCorpusTests))
    suite.addTests(unittest.defaultTestLoader.loadTestsFromTestCase(NegativeCorpusTests))
    result = unittest.TextTestRunner(verbosity=2).run(suite)
    return 0 if result.wasSuccessful() else 1


if __name__ == "__main__":
    raise SystemExit(main())
