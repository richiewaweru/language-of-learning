from __future__ import annotations

import ast
import json
import time
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any

from .sandbox import SandboxGuard, SandboxViolation


@dataclass
class GraphIndex:
    function_id: str
    function_name: str
    param_names: list[str]
    bindings: dict[str, dict[str, Any]]
    collections: dict[str, dict[str, Any]]
    loops: list[dict[str, Any]]
    branches: list[dict[str, Any]]
    returns: list[dict[str, Any]]
    mutations: list[dict[str, Any]]
    effects: list[dict[str, Any]]
    calls: list[dict[str, Any]]
    builtins: list[dict[str, Any]]
    operations: dict[str, dict[str, Any]]
    node_line: dict[str, int]


def index_graph(graph: dict[str, Any]) -> GraphIndex:
    nodes = graph["nodes"]
    function = next(node for node in nodes if node["kind"] == "function")
    bindings = {node["name"]: node for node in nodes if node["kind"] == "binding"}
    collections = {node["name"]: node for node in nodes if node["kind"] == "collection"}
    loops = [node for node in nodes if node["kind"] == "loop"]
    branches = [node for node in nodes if node["kind"] == "branch"]
    returns = [node for node in nodes if node["kind"] == "return"]
    mutations = [node for node in nodes if node["kind"] == "mutation"]
    effects = [node for node in nodes if node["kind"] == "effect"]
    calls = [node for node in nodes if node["kind"] == "call"]
    builtins = [node for node in nodes if node["kind"] == "builtin-call"]
    operations = {node["id"]: node for node in nodes if node["kind"] == "operation"}
    node_line = {node["id"]: node["sourceRange"]["startLine"] for node in nodes}
    param_names = []
    for node_id in function["params"]:
        binding = next(node for node in nodes if node["id"] == node_id)
        param_names.append(binding["name"])
    return GraphIndex(
        function_id=function["id"],
        function_name=function["name"],
        param_names=param_names,
        bindings=bindings,
        collections=collections,
        loops=loops,
        branches=branches,
        returns=returns,
        mutations=mutations,
        effects=effects,
        calls=calls,
        builtins=builtins,
        operations=operations,
        node_line=node_line,
    )


@dataclass
class TraceBuilder:
    graph: GraphIndex
    call_args_repr: list[str]
    steps: list[dict[str, Any]] = field(default_factory=list)
    truncated: bool = False
    result_repr: str | None = None
    violation: dict[str, str] | None = None

    def emit(self, line: int, focus: list[str], bindings: dict[str, Any], event: dict[str, Any]) -> None:
        step = {
                "index": len(self.steps),
                "line": line,
                "focus": focus,
                "bindings": {
                    name: value_repr(bindings[name]) for name in sorted(bindings)
                },
                "event": event,
            }
        object_ids = shared_object_ids(bindings)
        if object_ids:
            step["objectIds"] = object_ids
        self.steps.append(step)

    def snapshot(self, env: dict[str, Any]) -> dict[str, Any]:
        tracked_names = sorted(set(self.graph.bindings) | set(self.graph.collections))
        return {name: env[name] for name in tracked_names if name in env}

    def finish(self) -> dict[str, Any]:
        payload: dict[str, Any] = {
            "call": {
                "functionId": self.graph.function_id,
                "argsRepr": self.call_args_repr,
            },
            "steps": self.steps,
            "truncated": self.truncated,
        }
        if self.result_repr is not None:
            payload["result"] = {"repr": self.result_repr}
        if self.violation is not None:
            payload["violation"] = self.violation
        return payload


