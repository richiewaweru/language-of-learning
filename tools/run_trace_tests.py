from __future__ import annotations

import argparse
import json
import sys
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "packages" / "analyzer-python" / "src"))
sys.path.insert(0, str(ROOT / "packages" / "trace-runtime" / "src"))

from lol_analyzer import analyze_source  # noqa: E402
from lol_trace import canonical_json, run_trace  # noqa: E402
from lol_trace.sandbox import SandboxGuard, SandboxViolation  # noqa: E402


FIXTURES = ["accumulate", "count", "filter", "transform", "search", "guard", "array-update"]
CONTRAST_FIXTURES = ["print_total", "return_total"]
HOSTILE = ["infinite_loop", "huge_allocation", "eval_attempt", "import_attempt", "dunder_escape"]


class TraceFixtureTests(unittest.TestCase):
    def test_return_inside_for_stops_function_execution(self) -> None:
        source = (
            "def first_match(values):\n"
            "    for value in values:\n"
            "        if value > 5:\n"
            "            return value\n"
            "    return -1\n"
        )
        graph = analyze_source(source)
        trace = run_trace(source, graph, ["[2, 8, 12]"])
        self.assertEqual(trace["result"]["repr"], "8")
        returns = [step["event"]["repr"] for step in trace["steps"] if step["event"]["type"] == "return_exit"]
        self.assertEqual(returns, ["8"])

    maxDiff = None

    def test_call_enter_and_return_keywords(self) -> None:
        trace = load_trace("accumulate")
        events = [step["event"]["type"] for step in trace["steps"]]
        self.assertEqual(events[0], "call_enter")
        self.assertEqual(events[-1], "return_exit")
        self.assertEqual(trace["result"]["repr"], "20")

    def test_loop_and_state_change_keywords(self) -> None:
        trace = load_trace("accumulate")
        events = [step["event"]["type"] for step in trace["steps"]]
        self.assertIn("loop_advance", events)
        self.assertIn("state_change", events)
        self.assertGreaterEqual(events.count("state_change"), 3)

    def test_branch_and_append_keywords(self) -> None:
        trace = load_trace("filter")
        events = [step["event"]["type"] for step in trace["steps"]]
        self.assertIn("condition_eval", events)
        self.assertIn("collection_append", events)

    def test_print_effect_has_no_result_or_violation(self) -> None:
        trace = load_trace("print_total")
        effects = [step for step in trace["steps"] if step["event"]["type"] == "effect_fire"]
        self.assertEqual(len(effects), 1)
        self.assertEqual(effects[0]["event"]["repr"], "6")
        self.assertFalse(trace["truncated"])
        self.assertNotIn("violation", trace)
        self.assertNotIn("result", trace)

    def test_return_contrast_has_result(self) -> None:
        trace = load_trace("return_total")
        self.assertEqual(trace["steps"][-1]["event"]["type"], "return_exit")
        self.assertEqual(trace["result"]["repr"], "6")

    def test_print_argument_variants(self) -> None:
        cases = [
            ("def show():\n    print()", [], ""),
            ("def show(a, b):\n    print(a, b)", ["1", "2"], "1 2"),
        ]
        for source, args, expected in cases:
            graph = analyze_source(source)
            trace = run_trace(source, graph, args)
            self.assertEqual(trace["steps"][-1]["event"]["type"], "effect_fire")
            self.assertEqual(trace["steps"][-1]["event"]["repr"], expected)
            self.assertNotIn("result", trace)

    def test_print_keywords_remain_unsupported(self) -> None:
        source = "def show(value):\n    print(value, end='')"
        graph = analyze_source(source)
        trace = run_trace(source, graph, ["1"])
        self.assertEqual(trace["violation"]["construct"], "Call")
        self.assertEqual(trace["steps"][-1]["event"]["type"], "unsupported")

    def test_all_fixture_traces_match_expected(self) -> None:
        matched = 0
        for fixture in FIXTURES + CONTRAST_FIXTURES:
            first = load_trace(fixture)
            second = load_trace(fixture)
            expected = json.loads(
                (fixture_dir(fixture) / "expected.trace.json").read_text(encoding="utf-8")
            )
            self.assertEqual(first, expected, fixture)
            self.assertEqual(canonical_json(first), canonical_json(second), fixture)
            matched += 1
        self.assertEqual(matched, len(FIXTURES) + len(CONTRAST_FIXTURES))

    def test_alias_mutation_preserves_shared_object_identity(self) -> None:
        source = (
            "def alias_append():\n"
            "    values = []\n"
            "    alias = values\n"
            "    alias.append(3)\n"
            "    return values"
        )
        graph = analyze_source(source)
        self.assertEqual(graph["unsupported"], [])
        trace = run_trace(source, graph, [])
        mutation = next(
            step for step in trace["steps"] if step["event"]["type"] == "collection_append"
        )
        self.assertEqual(mutation["objectIds"]["alias"], mutation["objectIds"]["values"])
        self.assertEqual(trace["result"]["repr"], "[3]")

    def test_bounded_range_indexing_and_floor_division(self) -> None:
        source = (
            "def sample(values):\n"
            "    total = 0\n"
            "    for index in range(len(values)):\n"
            "        total = total + values[index]\n"
            "    middle = len(values) // 2\n"
            "    return middle"
        )
        graph = analyze_source(source)
        self.assertEqual(graph["unsupported"], [])
        trace = run_trace(source, graph, ["[2, 4, 6, 8]"])
        self.assertNotIn("violation", trace)
        self.assertEqual(trace["result"]["repr"], "2")
        events = [step["event"]["type"] for step in trace["steps"]]
        self.assertIn("supported_call", events)
        self.assertIn("indexed_selection", events)

    def test_recursion_is_an_explicit_unsupported_event(self) -> None:
        source = (
            "def countdown(value):\n"
            "    if value <= 0:\n"
            "        return 0\n"
            "    return countdown(value - 1)"
        )
        graph = analyze_source(source)
        self.assertTrue(any(region["construct"] == "recursion" for region in graph["unsupported"]))
        trace = run_trace(source, graph, ["2"])
        self.assertEqual(trace["violation"]["construct"], "recursion")
        self.assertEqual(trace["steps"][-1]["event"]["type"], "unsupported")


