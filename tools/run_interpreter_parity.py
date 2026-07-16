"""Interpreter ↔ CPython operator parity (ADR-0008).

Compares the purpose-built tracer evaluator against CPython for every
supported binop, comparison, and unary minus under sandbox-safe literals.
"""

from __future__ import annotations

import ast
import sys
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "packages" / "analyzer-python" / "src"))
sys.path.insert(0, str(ROOT / "packages" / "trace-runtime" / "src"))

from lol_analyzer import analyze_source  # noqa: E402
from lol_trace.tracer import Tracer  # noqa: E402

MIN_SOURCE = "def f(x):\n    return x\n"


def cpython_eval(expr: str) -> object:
    return eval(expr, {"__builtins__": {}}, {})


class InterpreterParityTests(unittest.TestCase):
    def setUp(self) -> None:
        graph = analyze_source(MIN_SOURCE)
        self.tracer = Tracer(MIN_SOURCE, graph, ["1"])
        self.tracer.env = {}

    def _eval(self, src: str) -> object:
        tree = ast.parse(src, mode="eval")
        return self.tracer._eval_expr(tree.body)

    def test_binops(self) -> None:
        for expr in ["1 + 2", "10 - 3", "4 * 5", "9 / 2", "0 + 0", "7 - 10"]:
            with self.subTest(expr=expr):
                self.assertEqual(self._eval(expr), cpython_eval(expr))

    def test_unary_minus(self) -> None:
        for expr in ["-3", "-0", "-2.5"]:
            with self.subTest(expr=expr):
                self.assertEqual(self._eval(expr), cpython_eval(expr))

    def test_comparisons(self) -> None:
        cases = [
            ("1 > 0", True),
            ("1 < 0", False),
            ("2 >= 2", True),
            ("2 <= 1", False),
            ("3 == 3", True),
            ("3 != 4", True),
        ]
        for expr, expected in cases:
            with self.subTest(expr=expr):
                tree = ast.parse(expr, mode="eval")
                result = self.tracer._eval_condition(tree.body)
                self.assertEqual(result, expected)
                self.assertEqual(result, cpython_eval(expr))


if __name__ == "__main__":
    runner = unittest.TextTestRunner(verbosity=2)
    result = runner.run(unittest.defaultTestLoader.loadTestsFromTestCase(InterpreterParityTests))
    raise SystemExit(0 if result.wasSuccessful() else 1)