class Tracer:
    def __init__(self, source: str, graph: dict[str, Any], args_repr: list[str]) -> None:
        self.source = source.rstrip()
        self.graph = index_graph(graph)
        self.args_repr = args_repr
        self.sandbox = SandboxGuard()
        self.tree = ast.parse(self.source)
        self.function = next(node for node in self.tree.body if isinstance(node, ast.FunctionDef))
        self.env: dict[str, Any] = {}
        self.trace = TraceBuilder(self.graph, args_repr)
        self.loop_counters: dict[str, int] = {}
        self.loop_stack: list[dict[str, int | str]] = []
        self.start_time = time.monotonic()

    def run(self) -> dict[str, Any]:
        try:
            self.sandbox.check_source(self.source)
            args = self.sandbox.validate_args(self.args_repr)
            if len(args) != len(self.graph.param_names):
                raise SandboxViolation(
                    "call_args",
                    "Sample-call argument count does not match function parameters.",
                )
            self.sandbox.begin(self.start_time)
            self._tick()
            for name, value in zip(self.graph.param_names, args, strict=True):
                self.env[name] = value
            self.trace.emit(
                self.graph.node_line[self.graph.function_id],
                [self.graph.function_id],
                {},
                {"type": "call_enter", "functionId": self.graph.function_id},
            )
            for stmt in self.function.body:
                signal = self._exec_stmt(stmt)
                if signal == "return":
                    break
                if signal in {"break", "continue"}:
                    raise SandboxViolation("loop_control", "Loop control must be inside a loop.")
            return self.trace.finish()
        except SandboxViolation as exc:
            self.trace.violation = exc.as_dict()
            self.trace.truncated = exc.construct in {"step_limit", "timeout", "memory_limit"}
            self.trace.steps.clear()
            self.trace.result_repr = None
            return self.trace.finish()

    def _tick(self) -> None:
        self.sandbox.tick_step(time.monotonic())

    def _exec_stmt(self, stmt: ast.stmt) -> str | None:
        self._tick()
        if isinstance(stmt, ast.Assign):
            self._exec_assign(stmt)
            return None
        if isinstance(stmt, ast.AugAssign):
            self._exec_aug_assign(stmt)
            return None
        if isinstance(stmt, ast.For):
            return self._exec_for(stmt)
        if isinstance(stmt, ast.While):
            return self._exec_while(stmt)
        if isinstance(stmt, ast.If):
            return self._exec_if(stmt)
        if isinstance(stmt, ast.Return):
            self._exec_return(stmt)
            return "return"
        if isinstance(stmt, ast.Break):
            return self._exec_loop_control(stmt, "break")
        if isinstance(stmt, ast.Continue):
            return self._exec_loop_control(stmt, "continue")
        if isinstance(stmt, ast.Expr):
            self._exec_expr(stmt)
            return None
        raise SandboxViolation(type(stmt).__name__, f"Unsupported statement: {type(stmt).__name__}")

    def _exec_loop_control(self, stmt: ast.Break | ast.Continue, control: str) -> str:
        if not self.loop_stack:
            raise SandboxViolation("loop_control", f"{control} requires an enclosing loop.")
        current = self.loop_stack[-1]
        loop_id = str(current["loopId"])
        iteration = int(current["iteration"])
        self.trace.emit(
            stmt.lineno,
            [loop_id],
            self.trace.snapshot(self.env),
            {
                "type": "loop-exit" if control == "break" else "loop-skip",
                "loopId": loop_id,
                "reason": control,
                "iteration": iteration,
            },
        )
        return control

    def _exec_assign(self, stmt: ast.Assign) -> None:
        if len(stmt.targets) == 1 and isinstance(stmt.targets[0], ast.Subscript):
            self._exec_indexed_assign(stmt)
            return
        if len(stmt.targets) != 1 or not isinstance(stmt.targets[0], ast.Name):
            raise SandboxViolation("assignment", "Only simple assignments are supported.")
        name = stmt.targets[0].id
        if isinstance(stmt.value, ast.List):
            self.env[name] = []
            self.sandbox.track_allocation(64)
            return
        if isinstance(stmt.value, ast.Name):
            old = self.env.get(name)
            new_value = self.env[stmt.value.id]
            binding = self.graph.bindings.get(name)
            self.env[name] = new_value
            if binding and binding.get("role") == "state" and old is not None:
                self.trace.emit(
                    binding["sourceRange"]["startLine"],
                    [binding["id"]],
                    self.trace.snapshot(self.env),
                    {
                        "type": "state_change",
                        "binding": binding["id"],
                        "oldRepr": value_repr(old),
                        "newRepr": value_repr(new_value),
                    },
                )
            return
        if isinstance(stmt.value, ast.BinOp):
            old = self.env.get(name)
            new_value = self._eval_binop(stmt.value)
            binding = self.graph.bindings.get(name)
            op_node = self._operation_node(stmt.value)
            op_id = op_node["id"]
            line = op_node["sourceRange"]["startLine"]
            if binding and binding.get("role") == "state" and name in self.env:
                self.env[name] = new_value
                self.trace.emit(
                    line,
                    [op_id],
                    self.trace.snapshot(self.env),
                    {
                        "type": "state_change",
                        "binding": binding["id"],
                        "oldRepr": value_repr(old),
                        "newRepr": value_repr(new_value),
                    },
                )
            else:
                self.env[name] = new_value
            return
        if isinstance(stmt.value, (ast.Subscript, ast.Call)):
            old = self.env.get(name)
            new_value = self._eval_expr(stmt.value)
            binding = self.graph.bindings.get(name)
            self.env[name] = new_value
            if binding and binding.get("role") == "state" and old is not None:
                self.trace.emit(
                    binding["sourceRange"]["startLine"],
                    [binding["id"]],
                    self.trace.snapshot(self.env),
                    {
                        "type": "state_change",
                        "binding": binding["id"],
                        "oldRepr": value_repr(old),
                        "newRepr": value_repr(new_value),
                    },
                )
            return
        if self._is_literal(stmt.value):
            value = self._literal_value(stmt.value)
            binding = self.graph.bindings.get(name)
            self.env[name] = value
            if binding and binding.get("role") in {"state", "constant"}:
                self.trace.emit(
                    binding["sourceRange"]["startLine"],
                    [binding["id"]],
                    self.trace.snapshot(self.env),
                    {
                        "type": "state_init",
                        "binding": binding["id"],
                        "repr": value_repr(value),
                    },
                )
            return
        raise SandboxViolation(type(stmt.value).__name__, "Unsupported assignment value.")

    def _exec_aug_assign(self, stmt: ast.AugAssign) -> None:
        if not isinstance(stmt.target, ast.Name):
            raise SandboxViolation("augmented_assignment", "Augmented assignment requires a simple name.")
        name = stmt.target.id
        if name not in self.env:
            raise SandboxViolation("augmented_assignment", f"{name} must be bound before augmented assignment.")
        old_value = self.env[name]
        right = self._eval_expr(stmt.value)
        new_value = self._apply_operator(stmt.op, old_value, right)
        self.env[name] = new_value
        binding = self.graph.bindings.get(name)
        if binding is None:
            raise SandboxViolation("augmented_assignment", f"No binding resolves to {name}.")
        operation = self._operation_node(stmt)
        mutation = self._mutation_for_aug_assign(stmt)
        self.trace.emit(
            stmt.lineno,
            [operation["id"], mutation["id"], binding["id"]],
            self.trace.snapshot(self.env),
            {
                "type": "state_change",
                "binding": binding["id"],
                "oldRepr": value_repr(old_value),
                "newRepr": value_repr(new_value),
            },
        )

    def _exec_indexed_assign(self, stmt: ast.Assign) -> None:
        target = stmt.targets[0]
        assert isinstance(target, ast.Subscript)
        if not isinstance(target.value, ast.Name):
            raise SandboxViolation("indexed_assignment", "Indexed mutation requires a named list.")
        collection_name = target.value.id
        collection = self.env.get(collection_name)
        if not isinstance(collection, list):
            raise SandboxViolation("indexed_assignment", "Indexed mutation requires a list.")
        index = self._eval_expr(target.slice)
        if not isinstance(index, int):
            raise SandboxViolation("indexed_assignment", "List indexes must be integers.")
        try:
            old_value = collection[index]
        except IndexError as exc:
            raise SandboxViolation("indexed_assignment", "List index is out of range.") from exc
        new_value = self._eval_expr(stmt.value)
        collection[index] = new_value
        mutation = self._mutation_for_assign(stmt)
        collection_node = self.graph.collections.get(collection_name) or self.graph.bindings.get(collection_name)
        if collection_node is None:
            raise SandboxViolation("indexed_assignment", f"No collection resolves to {collection_name}.")
        self.trace.emit(
            mutation["sourceRange"]["startLine"],
            [mutation["id"], collection_node["id"]],
            self.trace.snapshot(self.env),
            {
                "type": "indexed_mutation",
                "collection": collection_node["id"],
                "indexRepr": value_repr(index),
                "oldRepr": value_repr(old_value),
                "newRepr": value_repr(new_value),
            },
        )

    def _exec_for(self, stmt: ast.For) -> str | None:
        if not isinstance(stmt.target, ast.Name) or not (
            isinstance(stmt.iter, ast.Name) or self._is_range_call(stmt.iter)
        ):
            raise SandboxViolation("for", "Only simple for-loops are supported.")
        loop = self._loop_for_line(stmt.lineno)
        iterator_name = stmt.target.id
        collection = self._eval_expr(stmt.iter)
        if not isinstance(collection, (list, range)):
            raise SandboxViolation("for", "Loop target must be a list or bounded range.")
        loop_id = loop["id"]
        self.loop_counters.setdefault(loop_id, 0)
        self.loop_stack.append({"loopId": loop_id, "iteration": 0})
        try:
            for index, item in enumerate(collection):
                self._tick()
                self.loop_stack[-1]["iteration"] = index
                self.env[iterator_name] = item
                self.trace.emit(
                    loop["sourceRange"]["startLine"],
                    [loop_id],
                    self.trace.snapshot(self.env),
                    {
                        "type": "loop_advance",
                        "loop": loop_id,
                        "itemIndex": index,
                        "itemRepr": value_repr(item),
                    },
                )
                for child in stmt.body:
                    signal = self._exec_stmt(child)
                    if signal == "return":
                        return signal
                    if signal == "break":
                        return None
                    if signal == "continue":
                        break
            return None
        finally:
            self.loop_stack.pop()

    def _exec_while(self, stmt: ast.While) -> str | None:
        if stmt.orelse:
            raise SandboxViolation("while_else", "While-else is not supported.")
        loop = self._loop_for_line(stmt.lineno)
        iteration = 0
        self.loop_stack.append({"loopId": loop["id"], "iteration": 0})
        try:
            while True:
                self._tick()
                self.loop_stack[-1]["iteration"] = iteration
                result = self._eval_condition(stmt.test)
                self.trace.emit(
                    loop["sourceRange"]["startLine"],
                    [loop["id"]],
                    self.trace.snapshot(self.env),
                    {
                        "type": "loop_test",
                        "loop": loop["id"],
                        "iteration": iteration,
                        "result": result,
                    },
                )
                if not result:
                    return None
                for child in stmt.body:
                    signal = self._exec_stmt(child)
                    if signal == "return":
                        return signal
                    if signal == "break":
                        return None
                    if signal == "continue":
                        break
                iteration += 1
        finally:
            self.loop_stack.pop()

    def _exec_if(self, stmt: ast.If) -> str | None:
        branch = self._branch_for_line(stmt.lineno)
        result = self._eval_condition(stmt.test)
        self.trace.emit(
            branch["sourceRange"]["startLine"],
            [branch["id"]],
            self.trace.snapshot(self.env),
            {"type": "condition_eval", "branch": branch["id"], "result": result},
        )
        body = stmt.body if result else stmt.orelse
        for child in body:
            signal = self._exec_stmt(child)
            if signal is not None:
                return signal
        return None

    def _exec_return(self, stmt: ast.Return) -> None:
        ret = self._return_for_stmt(stmt)
        value = self._eval_expr(stmt.value)
        self.trace.result_repr = value_repr(value)
        self.trace.emit(
            ret["sourceRange"]["startLine"],
            [ret["id"]],
            self.trace.snapshot(self.env),
            {"type": "return_exit", "repr": self.trace.result_repr},
        )

    def _exec_expr(self, stmt: ast.Expr) -> None:
        if self._is_print_call(stmt.value):
            if stmt.value.keywords:
                raise SandboxViolation("Call", "Print keyword arguments are not supported.")
            args = [self._eval_expr(arg) for arg in stmt.value.args]
            effect = self._effect_for_stmt(stmt)
            self.trace.emit(
                effect["sourceRange"]["startLine"],
                [effect["id"]],
                self.trace.snapshot(self.env),
                {
                    "type": "effect_fire",
                    "effect": effect["id"],
                    "repr": " ".join(value_repr(arg) for arg in args),
                },
            )
            return
        if not self._is_append_call(stmt.value):
            raise SandboxViolation(type(stmt.value).__name__, "Unsupported expression statement.")
        target = stmt.value.func.value
        assert isinstance(target, ast.Name)
        arg = self._eval_expr(stmt.value.args[0])
        collection_name = target.id
        old = list(self.env[collection_name])
        self.env[collection_name].append(arg)
        mutation = self._mutation_for_stmt(stmt)
        collection = self.graph.collections.get(collection_name) or self.graph.bindings.get(collection_name)
        if collection is None:
            raise SandboxViolation("mutation", f"No collection or binding resolves to {collection_name}.")
        self.trace.emit(
            mutation["sourceRange"]["startLine"],
            [mutation["id"]],
            self.trace.snapshot(self.env),
            {
                "type": "collection_append",
                "collection": collection["id"],
                "valueRepr": value_repr(arg),
            },
        )
        self.sandbox.track_allocation(max(64, len(old) * 8))

    def _eval_condition(self, test: ast.AST) -> bool:
        if isinstance(test, ast.BoolOp):
            if isinstance(test.op, ast.And):
                for value in test.values:
                    if not self._eval_condition(value):
                        return False
                return True
            if isinstance(test.op, ast.Or):
                for value in test.values:
                    if self._eval_condition(value):
                        return True
                return False
        if isinstance(test, ast.UnaryOp) and isinstance(test.op, ast.Not):
            return not self._eval_condition(test.operand)
        if isinstance(test, ast.Compare) and len(test.ops) == 1 and len(test.comparators) == 1:
            left = self._eval_expr(test.left)
            right = self._eval_expr(test.comparators[0])
            op = test.ops[0]
            if isinstance(op, ast.Gt):
                result = left > right
            elif isinstance(op, ast.Lt):
                result = left < right
            elif isinstance(op, ast.GtE):
                result = left >= right
            elif isinstance(op, ast.LtE):
                result = left <= right
            elif isinstance(op, ast.Eq):
                result = left == right
            elif isinstance(op, ast.NotEq):
                result = left != right
            else:
                raise SandboxViolation("condition", "Unsupported comparison operator.")
            operation = self._operation_node_or_none(test)
            if operation is not None:
                self.trace.emit(
                    test.lineno,
                    [operation["id"]],
                    self.trace.snapshot(self.env),
                    {"type": "condition_eval", "branch": operation["id"], "result": result},
                )
            return result
        raise SandboxViolation("condition", "Unsupported branch condition.")

    def _eval_expr(self, expr: ast.AST | None) -> Any:
        if expr is None:
            return None
        if isinstance(expr, ast.Name):
            return self.env[expr.id]
        if self._is_literal(expr):
            return self._literal_value(expr)
        if isinstance(expr, ast.BinOp):
            return self._eval_binop(expr)
        if isinstance(expr, (ast.BoolOp, ast.Compare)) or (
            isinstance(expr, ast.UnaryOp) and isinstance(expr.op, ast.Not)
        ):
            return self._eval_condition(expr)
        if isinstance(expr, ast.Subscript):
            if not isinstance(expr.value, ast.Name):
                raise SandboxViolation("indexed_selection", "Indexed selection requires a named list.")
            collection_name = expr.value.id
            collection = self.env.get(collection_name)
            if not isinstance(collection, list):
                raise SandboxViolation("indexed_selection", "Indexed selection requires a list.")
            index = self._eval_expr(expr.slice)
            if not isinstance(index, int):
                raise SandboxViolation("indexed_selection", "List indexes must be integers.")
            try:
                value = collection[index]
            except IndexError as exc:
                raise SandboxViolation("indexed_selection", "List index is out of range.") from exc
            operation = self._operation_node(expr)
            collection_node = self.graph.collections.get(collection_name) or self.graph.bindings.get(collection_name)
            if collection_node is None:
                raise SandboxViolation("indexed_selection", f"No collection resolves to {collection_name}.")
            self.trace.emit(
                operation["sourceRange"]["startLine"],
                [operation["id"], collection_node["id"]],
                self.trace.snapshot(self.env),
                {
                    "type": "indexed_selection",
                    "collection": collection_node["id"],
                    "indexRepr": value_repr(index),
                    "valueRepr": value_repr(value),
                },
            )
            return value
        if isinstance(expr, ast.Call):
            if isinstance(expr.func, ast.Name) and expr.func.id == self.graph.function_name:
                raise SandboxViolation("recursion", "Recursive calls are explicitly unsupported in v1.")
            if isinstance(expr.func, ast.Name) and expr.func.id in {"min", "max", "sum", "abs"}:
                args = [self._eval_expr(arg) for arg in expr.args]
                if len(args) != 1:
                    raise SandboxViolation(expr.func.id, f"{expr.func.id} requires exactly one input.")
                argument = args[0]
                if expr.func.id in {"min", "max", "sum"} and not isinstance(argument, list):
                    raise SandboxViolation(expr.func.id, f"{expr.func.id} requires a list input.")
                if expr.func.id in {"min", "max"} and not argument:
                    raise SandboxViolation(expr.func.id, f"{expr.func.id} requires a non-empty list.")
                if expr.func.id == "min":
                    value = min(argument)
                elif expr.func.id == "max":
                    value = max(argument)
                elif expr.func.id == "sum":
                    value = sum(argument)
                elif expr.func.id == "abs" and isinstance(argument, (int, float)) and not isinstance(argument, bool):
                    value = abs(argument)
                else:
                    raise SandboxViolation(expr.func.id, f"Unsupported arguments for {expr.func.id}.")
                builtin = self._builtin_for_expr(expr)
                self.trace.emit(
                    builtin["sourceRange"]["startLine"],
                    [builtin["id"]],
                    self.trace.snapshot(self.env),
                    {
                        "type": "builtin-evaluated",
                        "builtin": expr.func.id,
                        "inputs": args,
                        "result": value,
                        "expansion": "collapsed",
                    },
                )
                return value
            if not isinstance(expr.func, ast.Name) or expr.func.id not in {"len", "range"}:
                raise SandboxViolation("call", "Only len and range calls are supported.")
            args = [self._eval_expr(arg) for arg in expr.args]
            if expr.func.id == "len" and len(args) == 1 and isinstance(args[0], list):
                value = len(args[0])
            elif expr.func.id == "range" and 1 <= len(args) <= 3 and all(isinstance(arg, int) for arg in args):
                value = range(*args)
            else:
                raise SandboxViolation(expr.func.id, f"Unsupported arguments for {expr.func.id}.")
            call = self._call_for_expr(expr)
            self.trace.emit(
                call["sourceRange"]["startLine"],
                [call["id"]],
                self.trace.snapshot(self.env),
                {
                    "type": "supported_call",
                    "callee": expr.func.id,
                    "argsRepr": [value_repr(arg) for arg in args],
                    "resultRepr": value_repr(value),
                },
            )
            return value
        if (
            isinstance(expr, ast.UnaryOp)
            and isinstance(expr.op, ast.USub)
            and self._is_literal(expr.operand)
        ):
            value = self._literal_value(expr.operand)
            return -value
        raise SandboxViolation(type(expr).__name__, "Unsupported expression.")

    def _eval_binop(self, expr: ast.BinOp) -> Any:
        left = self._eval_expr(expr.left)
        right = self._eval_expr(expr.right)
        if isinstance(expr.op, ast.Add):
            return left + right
        if isinstance(expr.op, ast.Sub):
            return left - right
        if isinstance(expr.op, ast.Mult):
            return left * right
        if isinstance(expr.op, ast.Div):
            return left / right
        if isinstance(expr.op, ast.FloorDiv):
            return left // right
        if isinstance(expr.op, ast.Mod):
            return left % right
        raise SandboxViolation("operation", "Unsupported binary operation.")

    def _apply_operator(self, operator: ast.operator, left: Any, right: Any) -> Any:
        if isinstance(operator, ast.Add):
            return left + right
        if isinstance(operator, ast.Sub):
            return left - right
        if isinstance(operator, ast.Mult):
            return left * right
        if isinstance(operator, ast.FloorDiv):
            return left // right
        if isinstance(operator, ast.Mod):
            return left % right
        raise SandboxViolation("augmented_assignment", "This augmented assignment operator is unsupported.")

    def _loop_for_line(self, line: int) -> dict[str, Any]:
        for loop in self.graph.loops:
            if loop["sourceRange"]["startLine"] == line:
                return loop
        raise SandboxViolation("for", f"No loop node resolves to line {line}.")

    def _branch_for_line(self, line: int) -> dict[str, Any]:
        for branch in self.graph.branches:
            if branch["sourceRange"]["startLine"] == line:
                return branch
        raise SandboxViolation("condition", f"No branch node resolves to line {line}.")

    def _return_for_stmt(self, stmt: ast.Return) -> dict[str, Any]:
        for ret in self.graph.returns:
            if ret["sourceRange"]["startLine"] == stmt.lineno:
                return ret
        raise SandboxViolation("return", f"No return node resolves to line {stmt.lineno}.")

    def _mutation_for_stmt(self, stmt: ast.Expr) -> dict[str, Any]:
        for mutation in self.graph.mutations:
            source_range = mutation["sourceRange"]
            if (
                source_range["startLine"] == stmt.lineno
                and source_range["startCol"] == stmt.col_offset
            ):
                return mutation
        # No exact column match: fall back to a unique match on the line.
        on_line = [m for m in self.graph.mutations if m["sourceRange"]["startLine"] == stmt.lineno]
        if len(on_line) == 1:
            return on_line[0]
        raise SandboxViolation(
            "mutation",
            f"No mutation node resolves to line {stmt.lineno} col {stmt.col_offset}.",
        )

    def _effect_for_stmt(self, stmt: ast.Expr) -> dict[str, Any]:
        for effect in self.graph.effects:
            source_range = effect["sourceRange"]
            if (
                source_range["startLine"] == stmt.lineno
                and source_range["startCol"] == stmt.col_offset
            ):
                return effect
        on_line = [
            effect
            for effect in self.graph.effects
            if effect["sourceRange"]["startLine"] == stmt.lineno
        ]
        if len(on_line) == 1:
            return on_line[0]
        raise SandboxViolation(
            "effect",
            f"No effect node resolves to line {stmt.lineno} col {stmt.col_offset}.",
        )

    def _mutation_for_assign(self, stmt: ast.Assign) -> dict[str, Any]:
        for mutation in self.graph.mutations:
            source_range = mutation["sourceRange"]
            if source_range["startLine"] == stmt.lineno and source_range["startCol"] == stmt.col_offset:
                return mutation
        raise SandboxViolation(
            "indexed_assignment",
            f"No mutation node resolves to line {stmt.lineno} col {stmt.col_offset}.",
        )

    def _mutation_for_aug_assign(self, stmt: ast.AugAssign) -> dict[str, Any]:
        for mutation in self.graph.mutations:
            source_range = mutation["sourceRange"]
            if (
                mutation.get("mutationType") == "augmented-assignment"
                and source_range["startLine"] == stmt.lineno
                and source_range["startCol"] == stmt.col_offset
            ):
                return mutation
        raise SandboxViolation(
            "augmented_assignment",
            f"No augmented-assignment mutation resolves to line {stmt.lineno} col {stmt.col_offset}.",
        )

    def _operation_node(self, expr: ast.AST) -> dict[str, Any]:
        operation = self._operation_node_or_none(expr)
        if operation is not None:
            return operation
        raise SandboxViolation(
            "operation",
            f"No operation node resolves to line {expr.lineno} col {expr.col_offset}.",
        )

    def _operation_node_or_none(self, expr: ast.AST) -> dict[str, Any] | None:
        for operation in self.graph.operations.values():
            source_range = operation["sourceRange"]
            if (
                source_range["startLine"] == expr.lineno
                and source_range["startCol"] == expr.col_offset
            ):
                return operation
        return None

    def _call_for_expr(self, expr: ast.Call) -> dict[str, Any]:
        for call in self.graph.calls:
            source_range = call["sourceRange"]
            if source_range["startLine"] == expr.lineno and source_range["startCol"] == expr.col_offset:
                return call
        raise SandboxViolation("call", f"No call node resolves to line {expr.lineno} col {expr.col_offset}.")

    def _builtin_for_expr(self, expr: ast.Call) -> dict[str, Any]:
        for builtin in self.graph.builtins:
            source_range = builtin["sourceRange"]
            if source_range["startLine"] == expr.lineno and source_range["startCol"] == expr.col_offset:
                return builtin
        raise SandboxViolation("builtin", f"No builtin-call node resolves to line {expr.lineno} col {expr.col_offset}.")

    def _is_literal(self, node: ast.AST) -> bool:
        return isinstance(node, ast.Constant) and isinstance(
            node.value, (int, float, str, bool)
        )

    def _literal_value(self, node: ast.Constant) -> Any:
        return node.value

    def _is_append_call(self, node: ast.AST) -> bool:
        return (
            isinstance(node, ast.Call)
            and isinstance(node.func, ast.Attribute)
            and node.func.attr == "append"
            and isinstance(node.func.value, ast.Name)
            and len(node.args) == 1
        )

    def _is_print_call(self, node: ast.AST) -> bool:
        return (
            isinstance(node, ast.Call)
            and isinstance(node.func, ast.Name)
            and node.func.id == "print"
        )

    def _is_range_call(self, node: ast.AST) -> bool:
        return isinstance(node, ast.Call) and isinstance(node.func, ast.Name) and node.func.id == "range"


