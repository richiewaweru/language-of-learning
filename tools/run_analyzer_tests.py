from __future__ import annotations

import argparse
import json
import re
import sys
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "packages" / "analyzer-python" / "src"))

from lol_analyzer import analyze_source, canonical_json  # noqa: E402


FIXTURES = ["accumulate", "count", "filter", "transform", "search", "guard"]

# Contract N2: every node id is positional — <kind-prefix>-L<line>C<col> with an
# optional ordinal suffix that breaks positional collisions. No names, literals,
# or semantic guesses are ever encoded in an id.
POSITION_ID_RE = re.compile(r"^[a-z]+-L[0-9]+C[0-9]+(-[0-9]+)?$")


class AnalyzerFixtureTests(unittest.TestCase):
    maxDiff = None

    def test_function_return_shape_keywords(self) -> None:
        graph = load_graph("accumulate")
        kinds = [node["kind"] for node in graph["nodes"]]
        self.assertIn("function", kinds)
        self.assertIn("return", kinds)
        # Structural: the first node is the analyzed function, identified by its
        # name field (not by any name baked into the id).
        self.assertEqual(graph["nodes"][0]["kind"], "function")
        self.assertEqual(graph["nodes"][0]["name"], "calculate_total")

    def test_roles_loop_branch_keywords(self) -> None:
        graph = load_graph("count")
        roles = {
            node["name"]: node.get("role")
            for node in graph["nodes"]
            if node["kind"] == "binding"
        }
        self.assertEqual(roles["count"], "state")
        self.assertEqual(roles["n"], "iterator")
        self.assertTrue(any(node["kind"] == "loop" for node in graph["nodes"]))
        self.assertTrue(any(node["kind"] == "branch" for node in graph["nodes"]))

    def test_all_emitted_ids_match_position_regex(self) -> None:
        checked = 0
        for fixture in FIXTURES:
            graph = load_graph(fixture)
            for node in graph["nodes"]:
                self.assertRegex(
                    node["id"],
                    POSITION_ID_RE,
                    f"{fixture}: id {node['id']!r} is not position-based",
                )
                checked += 1
        self.assertGreater(checked, 0)

    def test_mutation_unsupported_keywords(self) -> None:
        graph = load_graph("filter")
        relation_types = [rel["type"] for rel in graph["relations"]]
        self.assertIn("mutates", relation_types)
        unsupported = analyze_source("while True:\n    break\n")
        self.assertTrue(unsupported["unsupported"])

    def test_filter_emits_mutation_node_and_mutates_relation(self) -> None:
        """Guards against a silent second visit_stmt that drops Expr handling."""
        graph = load_graph("filter")
        mutations = [n for n in graph["nodes"] if n["kind"] == "mutation"]
        self.assertEqual(len(mutations), 1, mutations)
        self.assertTrue(
            any(
                r["type"] == "mutates" and r["from"] == mutations[0]["id"]
                for r in graph["relations"]
            ),
            graph["relations"],
        )
        analyzer_path = (
            ROOT / "packages" / "analyzer-python" / "src" / "lol_analyzer" / "analyzer.py"
        )
        text = analyzer_path.read_text(encoding="utf-8")
        self.assertEqual(text.count("def visit_stmt"), 1)

    def test_structural_v1_nodes_are_factual_and_supported(self) -> None:
        source = (
            "def bounded(values):\n"
            "    first = values[0]\n"
            "    for index in range(len(values)):\n"
            "        values[index] = first\n"
            "    while first < len(values):\n"
            "        first = first + 1\n"
            "    return values"
        )
        graph = analyze_source(source)
        self.assertEqual(graph["unsupported"], [])
        kinds = {node["kind"] for node in graph["nodes"]}
        self.assertTrue({"call", "operation", "loop", "mutation"} <= kinds)
        calls = {node["callee"] for node in graph["nodes"] if node["kind"] == "call"}
        self.assertEqual(calls, {"len", "range"})
        self.assertTrue(any(node.get("mutationType") == "indexed-assignment" for node in graph["nodes"]))

    def test_all_fixture_graphs_match_expected(self) -> None:
        matched = 0
        for fixture in FIXTURES:
            actual = canonical_json(load_graph(fixture))
            expected = (fixture_dir(fixture) / "expected.graph.json").read_text(encoding="utf-8")
            self.assertEqual(actual, expected, fixture)
            matched += 1
        self.assertEqual(matched, 6)


def fixture_dir(name: str) -> Path:
    return ROOT / "fixtures" / name


def load_graph(name: str) -> dict:
    source = (fixture_dir(name) / "source.py").read_text(encoding="utf-8").rstrip()
    return analyze_source(source)


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("keywords", nargs="*", help="Optional substrings to select tests")
    args = parser.parse_args()

    suite = unittest.defaultTestLoader.loadTestsFromTestCase(AnalyzerFixtureTests)
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
