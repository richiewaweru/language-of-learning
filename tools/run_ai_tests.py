from __future__ import annotations

import sys
from dataclasses import replace
from pathlib import Path
from unittest.mock import patch

from fastapi.testclient import TestClient

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))
sys.path.insert(0, str(ROOT / "tools"))

from apps.api.ai_runtime import AISettings, OpenAICompatibleProvider, TeachingResponse, parse_json_object, teach  # noqa: E402
from apps.api.main import app  # noqa: E402

SUPPORTED = """def renamed(items):
    memory = 0
    for current in items:
        memory = memory + current
    return memory
"""

UNSUPPORTED = """def unsupported(items):
    return {item: item * 2 for item in items}
"""


def mock_settings(**changes: object) -> AISettings:
    base = AISettings(
        enabled=True,
        provider="mock",
        api_style="openai_chat",
        api_key="",
        base_url="",
        model="mock-teacher-v1",
        timeout_seconds=1,
        max_output_tokens=300,
        temperature=0.2,
        max_retries=1,
        default_learner_level="beginner",
        enable_explain_step=True,
        enable_explain_program=True,
        enable_chat=True,
        enable_fallback=True,
        structured_output=True,
    )
    return replace(base, **changes)


def test_status_is_safe() -> None:
    client = TestClient(app)
    body = client.get("/ai/status").json()
    assert "api_key" not in str(body).lower()
    assert set(body["capabilities"]) == {"explainStep", "explainProgram", "chat", "fallback"}


def test_mock_explain_step_and_program() -> None:
    from apps.api.ai_runtime import TeachingRequest

    req = TeachingRequest(source=SUPPORTED, argsRepr=["[3, 4]"], stepIndex=3)
    for capability, question in (("explain_step", None), ("explain_program", None), ("chat", "Why did it change?")):
        response = teach(req, capability, question, settings=mock_settings())
        assert TeachingResponse.model_validate(response)
        assert response.supportStatus == "supported"
        assert response.provider == "mock"
        assert response.fallback is False
        assert response.grounding


def test_unsupported_is_honest_without_provider_call() -> None:
    from apps.api.ai_runtime import TeachingRequest

    req = TeachingRequest(source=UNSUPPORTED, argsRepr=["[1, 2]"])
    with patch("apps.api.ai_runtime.MockProvider.complete") as provider:
        response = teach(req, "explain_step", settings=mock_settings())
    provider.assert_not_called()
    assert response.supportStatus == "unsupported"
    assert response.fallback is True
    assert "will not guess" in response.answer


def test_provider_failure_uses_deterministic_fallback() -> None:
    from apps.api.ai_runtime import TeachingRequest

    settings = mock_settings(
        provider="openai_compatible",
        api_key="server-only-test-key",
        base_url="https://provider.invalid/v1",
        model="test-model",
        max_retries=0,
    )
    req = TeachingRequest(source=SUPPORTED, argsRepr=["[2, 5]"])
    with patch.object(OpenAICompatibleProvider, "complete", side_effect=RuntimeError("offline")):
        response = teach(req, "explain_step", settings=settings)
    assert response.supportStatus == "supported"
    assert response.provider == "deterministic"
    assert response.fallback is True


def test_openai_compatible_adapter_parses_structured_response() -> None:
    settings = mock_settings(
        provider="deepseek",
        api_key="server-only-test-key",
        base_url="https://api.example.test",
        model="example-model",
    )
    expected = {
        "answer": "Verified answer.",
        "summary": "Verified summary.",
        "vocabulary": ["update"],
        "supportStatus": "supported",
        "stepIndex": 1,
        "sourceLine": 2,
        "grounding": ["event=update"],
        "provider": "deepseek",
        "model": "example-model",
        "fallback": False,
    }

    class Response:
        def raise_for_status(self) -> None:
            return None

        def json(self) -> dict:
            return {"choices": [{"message": {"content": __import__("json").dumps(expected)}}]}

    with patch("apps.api.ai_runtime.httpx.post", return_value=Response()) as post:
        parsed = OpenAICompatibleProvider("deepseek").complete(
            [{"role": "user", "content": "{}"}], settings
        )
    assert parsed == expected
    request = post.call_args
    assert request.args[0] == "https://api.example.test/chat/completions"
    assert request.kwargs["headers"]["authorization"].startswith("Bearer ")
    assert "server-only-test-key" not in str(request.kwargs["json"])


def test_fenced_json_is_parsed_but_prose_is_rejected() -> None:
    assert parse_json_object('```json\n{"answer":"grounded"}\n```') == {"answer": "grounded"}
    try:
        parse_json_object("There is no structured response here.")
    except __import__("json").JSONDecodeError:
        pass
    else:
        raise AssertionError("Unstructured prose must not pass provider validation")


def main() -> int:
    tests = [
        test_status_is_safe,
        test_mock_explain_step_and_program,
        test_unsupported_is_honest_without_provider_call,
        test_provider_failure_uses_deterministic_fallback,
        test_openai_compatible_adapter_parses_structured_response,
        test_fenced_json_is_parsed_but_prose_is_rejected,
    ]
    for test in tests:
        test()
        print(f"  ok {test.__name__}")
    print(f"ai-runtime: {len(tests)}/{len(tests)} tests passed")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
