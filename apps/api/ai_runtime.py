from __future__ import annotations

import json
import os
import time
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Literal, Protocol

import httpx
from pydantic import BaseModel, Field, ValidationError

from tools.build_artifacts import ArtifactError, build_artifacts

ROOT = Path(__file__).resolve().parents[2]

ProviderName = Literal["mock", "deepseek", "openai", "anthropic", "openai_compatible"]
SupportStatus = Literal["supported", "unsupported"]
Capability = Literal["explain_step", "explain_program", "chat"]


def _root_environment() -> dict[str, str]:
    values: dict[str, str] = {}
    path = ROOT / ".env"
    if path.exists():
        for raw_line in path.read_text(encoding="utf-8").splitlines():
            line = raw_line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            key, value = line.split("=", 1)
            values[key.strip()] = value.strip().strip('"').strip("'")
    values.update(os.environ)
    return values


def _bool(values: dict[str, str], key: str, default: bool) -> bool:
    value = values.get(key)
    return default if value is None else value.lower() in {"1", "true", "yes", "on"}


@dataclass(frozen=True)
class AISettings:
    enabled: bool
    provider: ProviderName
    api_style: str
    api_key: str
    base_url: str
    model: str
    timeout_seconds: float
    max_output_tokens: int
    temperature: float
    max_retries: int
    default_learner_level: str
    enable_explain_step: bool
    enable_explain_program: bool
    enable_chat: bool
    enable_fallback: bool
    structured_output: bool

    @classmethod
    def load(cls) -> "AISettings":
        values = _root_environment()
        provider = values.get("AI_PROVIDER", "mock").lower()
        allowed = {"mock", "deepseek", "openai", "anthropic", "openai_compatible"}
        if provider not in allowed:
            provider = "mock"
        defaults = {
            "deepseek": ("https://api.deepseek.com", "deepseek-chat"),
            "openai": ("https://api.openai.com/v1", "gpt-4.1-mini"),
            "anthropic": ("https://api.anthropic.com", "claude-3-5-haiku-latest"),
            "openai_compatible": ("", ""),
            "mock": ("", "mock-teacher-v1"),
        }
        default_base, default_model = defaults[provider]
        return cls(
            enabled=_bool(values, "AI_ENABLED", False),
            provider=provider,  # type: ignore[arg-type]
            api_style=values.get("AI_API_STYLE", "openai_chat"),
            api_key=values.get("AI_API_KEY", ""),
            base_url=values.get("AI_BASE_URL", default_base).rstrip("/"),
            model=values.get("AI_MODEL", default_model),
            timeout_seconds=float(values.get("AI_TIMEOUT_SECONDS", "30")),
            max_output_tokens=int(values.get("AI_MAX_OUTPUT_TOKENS", "900")),
            temperature=float(values.get("AI_TEMPERATURE", "0.2")),
            max_retries=max(0, int(values.get("AI_MAX_RETRIES", "1"))),
            default_learner_level=values.get("AI_DEFAULT_LEARNER_LEVEL", "beginner"),
            enable_explain_step=_bool(values, "AI_ENABLE_EXPLAIN_STEP", True),
            enable_explain_program=_bool(values, "AI_ENABLE_EXPLAIN_PROGRAM", True),
            enable_chat=_bool(values, "AI_ENABLE_CHAT", True),
            enable_fallback=_bool(values, "AI_ENABLE_FALLBACK", True),
            structured_output=_bool(values, "AI_STRUCTURED_OUTPUT", True),
        )

    def capability_enabled(self, capability: Capability) -> bool:
        return {
            "explain_step": self.enable_explain_step,
            "explain_program": self.enable_explain_program,
            "chat": self.enable_chat,
        }[capability]


class TeachingRequest(BaseModel):
    source: str = Field(min_length=1)
    argsRepr: list[str] = Field(default_factory=list)
    stepIndex: int = Field(default=0, ge=0)
    learnerLevel: str | None = None
    lessonGoal: str = "Understand what the verified Python execution is doing."


class ChatRequest(TeachingRequest):
    question: str = Field(min_length=1, max_length=1200)


class TeachingContext(BaseModel):
    source: str
    argsRepr: list[str]
    learnerLevel: str
    lessonGoal: str
    detectedPattern: str | None
    supportStatus: SupportStatus
    currentStep: int | None
    activeSource: dict[str, Any] | None
    activeEvent: dict[str, Any]
    activeEntities: list[dict[str, Any]]
    currentValues: dict[str, str]
    previousValues: dict[str, str]
    visualVocabulary: list[str]
    relevantRecentEvents: list[dict[str, Any]]
    unsupportedReason: str | None = None


