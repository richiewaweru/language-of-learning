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


FIXTURES = ["accumulate", "count", "filter", "transform", "search", "guard"]
HOSTILE = ["infinite_loop", "huge_allocation", "eval_attempt", "import_attempt", "dunder_escape"]


class TraceFixtureTests(unittest.TestCase):
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

    def test_all_fixture_traces_match_expected(self) -> None:
        matched = 0
        for fixture in FIXTURES:
            first = load_trace(fixture)
            second = load_trace(fixture)
            expected = json.loads(
                (fixture_dir(fixture) / "expected.trace.json").read_text(encoding="utf-8")
            )
            self.assertEqual(first, expected, fixture)
            self.assertEqual(canonical_json(first), canonical_json(second), fixture)
            matched += 1
        self.assertEqual(matched, 6)

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
