from __future__ import annotations

import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PACK = ROOT / "docs" / "structural-code-lens" / "v1"
sys.path.insert(0, str(ROOT / "packages" / "analyzer-python" / "src"))
sys.path.insert(0, str(ROOT / "packages" / "trace-runtime" / "src"))

from lol_analyzer import analyze_source  # noqa: E402
from lol_trace import canonical_json, run_trace  # noqa: E402


def require(path: Path) -> None:
    if not path.exists() or path.stat().st_size == 0:
        raise SystemExit(f"missing required artifact: {path.relative_to(ROOT)}")


def case_source(case: dict[str, object]) -> str:
    source = case.get("source")
    if isinstance(source, str):
        return source
    fixture = case.get("fixture")
    assert isinstance(fixture, str)
    return (ROOT / "fixtures" / fixture / "source.py").read_text(encoding="utf-8").rstrip()


def evidenced_primitives(graph: dict, trace: dict) -> set[str]:
    nodes = graph["nodes"]
    events = [step["event"]["type"] for step in trace["steps"]]
    primitives: set[str] = set()
    if any(node["kind"] == "collection" for node in nodes) or any(
        value.startswith("[") for step in trace["steps"] for value in step["bindings"].values()
    ):
        primitives.add("collection")
    if any(node["kind"] == "loop" for node in nodes):
        primitives.add("loop")
    if any(event in {"loop_advance", "indexed_selection", "indexed_mutation"} for event in events):
        primitives.add("cursor")
    if any(node.get("role") == "state" for node in nodes):
        primitives.add("state")
    if any(node["kind"] == "return" for node in nodes):
        primitives.add("return")
    if any(node["kind"] == "branch" for node in nodes):
        primitives.update({"branch", "comparison"})
    if "loop_test" in events:
        primitives.add("comparison")
    if any(node["kind"] == "mutation" for node in nodes):
        primitives.add("mutation")
    if any(node["kind"] == "operation" for node in nodes):
        primitives.add("generic-operation")
    if "supported_call" in events:
        primitives.add("generic-operation")
    if any(node["kind"] == "call" for node in nodes) or "call_enter" in events:
        primitives.add("call-frame")
    if "loop_test" in events or any(
        node["kind"] == "call" and node.get("callee") == "range" for node in nodes
    ):
        primitives.add("range")
    if any(step.get("objectIds") for step in trace["steps"]):
        primitives.add("reference")
    if graph["unsupported"] or "unsupported" in events:
        primitives.add("unsupported")
    return primitives


def verify_executable_case(case: dict[str, object]) -> None:
    case_id = str(case["id"])
    source = case_source(case)
    args_repr = case.get("argsRepr")
    expected_events = case.get("expectedEvents")
    assert isinstance(args_repr, list), f"{case_id}: argsRepr is required"
    assert isinstance(expected_events, list) and expected_events, f"{case_id}: expectedEvents is required"
    graph = analyze_source(source)
    first = run_trace(source, graph, args_repr)
    second = run_trace(source, graph, args_repr)
    assert canonical_json(first) == canonical_json(second), f"{case_id}: trace is not deterministic"
    actual_events = [step["event"]["type"] for step in first["steps"]]
    if "violation" in first:
        actual_events.append("unsupported")
    for expected in expected_events:
        assert expected in actual_events, f"{case_id}: missing event {expected}"
    expected_result = case.get("expectedResultRepr")
    if expected_result is None:
        assert "result" not in first, f"{case_id}: unexpectedly returned {first.get('result')}"
    else:
        assert first.get("result", {}).get("repr") == expected_result, f"{case_id}: wrong result"
    expected_violation = case.get("expectedViolation")
    if expected_violation is None:
        assert not graph["unsupported"], f"{case_id}: analyzer reported unsupported facts"
        assert "violation" not in first, f"{case_id}: runtime violation {first.get('violation')}"
    else:
        assert first.get("violation", {}).get("construct") == expected_violation, f"{case_id}: wrong violation"
        assert graph["unsupported"], f"{case_id}: missing analyzer unsupported region"
        assert first["steps"] == [], f"{case_id}: rejected source leaked partial trace steps"
        assert "result" not in first, f"{case_id}: rejected source leaked a result"
    expected_primitives = set(case["expectedPrimitives"])
    missing = expected_primitives - evidenced_primitives(graph, first)
    assert not missing, f"{case_id}: primitives lack executable evidence: {sorted(missing)}"