class TeachingResponse(BaseModel):
    answer: str = Field(min_length=1)
    summary: str = Field(min_length=1)
    vocabulary: list[str]
    supportStatus: SupportStatus
    stepIndex: int | None = None
    sourceLine: int | None = None
    grounding: list[str]
    provider: str
    model: str | None = None
    fallback: bool = False


EVENT_VOCABULARY = {
    "call_enter": "call",
    "bind_param": "bind",
    "state_init": "bind",
    "loop_advance": "select",
    "condition_eval": "compare",
    "state_change": "update",
    "collection_append": "effect",
    "indexed_selection": "read",
    "indexed_mutation": "update",
    "supported_call": "call",
    "loop_test": "repeat",
    "effect_fire": "effect",
    "return_exit": "return",
    "unsupported": "unsupported",
}


def _unsupported_context(req: TeachingRequest, reason: str) -> TeachingContext:
    return TeachingContext(
        source=req.source,
        argsRepr=req.argsRepr,
        learnerLevel=req.learnerLevel or AISettings.load().default_learner_level,
        lessonGoal=req.lessonGoal,
        detectedPattern=None,
        supportStatus="unsupported",
        currentStep=None,
        activeSource=None,
        activeEvent={"type": "unsupported", "reason": reason},
        activeEntities=[],
        currentValues={},
        previousValues={},
        visualVocabulary=["unsupported"],
        relevantRecentEvents=[],
        unsupportedReason=reason,
    )


def build_teaching_context(req: TeachingRequest, settings: AISettings) -> TeachingContext:
    try:
        artifacts = build_artifacts(req.source, req.argsRepr, scene_id="ai-verified-scene")
    except ArtifactError as exc:
        return _unsupported_context(req, exc.violation.get("message", "Execution could not be verified."))
    except Exception:
        return _unsupported_context(req, "Execution could not be verified safely.")

    graph = artifacts["graph"]
    trace = artifacts["trace"]
    if graph.get("unsupported"):
        return _unsupported_context(req, "The source contains behavior outside the verified engine scope.")
    steps = trace.get("steps", [])
    if not steps:
        return _unsupported_context(req, "The engine produced no verified execution steps.")

    step_index = min(req.stepIndex, len(steps) - 1)
    step = steps[step_index]
    previous = steps[step_index - 1] if step_index > 0 else None
    event = dict(step.get("event", {}))
    event_type = EVENT_VOCABULARY.get(event.get("type", ""), "generic")
    event["semanticType"] = event_type
    node_by_id = {node["id"]: node for node in graph.get("nodes", [])}
    active_entities = [node_by_id[node_id] for node_id in step.get("focus", []) if node_id in node_by_id]
    source_range = next((node.get("sourceRange") for node in active_entities if node.get("sourceRange")), None)
    active_source = None
    if source_range:
        lines = req.source.splitlines()
        line_number = source_range.get("startLine")
        active_source = {
            "range": source_range,
            "text": lines[line_number - 1] if isinstance(line_number, int) and 0 < line_number <= len(lines) else "",
        }
    pattern = artifacts.get("pattern") or {}
    recent = []
    for recent_step in steps[max(0, step_index - 3):step_index]:
        recent_event = recent_step.get("event", {})
        recent.append({
            "stepIndex": recent_step.get("index"),
            "line": recent_step.get("line"),
            "type": EVENT_VOCABULARY.get(recent_event.get("type", ""), "generic"),
        })
    vocabulary = list(dict.fromkeys([event_type, "Flow", "State", "Guided Trace"]))
    return TeachingContext(
        source=req.source,
        argsRepr=req.argsRepr,
        learnerLevel=req.learnerLevel or settings.default_learner_level,
        lessonGoal=req.lessonGoal,
        detectedPattern=pattern.get("pattern"),
        supportStatus="supported",
        currentStep=step_index,
        activeSource=active_source,
        activeEvent=event,
        activeEntities=active_entities,
        currentValues=step.get("bindings", {}),
        previousValues=previous.get("bindings", {}) if previous else {},
        visualVocabulary=vocabulary,
        relevantRecentEvents=recent,
    )


