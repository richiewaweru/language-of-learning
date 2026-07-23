"""Regression tests for atomic POST /analyze rejections."""
from __future__ import annotations

import sys
from pathlib import Path
from typing import Final

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from fastapi.testclient import TestClient  # noqa: E402

from apps.api.main import app  # noqa: E402

BUILTIN_SHADOWING_MESSAGE: Final = (
    "This pilot does not support shadowing built-in function names. "
    "Rename the parameter or local variable."
)
ENUMERATE_MESSAGE: Final = (
    "Enumerate is not yet supported in this pilot. "
    "Use an index-based range(len(values)) loop for now."
)

REJECTION_CASES: Final = (
    (
        "built-in shadowing",
        "def calculate(max, values):\n    return max(values)\n",
        ["[1, 2, 3]"],
        "UNSUPPORTED_BUILTIN_SHADOWING",
        BUILTIN_SHADOWING_MESSAGE,
    ),
    (
        "enumerate",
        (
            "def indexed_total(values):\n"
            "    total = 0\n"
            "    for index, value in enumerate(values):\n"
            "        total = total + index + value\n"
            "    return total\n"
        ),
        ["[1, 2, 3]"],
        "UNSUPPORTED_ENUMERATE",
        ENUMERATE_MESSAGE,
    ),
)


def test_atomic_rejections() -> None:
    client = TestClient(app)
    for label, source, args_repr, expected_code, expected_message in REJECTION_CASES:
        response = client.post(
            "/analyze",
            json={"source": source, "argsRepr": args_repr},
        )
        assert response.status_code == 200, response.text
        body = response.json()

        assert body["graph"]["nodes"] == [], body
        assert body["graph"]["relations"] == [], body
        assert body["trace"]["steps"] == [], body
        assert "result" not in body["trace"], body
        assert body["violation"]["code"] == expected_code, body["violation"]
        assert body["violation"]["message"] == expected_message, body["violation"]
        print(f"  ok {label}: {expected_code}, no partial artifacts")


def test_module_execution() -> None:
    client = TestClient(app)
    response = client.post(
        "/analyze",
        json={
            "source": "price = 100\ntax = price * 0.16\ntotal = price + tax",
            "argsRepr": [],
        },
    )
    assert response.status_code == 200, response.text
    body = response.json()
    assert body["violation"] is None, body
    assert body["trace"]["scope"] == {
        "kind": "module",
        "id": "module:main",
        "label": "Program",
    }, body
    assert "call" not in body["trace"], body
    assert len(body["trace"]["steps"]) == 3, body
    assert body["trace"]["steps"][-1]["bindings"] == {
        "price": "100",
        "tax": "16.0",
        "total": "116.0",
    }, body
    assert all(step["frameId"] == "frame:module" for step in body["trace"]["steps"]), body
    assert any(node["kind"] == "module" for node in body["graph"]["nodes"]), body
    print("  ok module execution: three verified steps and exact final bindings")


def main() -> int:
    test_atomic_rejections()
    test_module_execution()
    print(f"api-analyze: {len(REJECTION_CASES) + 1} contract and rejection tests passed")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