def main() -> int:
    required_pack = [
        "00_README.md",
        "01_MASTER_PROPOSAL.md",
        "02_ARCHITECTURE_AND_VIEW_ADR.md",
        "03_SYMBOL_GRAMMAR_AND_ASSET_SPEC.md",
        "04_SYMBOL_MANIFEST.json",
        "05_IMPLEMENTATION_ROADMAP.md",
        "06_VIEW_REDESIGN_SPECS.md",
        "07_TEST_ACCEPTANCE_AND_CODEX_BRIEF.md",
        "index.html",
        "assets/lens-symbol-reference.svg",
        "schemas/semantic-model.ts",
    ]
    for relative in required_pack:
        require(PACK / relative)

    manifest = json.loads((PACK / "04_SYMBOL_MANIFEST.json").read_text(encoding="utf-8"))
    assert manifest["grammarVersion"] == "1.0.0"
    assert manifest["semanticModelVersion"] == "1.0.0"
    ids = {symbol["id"] for symbol in manifest["symbols"]}
    required_symbols = {
        "cursor", "comparison", "mutation", "range", "generic-operation", "unsupported"
    }
    assert required_symbols <= ids
    assert not {"binary-search", "two-pointers", "recursion"} & ids

    cases = json.loads(
        (ROOT / "fixtures" / "structural-v1" / "cases.json").read_text(encoding="utf-8")
    )["cases"]
    case_ids = {case["id"] for case in cases}
    required_cases = {
        "accumulation", "count", "find-maximum", "linear-search", "early-return",
        "array-update", "swap", "binary-search", "two-pointers", "ordinary-call",
        "alias-mutation", "generic-supported", "unsupported", "simple-recursion",
    }
    assert required_cases == case_ids
    recursion = next(case for case in cases if case["id"] == "simple-recursion")
    assert recursion.get("expectedStatus") == "deferred"
    assert recursion["expectedPrimitives"] == ["unsupported"]
    for case in cases:
        verify_executable_case(case)

    source_checks = {
        ROOT / "packages/lens-scenes/src/normalize-semantic-scene.ts": [
            "SemanticSceneSchema.parse", "activeSourceRange", "previousValue", "confidence",
        ],
        ROOT / "packages/visual-grammar/src/symbol-registry.ts": [
            "generic-operation", "unsupported", "composition",
        ],
        ROOT / "apps/web/src/lib/learner-ui/lesson/VisualLearningStage.svelte": [
            "Flow", "State", "Guided Trace", "Graph Inspector",
        ],
    }
    for path, needles in source_checks.items():
        require(path)
        content = path.read_text(encoding="utf-8")
        for needle in needles:
            assert needle in content, f"{needle!r} missing from {path.relative_to(ROOT)}"

    compliance = (ROOT / "docs/structural-code-lens/ARTIFACT-COMPLIANCE.md").read_text(encoding="utf-8")
    assert "Pending human study" in compliance
    assert "Deferred" in compliance
    assert "| Implemented |" not in compliance
    for rule in [
        "Analyzer/runtime emit facts only",
        "All learner views consume one `SceneStep`",
        "Generic supported differs from unsupported",
        "Algorithms use primitive composition",
    ]:
        assert rule in compliance
    for symbol_id in ids:
        assert f"| {symbol_id} |" in compliance, f"missing compliance row for {symbol_id}"
    print(f"structural-lens: {len(required_pack)} pack artifacts, {len(ids)} symbols, {len(cases)} executable acceptance cases verified")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