def deterministic_response(context: TeachingContext, capability: Capability, question: str | None = None) -> TeachingResponse:
    if context.supportStatus == "unsupported":
        reason = context.unsupportedReason or "Execution could not be verified."
        return TeachingResponse(
            answer=f"I cannot verify this program's execution, so I will not guess what it does. {reason}",
            summary="This behavior is outside the verified teaching scope.",
            vocabulary=["unsupported"],
            supportStatus="unsupported",
            grounding=[reason],
            provider="deterministic",
            fallback=True,
        )

    event = context.activeEvent
    semantic_type = str(event.get("semanticType", "generic"))
    line = context.activeSource.get("range", {}).get("startLine") if context.activeSource else None
    values = context.currentValues
    changed = [
        f"{name}: {context.previousValues.get(name)} → {value}"
        for name, value in values.items()
        if context.previousValues.get(name) != value
    ]
    templates = {
        "bind": "The program binds a verified value to a name so later steps can use it.",
        "read": "The program reads a verified value from the current collection or binding.",
        "select": "The cursor selects the current item from the collection.",
        "compare": "The program compares verified values to choose the recorded branch.",
        "branch": "The program follows the branch recorded by the verified trace.",
        "update": "The program updates state using the values recorded at this step.",
        "repeat": "The loop checks whether another verified iteration should run.",
        "call": "The program enters or evaluates a supported call.",
        "return": "The function returns the value shown by the verified trace.",
        "effect": "The program applies a verified effect to program state.",
        "generic": "The engine verified this step, but it has no more specific teaching symbol yet.",
    }
    answer = templates.get(semantic_type, templates["generic"])
    if capability == "explain_program":
        pattern = context.detectedPattern.replace("_", " ").lower() if context.detectedPattern else "supported"
        answer = f"This is a verified {pattern} process. Follow Flow for the sequence, State for value changes, and Guided Trace for step evidence."
    elif capability == "chat" and question:
        answer = f"For your question, “{question}”, the verified evidence at this step is: {answer}"
    if changed:
        answer += " Changed values: " + "; ".join(changed) + "."
    return TeachingResponse(
        answer=answer,
        summary=f"Verified {semantic_type} event" + (f" at line {line}." if line else "."),
        vocabulary=context.visualVocabulary,
        supportStatus="supported",
        stepIndex=context.currentStep,
        sourceLine=line if isinstance(line, int) else None,
        grounding=[f"event={semantic_type}", *changed[:4]],
        provider="deterministic",
        fallback=True,
    )


class Provider(Protocol):
    name: str

    def complete(self, messages: list[dict[str, str]], settings: AISettings) -> dict[str, Any]: ...


def parse_json_object(content: str) -> dict[str, Any]:
    text = content.strip()
    if text.startswith("```"):
        lines = text.splitlines()
        if lines and lines[0].startswith("```"):
            lines = lines[1:]
        if lines and lines[-1].strip() == "```":
            lines = lines[:-1]
        text = "\n".join(lines).strip()
    try:
        value = json.loads(text)
    except json.JSONDecodeError:
        start = text.find("{")
        end = text.rfind("}")
        if start < 0 or end <= start:
            raise
        value = json.loads(text[start:end + 1])
    if not isinstance(value, dict):
        raise ValueError("Provider response must be one JSON object.")
    return value


class MockProvider:
    name = "mock"

    def complete(self, messages: list[dict[str, str]], settings: AISettings) -> dict[str, Any]:
        context = json.loads(messages[-1]["content"])["context"]
        step = context.get("currentStep")
        return {
            "answer": "The mock teacher is using only the server-verified facts for this step.",
            "summary": "Verified teaching context received.",
            "vocabulary": context.get("visualVocabulary", []),
            "supportStatus": context.get("supportStatus", "unsupported"),
            "stepIndex": step,
            "sourceLine": (context.get("activeSource") or {}).get("range", {}).get("startLine"),
            "grounding": [f"event={context.get('activeEvent', {}).get('semanticType', 'unsupported')}"] ,
            "provider": self.name,
            "model": settings.model,
            "fallback": False,
        }


class OpenAICompatibleProvider:
    def __init__(self, name: str) -> None:
        self.name = name

    def complete(self, messages: list[dict[str, str]], settings: AISettings) -> dict[str, Any]:
        if not settings.api_key or not settings.base_url or not settings.model:
            raise RuntimeError("The configured provider is missing server-side credentials or model settings.")
        payload: dict[str, Any] = {
            "model": settings.model,
            "messages": messages,
            "temperature": settings.temperature,
            "max_tokens": settings.max_output_tokens,
        }
        if settings.structured_output:
            payload["response_format"] = {"type": "json_object"}
        response = httpx.post(
            settings.base_url + "/chat/completions",
            headers={"authorization": f"Bearer {settings.api_key}"},
            json=payload,
            timeout=settings.timeout_seconds,
        )
        response.raise_for_status()
        content = response.json()["choices"][0]["message"]["content"]
        return parse_json_object(content)