class HostileFixtureTests(unittest.TestCase):
    def test_all_hostile_fixtures_contained(self) -> None:
        contained = 0
        for name in HOSTILE:
            result = load_hostile(name)
            expected = json.loads((hostile_dir(name) / "expected.containment.json").read_text(encoding="utf-8"))
            self.assertTrue(result["contained"], name)
            self.assertEqual(result["violation"]["construct"], expected["construct"], name)
            self.assertIn("message", result["violation"])
            contained += 1
        self.assertEqual(contained, len(HOSTILE))


def fixture_dir(name: str) -> Path:
    return ROOT / "fixtures" / name


def hostile_dir(name: str) -> Path:
    return ROOT / "fixtures" / "hostile" / name


def load_trace(name: str) -> dict:
    source = (fixture_dir(name) / "source.py").read_text(encoding="utf-8").rstrip()
    graph = analyze_source(source)
    call = json.loads((fixture_dir(name) / "call.json").read_text(encoding="utf-8"))
    return run_trace(source, graph, call["argsRepr"])


def load_hostile(name: str) -> dict:
    source = (hostile_dir(name) / "source.py").read_text(encoding="utf-8").rstrip()
    call_path = hostile_dir(name) / "call.json"
    args_repr = json.loads(call_path.read_text(encoding="utf-8"))["argsRepr"] if call_path.exists() else []
    graph = analyze_source(source)
    has_function = any(node["kind"] == "function" for node in graph.get("nodes", []))
    if not has_function:
        guard = SandboxGuard()
        try:
            guard.check_source(source)
            guard.validate_args(args_repr)
            return {"contained": False, "violation": None, "truncated": False}
        except SandboxViolation as exc:
            return {
                "contained": True,
                "violation": exc.as_dict(),
                "truncated": exc.construct in {"step_limit", "timeout", "memory_limit", "collection_size"},
            }
    trace = run_trace(source, graph, args_repr)
    return {
        "contained": trace.get("violation") is not None or trace.get("truncated") is True,
        "violation": trace.get("violation"),
        "truncated": trace.get("truncated", False),
    }


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("keywords", nargs="*", help="Optional substrings to select tests")
    args = parser.parse_args()

    suite = unittest.TestSuite()
    suite.addTests(unittest.defaultTestLoader.loadTestsFromTestCase(TraceFixtureTests))
    suite.addTests(unittest.defaultTestLoader.loadTestsFromTestCase(HostileFixtureTests))

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
