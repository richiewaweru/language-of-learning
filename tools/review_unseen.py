from __future__ import annotations

import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "packages" / "analyzer-python" / "src"))

from lol_analyzer import analyze_source  # noqa: E402


def main() -> int:
    cases = [
        {
            "name": "accumulate_budget",
            "source": "def total_budget(items):\n    total = 0\n    for item in items:\n        total = total + item\n    return total\n",
            "checks": [
                has_kind("loop"),
                has_binding_role("bind-total", "state"),
                has_node("op-add"),
            ],
        },
        {
            "name": "count_evens",
            "source": "def count_evens(values):\n    count = 0\n    for value in values:\n        if value > 0:\n            count = count + 1\n    return count\n",
            "checks": [
                has_kind("branch"),
                has_binding_role("bind-count", "state"),
                relation_exists("op-inc", "writes", "bind-count"),
            ],
        },
        {
            "name": "filter_winners",
            "source": "def keep_winners(scores):\n    winners = []\n    for score in scores:\n        if score > 10:\n            winners.append(score)\n    return winners\n",
            "checks": [
                has_kind("mutation"),
                relation_exists("mut-append", "mutates", "coll-winners"),
            ],
        },
        {
            "name": "transform_double",
            "source": "def scale(values):\n    scaled = []\n    for value in values:\n        scaled.append(value * 2)\n    return scaled\n",
            "checks": [
                has_kind("collection"),
                relation_exists("op-mul", "feeds", "mut-append"),
            ],
        },
        {
            "name": "search_first_match",
            "source": "def first_match(values):\n    for value in values:\n        if value > 9:\n            return value\n    return -1\n",
            "checks": [
                has_return("ret-early", "bind-value"),
                has_return("ret-fallback", "val-neg1"),
            ],
        },
        {
            "name": "guard_tax_rate",
            "source": "def tax(amount):\n    rate = 0.2\n    if amount <= 0:\n        return 0\n    return amount * rate\n",
            "checks": [
                has_binding_role("bind-rate", "constant"),
                has_return("ret-zero", "val-zero"),
                relation_exists("op-mul", "reads", "bind-rate"),
            ],
        },
        {
            "name": "unsupported_while",
            "source": "def loop_forever(values):\n    while True:\n        return values\n",
            "checks": [unsupported_contains("While")],
        },
        {
            "name": "unsupported_import",
            "source": "import math\n\ndef radius(x):\n    return x\n",
            "checks": [unsupported_contains("Import")],
        },
        {
            "name": "unsupported_nested_function",
            "source": "def outer(x):\n    def inner(y):\n        return y\n    return x\n",
            "checks": [unsupported_contains("FunctionDef")],
        },
        {
            "name": "local_binding_not_constant",
            "source": "def combine(amount, bonus):\n    total = amount + bonus\n    return total\n",
            "checks": [
                has_binding_role("bind-total", "local"),
                relation_exists("op-add", "writes", "bind-total"),
            ],
        },
    ]

    reviewed = 0
    lines = ["## P1 unseen review", ""]
    for case in cases:
        graph = analyze_source(case["source"].rstrip())
        for check in case["checks"]:
            check(graph)
        reviewed += 1
        lines.append(f"- {case['name']}: reviewed")

    build_log = ROOT / "BUILD-LOG.md"
    existing = build_log.read_text(encoding="utf-8")
    marker = "## P1 unseen review"
    if marker in existing:
        existing = existing.split(marker)[0].rstrip() + "\n\n"
    build_log.write_text(existing + "\n".join(lines) + "\n", encoding="utf-8")
    print(f"{reviewed}/10 reviewed")
    return 0


def has_kind(kind: str):
    def check(graph: dict) -> None:
        assert any(node["kind"] == kind for node in graph["nodes"]), kind

    return check


def has_binding_role(node_id: str, role: str):
    def check(graph: dict) -> None:
        node = next(node for node in graph["nodes"] if node["id"] == node_id)
        assert node["role"] == role, (node_id, role, node)

    return check


def has_node(node_id: str):
    def check(graph: dict) -> None:
        assert any(node["id"] == node_id for node in graph["nodes"]), node_id

    return check


def relation_exists(from_id: str, rel_type: str, to_id: str):
    def check(graph: dict) -> None:
        assert {"from": from_id, "type": rel_type, "to": to_id} in graph["relations"], (
            from_id,
            rel_type,
            to_id,
        )

    return check


def has_return(node_id: str, value_ref: str):
    def check(graph: dict) -> None:
        node = next(node for node in graph["nodes"] if node["id"] == node_id)
        assert node["valueRef"] == value_ref, (node_id, value_ref, node)

    return check


def unsupported_contains(construct: str):
    def check(graph: dict) -> None:
        assert any(construct in item["construct"] for item in graph["unsupported"]), construct

    return check


if __name__ == "__main__":
    raise SystemExit(main())