class AnthropicProvider:
    name = "anthropic"

    def complete(self, messages: list[dict[str, str]], settings: AISettings) -> dict[str, Any]:
        if not settings.api_key or not settings.base_url or not settings.model:
            raise RuntimeError("The configured provider is missing server-side credentials or model settings.")
        system = next((message["content"] for message in messages if message["role"] == "system"), "")
        user_messages = [message for message in messages if message["role"] != "system"]
        response = httpx.post(
            settings.base_url + "/v1/messages",
            headers={"x-api-key": settings.api_key, "anthropic-version": "2023-06-01"},
            json={
                "model": settings.model,
                "system": system,
                "messages": user_messages,
                "temperature": settings.temperature,
                "max_tokens": settings.max_output_tokens,
            },
            timeout=settings.timeout_seconds,
        )
        response.raise_for_status()
        return parse_json_object(response.json()["content"][0]["text"])


def _provider(settings: AISettings) -> Provider:
    if settings.provider == "mock":
        return MockProvider()
    if settings.provider == "anthropic":
        return AnthropicProvider()
    return OpenAICompatibleProvider(settings.provider)


SYSTEM_PROMPT = """You are Ask Lens, a beginner-friendly teaching assistant.
Use only facts in TeachingContext. Never invent values, branches, return values, or support status.
Use the supplied Language of Learning visual vocabulary. If supportStatus is unsupported, say you cannot verify execution.
Return one JSON object with exactly these types: answer string; summary string; vocabulary array of strings; supportStatus "supported" or "unsupported"; stepIndex integer or null; sourceLine integer or null; grounding array of strings. Runtime fields provider, model, and fallback may be omitted because the server owns them.
Do not include markdown fences."""

SCHEMA_RETRY_PROMPT = """The previous response failed TeachingResponse validation.
Return only one corrected JSON object. `vocabulary` and `grounding` must be arrays of strings. `stepIndex` and `sourceLine` must be integers or null. Do not add prose or markdown fences."""


def teach(
    req: TeachingRequest,
    capability: Capability,
    question: str | None = None,
    settings: AISettings | None = None,
) -> TeachingResponse:
    config = settings or AISettings.load()
    context = build_teaching_context(req, config)
    if context.supportStatus == "unsupported":
        return deterministic_response(context, capability, question)
    if not config.enabled or not config.capability_enabled(capability):
        return deterministic_response(context, capability, question)

    payload = {"capability": capability, "question": question, "context": context.model_dump()}
    messages = [
        {"role": "system", "content": SYSTEM_PROMPT},
        {"role": "user", "content": json.dumps(payload, separators=(",", ":"))},
    ]
    provider = _provider(config)
    for attempt in range(config.max_retries + 1):
        try:
            started = time.monotonic()
            raw = provider.complete(messages, config)
            response = TeachingResponse.model_validate({
                **raw,
                "provider": provider.name,
                "model": config.model,
                "fallback": False,
            })
            if response.supportStatus != context.supportStatus:
                raise ValidationError.from_exception_data("TeachingResponse", [])
            _ = time.monotonic() - started
            return response
        except (httpx.HTTPError, KeyError, TypeError, ValueError, ValidationError, RuntimeError):
            if attempt >= config.max_retries:
                if config.enable_fallback:
                    return deterministic_response(context, capability, question)
                raise
            messages.append({"role": "user", "content": SCHEMA_RETRY_PROMPT})
    return deterministic_response(context, capability, question)


def status(settings: AISettings | None = None) -> dict[str, Any]:
    config = settings or AISettings.load()
    credential_required = config.provider != "mock"
    configured = bool(config.model and (not credential_required or (config.api_key and config.base_url)))
    return {
        "enabled": config.enabled,
        "provider": config.provider,
        "model": config.model or None,
        "configured": configured,
        "capabilities": {
            "explainStep": config.enable_explain_step,
            "explainProgram": config.enable_explain_program,
            "chat": config.enable_chat,
            "fallback": config.enable_fallback,
        },
    }
