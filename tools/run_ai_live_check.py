from __future__ import annotations

import json
import sys
import time
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from apps.api.ai_runtime import (
    AISettings,
    OpenAICompatibleProvider,
    SYSTEM_PROMPT,
    TeachingRequest,
    build_teaching_context,
    teach,
)


def safe_error(exc: Exception) -> dict[str, Any]:
    response = getattr(exc, "response", None)
    return {
        "ok": False,
        "errorType": type(exc).__name__,
        "statusCode": getattr(response, "status_code", None),
    }


def main() -> int:
    settings = AISettings.load()
    report: dict[str, Any] = {
        "enabled": settings.enabled,
        "provider": settings.provider,
        "model": settings.model or None,
        "configured": bool(settings.model and settings.api_key and settings.base_url),
    }
    if not settings.enabled or settings.provider == "mock":
        report["live"] = {"ok": False, "reason": "No external provider is enabled."}
        print(json.dumps(report, sort_keys=True))
        return 0
    if settings.provider == "anthropic":
        report["live"] = {"ok": False, "reason": "Use the Anthropic adapter integration tests for this configuration."}
        print(json.dumps(report, sort_keys=True))
        return 0

    provider = OpenAICompatibleProvider(settings.provider)
    try:
        raw = provider.complete(
            [
                {"role": "system", "content": "Return only a JSON object."},
                {"role": "user", "content": 'Return {"status":"ok"}.'},
            ],
            settings,
        )
        report["live"] = {"ok": True, "responseKeys": sorted(raw)}
    except Exception as exc:  # noqa: BLE001 - intentionally reduced to safe metadata
        report["live"] = safe_error(exc)

    request = TeachingRequest(
            source=(
                "def combine(items):\n"
                "    memory = 0\n"
                "    for item in items:\n"
                "        memory = memory + item\n"
                "    return memory\n"
            ),
            argsRepr=["[2, 3]"],
            stepIndex=3,
        )
    context = build_teaching_context(request, settings)
    teaching_payload = {"capability": "explain_step", "question": None, "context": context.model_dump()}
    try:
        raw_teaching = provider.complete(
            [
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": json.dumps(teaching_payload, separators=(",", ":"))},
            ],
            settings,
        )
        report["rawTeachingShape"] = {
            "keys": sorted(raw_teaching),
            "types": {key: type(value).__name__ for key, value in raw_teaching.items()},
        }
    except Exception as exc:  # noqa: BLE001
        report["rawTeachingShape"] = safe_error(exc)

    started = time.monotonic()
    response = teach(
        request,
        "explain_step",
        settings=settings,
    )
    report["teaching"] = {
        "provider": response.provider,
        "fallback": response.fallback,
        "supportStatus": response.supportStatus,
        "schemaValid": True,
        "groundingCount": len(response.grounding),
        "latencySeconds": round(time.monotonic() - started, 2),
    }
    print(json.dumps(report, sort_keys=True))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