def value_repr(value: Any) -> str:
    if isinstance(value, float):
        text = repr(value)
        if text == "16.0" or "." in text:
            return text
        return f"{value:.1f}" if value == int(value) else text
    return repr(value)


def shared_object_ids(bindings: dict[str, Any]) -> dict[str, str]:
    """Return deterministic identity labels only when two names alias one mutable object."""
    groups: dict[int, list[str]] = {}
    for name, value in bindings.items():
        if isinstance(value, list):
            groups.setdefault(id(value), []).append(name)
    aliases = [sorted(names) for names in groups.values() if len(names) > 1]
    aliases.sort(key=lambda names: names[0])
    result: dict[str, str] = {}
    for index, names in enumerate(aliases, start=1):
        for name in names:
            result[name] = f"object-{index}"
    return result


def run_trace(source: str, graph: dict[str, Any], args_repr: list[str]) -> dict[str, Any]:
    if graph.get("unsupported"):
        rejection = graph["unsupported"][0]
        violation = {
            "code": rejection.get("code", "UNSUPPORTED_CONSTRUCT"),
            "construct": rejection.get("construct", "unsupported"),
            "message": rejection.get("message", "This behavior is not supported."),
        }
        if rejection.get("diagnostic"):
            violation["diagnostic"] = rejection["diagnostic"]
        return {
            "call": {"functionId": "blocked", "argsRepr": args_repr},
            "steps": [],
            "violation": violation,
            "truncated": False,
        }
    return Tracer(source, graph, args_repr).run()


def run_trace_from_fixture(fixture_dir: str | Path) -> dict[str, Any]:
    fixture_dir = Path(fixture_dir)
    source = (fixture_dir / "source.py").read_text(encoding="utf-8").rstrip()
    graph = json.loads((fixture_dir / "expected.graph.json").read_text(encoding="utf-8"))
    call = json.loads((fixture_dir / "call.json").read_text(encoding="utf-8"))
    return run_trace(source, graph, call["argsRepr"])


def canonical_json(trace: dict[str, Any]) -> str:
    return json.dumps(trace, indent=2) + "\n"
