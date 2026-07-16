from __future__ import annotations

import ast
from dataclasses import dataclass
from typing import Any


MAX_SOURCE_CHARS = 8_192
MAX_LITERAL_LIST_LEN = 10_000
MAX_STRING_LEN = 10_000
MAX_TRACE_STEPS = 500
MAX_WALL_SECONDS = 2.0
MAX_MEMORY_BYTES = 64 * 1024 * 1024

FORBIDDEN_CALLS = {"eval", "exec", "compile", "open", "__import__", "getattr", "globals", "locals"}
FORBIDDEN_IMPORT_CONSTRUCTS = {"import", "Import", "ImportFrom"}


@dataclass
class SandboxViolation(Exception):
    construct: str
    message: str

    def as_dict(self) -> dict[str, str]:
        return {"construct": self.construct, "message": self.message}


class SandboxGuard:
    def __init__(self) -> None:
        self.step_count = 0
        self.start_time: float | None = None
        self.memory_estimate = 0

    def check_source(self, source: str) -> None:
        if len(source) > MAX_SOURCE_CHARS:
            raise SandboxViolation("source_size", "Source exceeds the allowed size limit.")
        tree = ast.parse(source)
        for node in ast.walk(tree):
            if isinstance(node, ast.Import):
                raise SandboxViolation("import", "Imports are not supported in this version.")
            if isinstance(node, ast.ImportFrom):
                raise SandboxViolation("import", "Imports are not supported in this version.")
            if isinstance(node, ast.Call):
                name = self._call_name(node.func)
                if name in FORBIDDEN_CALLS:
                    raise SandboxViolation(name, f"{name} is not allowed in the sandbox.")
                if isinstance(node.func, ast.Attribute) and node.func.attr.startswith("__"):
                    raise SandboxViolation("dunder", "Dunder attribute access is not allowed.")
            if isinstance(node, ast.Attribute) and node.attr.startswith("__") and node.attr.endswith("__"):
                raise SandboxViolation("dunder", "Dunder attribute access is not allowed.")

    def validate_args(self, args_repr: list[str]) -> list[Any]:
        if not args_repr:
            return []
        values: list[Any] = []
        for raw in args_repr:
            if not isinstance(raw, str):
                raise SandboxViolation("call_args", "Sample-call arguments must be literal strings.")
            try:
                value = ast.literal_eval(raw)
            except (SyntaxError, ValueError) as exc:
                raise SandboxViolation("call_args", "Sample-call arguments must be literals only.") from exc
            self._check_value_size(value)
            values.append(value)
        return values

    def begin(self, start_time: float) -> None:
        self.start_time = start_time

    def tick_step(self, now: float) -> None:
        self.step_count += 1
        if self.step_count > MAX_TRACE_STEPS:
            raise SandboxViolation("step_limit", "Trace step limit reached.")
        if self.start_time is not None and now - self.start_time > MAX_WALL_SECONDS:
            raise SandboxViolation("timeout", "Execution timed out.")

    def track_allocation(self, nbytes: int) -> None:
        self.memory_estimate += nbytes
        if self.memory_estimate > MAX_MEMORY_BYTES:
            raise SandboxViolation("memory_limit", "Memory limit reached.")

    def _check_value_size(self, value: Any) -> None:
        if isinstance(value, str) and len(value) > MAX_STRING_LEN:
            raise SandboxViolation("string_size", "String literal exceeds the allowed size.")
        if isinstance(value, list):
            if len(value) > MAX_LITERAL_LIST_LEN:
                raise SandboxViolation("collection_size", "Collection literal exceeds the allowed size.")
            for item in value:
                self._check_value_size(item)
        if isinstance(value, (int, float, bool)) or value is None:
            self.track_allocation(64)

    def _call_name(self, func: ast.AST) -> str | None:
        if isinstance(func, ast.Name):
            return func.id
        if isinstance(func, ast.Attribute):
            return func.attr
        return None
