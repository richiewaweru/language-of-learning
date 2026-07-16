"""Create extra accumulate variations for PM3 gate (≥10)."""
from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1] / "fixtures" / "variations"
EXPECT = {
    "pattern": "ACCUMULATE",
    "stateBindingCount": 1,
    "loopCount": 1,
    "branchCount": 0,
    "mutationCount": 0,
    "returnsCount": 1,
}

VARIANTS: dict[str, tuple[str, list[str]]] = {
    "accumulate_floats": (
        "def sum_weights(weights):\n    total = 0.0\n    for w in weights:\n        total = total + w\n    return total\n",
        ["[1.5, 2.5]"],
    ),
    "accumulate_negatives": (
        "def net_change(deltas):\n    balance = 0\n    for d in deltas:\n        balance = balance + d\n    return balance\n",
        ["[-3, 5, -1]"],
    ),
    "accumulate_single": (
        "def only_one(items):\n    s = 0\n    for item in items:\n        s = s + item\n    return s\n",
        ["[42]"],
    ),
    "accumulate_five": (
        "def tally_five(xs):\n    running = 0\n    for x in xs:\n        running = running + x\n    return running\n",
        ["[1, 2, 3, 4, 5]"],
    ),
    "accumulate_with_zeros": (
        "def sum_allowing_zero(vals):\n    acc = 0\n    for v in vals:\n        acc = acc + v\n    return acc\n",
        ["[0, 0, 7]"],
    ),
    "accumulate_long_names": (
        "def compute_grand_total(invoice_line_amounts):\n"
        "    grand_total = 0\n"
        "    for invoice_line_amount in invoice_line_amounts:\n"
        "        grand_total = grand_total + invoice_line_amount\n"
        "    return grand_total\n",
        ["[100, 200]"],
    ),
    "accumulate_score_board": (
        "def board_total(points):\n    score = 0\n    for point in points:\n        score = score + point\n    return score\n",
        ["[3, 3, 4]"],
    ),
}


def main() -> None:
    for name, (source, args) in VARIANTS.items():
        d = ROOT / name
        d.mkdir(parents=True, exist_ok=True)
        (d / "source.py").write_text(source, encoding="utf-8")
        (d / "call.json").write_text(json.dumps({"argsRepr": args}, indent=2) + "\n", encoding="utf-8")
        (d / "expect.json").write_text(json.dumps(EXPECT, indent=2) + "\n", encoding="utf-8")
        print("wrote", name)


if __name__ == "__main__":
    main()
