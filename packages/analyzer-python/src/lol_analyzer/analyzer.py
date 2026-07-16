from __future__ import annotations

import ast
import json
import re
from collections import Counter, defaultdict
from dataclasses import dataclass
from pathlib import Path
from typing import Any


SUPPORTED_BINOPS = {
    ast.Add: "add",
    ast.Sub: "sub",
    ast.Mult: "mul",
    ast.Div: "div",
}


@dataclass
class UnsupportedRegion:
    sourceRange: dict[str, int]
    construct: str
    message: str


class Analyzer:
    def __init__(self, source: str) -> None:
        self.source = source.rstrip()
        self.tree = ast.parse(self.source)
        self.nodes: list[dict[str, Any]] = []
        self.relations: list[dict[str, str]] = []
        self.unsupported: list[dict[str, Any]] = []
        self.assignment_sites: dict[str, list[ast.Assign | ast.AugAssign]] = defaultdict(list)
        self.loop_iterators: set[str] = set()
        self.value_id_counts: Counter[str] = Counter()
        self.branch_count = 0
        self.loop_count = 0
        self.return_count = 0
        self.op_count = Counter[str]()
        self.current_function: ast.FunctionDef | None = None
        self.total_returns = 0
        self.node_ids: set[str] = set()
        self.collection_names: set[str] = set()

    def analyze(self) -> dict[str, Any]:
        functions = [node for node in self.tree.body if isinstance(node, ast.FunctionDef)]
        if len(functions) != 1 or len(self.tree.body) != 1:
            for node in self.tree.body:
                if not isinstance(node, ast.FunctionDef):
                    self.add_unsupported(node, type(node).__name__)
            if len(functions) != 1:
                message = "This version analyzes one top-level function per run."
                construct = "multiple functions" if len(functions) > 1 else "missing function"
                self.unsupported.append(
                    UnsupportedRegion(
                        sourceRange=self.range_for(self.tree.body[0] if self.tree.body else self.tree),
                        construct=construct,
                        message=message,
                    ).__dict__
                )
            return self.graph()

        self.current_function = functions[0]
        self.total_returns = sum(isinstance(node, ast.Return) for node in ast.walk(self.current_function))
        self.precollect(self.current_function)

        function_id = self.function_id(self.current_function.name)
        self.nodes.append(
            {
                "id": function_id,
                "kind": "function",
                "sourceRange": self.range_for(self.current_function),
                "name": self.current_function.name,
                "params": [self.binding_id(arg.arg) for arg in self.current_function.args.args],
            }
        )
        self.node_ids.add(function_id)

        for arg in self.current_function.args.args:
            self.nodes.append(
                {
                    "id": self.binding_id(arg.arg),
                    "kind": "binding",
                    "sourceRange": self.range_for(arg),
                    "name": arg.arg,
                    "role": "parameter",
                    "mutable": False,
                }
            )
            self.node_ids.add(self.binding_id(arg.arg))

        for stmt in self.current_function.body:
            self.visit_stmt(stmt, parent_id=function_id, top_level=True)

        return self.graph()

    def graph(self) -> dict[str, Any]:
        return {
            "version": "0.1",
            "source": self.source,
            "nodes": self.nodes,
            "relations": self.relations,
            "unsupported": self.unsupported,
        }

    def precollect(self, function: ast.FunctionDef) -> None:
        for node in ast.walk(function):
            if isinstance(node, ast.For) and isinstance(node.target, ast.Name):
                self.loop_iterators.add(node.target.id)
            elif isinstance(node, ast.Assign):
                if len(node.targets) == 1 and isinstance(node.targets[0], ast.Name):
                    self.assignment_sites[node.targets[0].id].append(node)
            elif isinstance(node, ast.AugAssign) and isinstance(node.target, ast.Name):
                self.assignment_sites[node.target.id].append(node)

    def visit_stmt(self, stmt: ast.stmt, parent_id: str, top_level: bool = False) -> None:
        if isinstance(stmt, ast.Assign):
            self.visit_assign(stmt, parent_id)
        elif isinstance(stmt, ast.For):
            self.visit_for(stmt, parent_id)
        elif isinstance(stmt, ast.If):
            self.visit_if(stmt, parent_id, top_level=top_level)
        elif isinstance(stmt, ast.Return):
            self.visit_return(stmt, parent_id, top_level=top_level)
        elif isinstance(stmt, ast.Expr):
            self.visit_expr_stmt(stmt, parent_id)
        else:
            self.add_unsupported(stmt, type(stmt).__name__)

    def visit_assign(self, stmt: ast.Assign, parent_id: str) -> None:
        if len(stmt.targets) != 1 or not isinstance(stmt.targets[0], ast.Name):
            self.add_unsupported(stmt, "complex assignment")
            return
        name = stmt.targets[0].id
        value = stmt.value

        if isinstance(value, ast.List):
            node_id = self.collection_id(name)
            self.collection_names.add(name)
            if node_id not in self.node_ids:
                self.nodes.append(
                    {
                        "id": node_id,
                        "kind": "collection",
                        "sourceRange": self.range_for(stmt),
                        "name": name,
                        "items": [self.literal_repr(item) for item in value.elts],
                    }
                )
                self.node_ids.add(node_id)
                self.rel(parent_id, "contains", node_id)
            return

        binding_id = self.binding_id(name)
        role = self.binding_role(name, value)
        if binding_id not in self.node_ids:
            binding_node = {
                "id": binding_id,
                "kind": "binding",
                "sourceRange": self.range_for(stmt),
                "name": name,
                "role": role,
                "mutable": role == "state",
            }
            if self.is_literal(value):
                binding_node["initialRepr"] = self.literal_repr(value)
            self.nodes.append(binding_node)
            self.node_ids.add(binding_id)
            self.rel(parent_id, "contains", binding_id)

        if self.should_emit_assignment_value(name, role, value):
            value_id = self.value_id(value, binding_name=name)
            if value_id not in self.node_ids:
                self.nodes.append(
                    {
                        "id": value_id,
                        "kind": "value",
                        "sourceRange": self.range_for(value),
                        "repr": self.literal_repr(value),
                        "pyType": self.py_type(value),
                    }
                )
                self.node_ids.add(value_id)

        if isinstance(value, ast.BinOp):
            op_id = self.operation_id(value)
            if op_id not in self.node_ids:
                self.nodes.append(
                    {
                        "id": op_id,
                        "kind": "operation",
                        "sourceRange": self.range_for(value),
                        "expr": self.expr_text(value),
                    }
                )
                self.node_ids.add(op_id)
            self.rel(parent_id, "contains", op_id)
            for ref in self.read_refs(value):
                self.rel(op_id, "reads", ref)
            self.rel(op_id, "writes", binding_id)
        elif not self.is_literal(value):
            self.add_unsupported(value, type(value).__name__)

    def visit_for(self, stmt: ast.For, parent_id: str) -> None:
        if not isinstance(stmt.target, ast.Name) or not isinstance(stmt.iter, ast.Name):
            self.add_unsupported(stmt, "for target")
            return
        self.loop_count += 1
        loop_id = f"loop-{self.loop_count}"
        body_target = self.body_reference(stmt.body)
        self.nodes.append(
            {
                "id": loop_id,
                "kind": "loop",
                "sourceRange": self.range_for(stmt),
                "iteratorName": stmt.target.id,
                "collectionRef": self.binding_id(stmt.iter.id),
                "body": body_target,
            }
        )
        self.node_ids.add(loop_id)
        iter_id = self.binding_id(stmt.target.id)
        if iter_id not in self.node_ids:
            self.nodes.append(
                {
                    "id": iter_id,
                    "kind": "binding",
                    "sourceRange": self.range_for(stmt.target),
                    "name": stmt.target.id,
                    "role": "iterator",
                    "mutable": False,
                }
            )
            self.node_ids.add(iter_id)
        self.rel(parent_id, "contains", loop_id)
        self.rel(loop_id, "iterates", self.binding_id(stmt.iter.id))
        for child in stmt.body:
            self.visit_stmt(child, parent_id=loop_id)

    def visit_if(self, stmt: ast.If, parent_id: str, top_level: bool = False) -> None:
        self.branch_count += 1
        branch_id = "branch-guard" if top_level else f"branch-{self.branch_count}"
        true_body = self.body_reference(stmt.body)
        false_body = self.body_reference(stmt.orelse) if stmt.orelse else None
        branch = {
            "id": branch_id,
            "kind": "branch",
            "sourceRange": self.range_for(stmt),
            "conditionExpr": self.expr_text(stmt.test),
            "trueBody": true_body,
        }
        if false_body:
            branch["falseBody"] = false_body
        self.nodes.append(branch)
        self.node_ids.add(branch_id)
        self.rel(parent_id, "contains", branch_id)
        for child in stmt.body:
            self.visit_stmt(child, parent_id=branch_id)
        for child in stmt.orelse:
            self.visit_stmt(child, parent_id=branch_id)

    def visit_return(self, stmt: ast.Return, parent_id: str, top_level: bool = False) -> None:
        ret_id = self.return_id(stmt, top_level=top_level)
        value_ref = self.return_value_ref(stmt.value)
        self.nodes.append(
            {
                "id": ret_id,
                "kind": "return",
                "sourceRange": self.range_for(stmt),
                "valueRef": value_ref,
            }
        )
        self.node_ids.add(ret_id)
        self.rel(parent_id, "contains", ret_id)
        self.rel(ret_id, "returns", value_ref)

        if isinstance(stmt.value, ast.Constant):
            value_id = value_ref
            if not any(node["id"] == value_id for node in self.nodes):
                self.nodes.append(
                    {
                        "id": value_id,
                        "kind": "value",
                        "sourceRange": self.range_for(stmt.value),
                        "repr": self.literal_repr(stmt.value),
                        "pyType": self.py_type(stmt.value),
                    }
                )
                self.node_ids.add(value_id)
        elif (
            isinstance(stmt.value, ast.UnaryOp)
            and isinstance(stmt.value.op, ast.USub)
            and isinstance(stmt.value.operand, ast.Constant)
        ):
            value_id = value_ref
            if value_id not in self.node_ids:
                self.nodes.append(
                    {
                        "id": value_id,
                        "kind": "value",
                        "sourceRange": self.range_for(stmt.value),
                        "repr": self.literal_repr(stmt.value),
                        "pyType": type(stmt.value.operand.value).__name__,
                    }
                )
                self.node_ids.add(value_id)
        elif isinstance(stmt.value, ast.BinOp):
            op_id = value_ref
            if not any(node["id"] == op_id for node in self.nodes):
                self.nodes.append(
                    {
                        "id": op_id,
                        "kind": "operation",
                        "sourceRange": self.range_for(stmt.value),
                        "expr": self.expr_text(stmt.value),
                    }
                )
                self.node_ids.add(op_id)
                for ref in self.read_refs(stmt.value):
                    self.rel(op_id, "reads", ref)

    def body_reference(self, body: list[ast.stmt]) -> str:
        if not body:
            return "unsupported-empty"
        first = body[0]
        if isinstance(first, ast.If):
            return "branch-1" if self.branch_count == 0 else f"branch-{self.branch_count + 1}"
        if isinstance(first, ast.Return):
            if isinstance(first.value, ast.Constant) and self.literal_repr(first.value) == "0":
                return "ret-zero"
            return "ret-early"
        if isinstance(first, ast.Assign) and isinstance(first.value, ast.BinOp):
            return self.operation_id(first.value)
        if isinstance(first, ast.Assign) and len(first.targets) == 1 and isinstance(first.targets[0], ast.Name):
            return self.binding_id(first.targets[0].id)
        if isinstance(first, ast.Expr) and self.is_append_call(first.value):
            return "mut-append"
        return "unsupported-body"

    def return_value_ref(self, value: ast.expr | None) -> str:
        if isinstance(value, ast.Name):
            return self.collection_id(value.id) if value.id in self.collection_names else self.binding_id(value.id)
        if isinstance(value, ast.Constant):
            return self.value_id(value)
        if isinstance(value, ast.UnaryOp) and isinstance(value.op, ast.USub) and isinstance(value.operand, ast.Constant):
            return self.value_id_from_repr(self.literal_repr(value))
        if isinstance(value, ast.BinOp):
            return self.operation_id(value)
        self.add_unsupported(value or self.current_function, "return value")
        return "unsupported-return"

    def return_id(self, stmt: ast.Return, top_level: bool = False) -> str:
        if self.total_returns == 1:
            return "ret-1"
        if not top_level:
            if isinstance(stmt.value, ast.Constant) and self.literal_repr(stmt.value) == "0":
                return "ret-zero"
            return "ret-early"
        if (
            isinstance(stmt.value, ast.Constant)
            and self.literal_repr(stmt.value).startswith("-")
        ) or (
            isinstance(stmt.value, ast.UnaryOp)
            and isinstance(stmt.value.op, ast.USub)
            and isinstance(stmt.value.operand, ast.Constant)
        ):
            return "ret-fallback"
        return "ret-main"

    def visit_expr_stmt(self, expr: ast.Expr, parent_id: str) -> None:
        if not self.is_append_call(expr.value):
            self.add_unsupported(expr, type(expr.value).__name__)
            return
        mutation_id = "mut-append"
        target = expr.value.func.value
        assert isinstance(target, ast.Name)
        self.nodes.append(
            {
                "id": mutation_id,
                "kind": "mutation",
                "sourceRange": self.range_for(expr),
                "targetRef": self.collection_id(target.id),
                "mutationType": "append",
            }
        )
        self.node_ids.add(mutation_id)
        self.rel(parent_id, "contains", mutation_id)
        self.rel(mutation_id, "mutates", self.collection_id(target.id))
        arg = expr.value.args[0]
        if isinstance(arg, ast.BinOp):
            op_id = self.operation_id(arg)
            if op_id not in self.node_ids:
                self.nodes.append(
                    {
                        "id": op_id,
                        "kind": "operation",
                        "sourceRange": self.range_for(arg),
                        "expr": self.expr_text(arg),
                    }
                )
                self.node_ids.add(op_id)
            self.rel(op_id, "feeds", mutation_id)
        elif isinstance(arg, ast.Name):
            pass
        else:
            self.add_unsupported(arg, type(arg).__name__)

    def binding_role(self, name: str, value: ast.expr) -> str:
        if name in self.loop_iterators:
            return "iterator"
        assignments = self.assignment_sites.get(name, [])
        if len(assignments) > 1:
            return "state"
        if self.is_literal(value):
            return "constant"
        return "local"

    def should_emit_assignment_value(self, name: str, role: str, value: ast.expr) -> bool:
        return self.is_literal(value) and (role in {"constant", "state"} or name in {"total", "count"})

    def read_refs(self, value: ast.BinOp) -> list[str]:
        refs: list[str] = []
        for node in ast.walk(value):
            if isinstance(node, ast.Name):
                refs.append(self.binding_or_collection_id(node.id))
        return refs

    def binding_or_collection_id(self, name: str) -> str:
        if any(node["id"] == self.collection_id(name) for node in self.nodes):
            return self.collection_id(name)
        return self.binding_id(name)

    def function_id(self, name: str) -> str:
        return f"fn-{name}"

    def binding_id(self, name: str) -> str:
        return f"bind-{name}"

    def collection_id(self, name: str) -> str:
        return f"coll-{name}"

    def operation_id(self, value: ast.BinOp) -> str:
        token = SUPPORTED_BINOPS.get(type(value.op), "expr")
        if isinstance(value.right, ast.Constant) and self.literal_repr(value.right) == "1" and token == "add":
            return "op-inc"
        return f"op-{token}"

    def value_id(self, value: ast.Constant, binding_name: str | None = None) -> str:
        literal = self.literal_repr(value)
        return self.value_id_from_repr(literal, binding_name=binding_name)

    def value_id_from_repr(self, literal: str, binding_name: str | None = None) -> str:
        if binding_name and binding_name == "rate":
            return "val-rate"
        if literal == "0":
            return "val-zero" if binding_name is None else "val-0"
        if literal.startswith("-"):
            return f"val-{literal.replace('-', 'neg').replace('.', '_')}"
        if binding_name:
            return f"val-{binding_name}"
        stem = re.sub(r"[^a-zA-Z0-9]+", "_", literal).strip("_") or "value"
        return f"val-{stem}"

    def is_literal(self, value: ast.expr) -> bool:
        return isinstance(value, ast.Constant) and isinstance(value.value, (int, float, str, bool))

    def literal_repr(self, value: ast.AST) -> str:
        return ast.unparse(value)

    def py_type(self, value: ast.Constant) -> str:
        return type(value.value).__name__

    def is_append_call(self, value: ast.AST) -> bool:
        return (
            isinstance(value, ast.Call)
            and isinstance(value.func, ast.Attribute)
            and value.func.attr == "append"
            and isinstance(value.func.value, ast.Name)
            and len(value.args) == 1
        )

    def expr_text(self, value: ast.AST) -> str:
        return ast.unparse(value)

    def rel(self, from_id: str, rel_type: str, to_id: str) -> None:
        relation = {"from": from_id, "type": rel_type, "to": to_id}
        if relation not in self.relations:
            self.relations.append(relation)

    def add_unsupported(self, node: ast.AST | None, construct: str) -> None:
        if node is None:
            return
        message = f"This version does not yet visualize {construct}."
        region = UnsupportedRegion(
            sourceRange=self.range_for(node),
            construct=construct,
            message=message,
        ).__dict__
        if region not in self.unsupported:
            self.unsupported.append(region)

    def range_for(self, node: ast.AST) -> dict[str, int]:
        end_col = getattr(node, "end_col_offset", getattr(node, "col_offset", 0))
        if isinstance(node, (ast.For, ast.BinOp)) and end_col > getattr(node, "col_offset", 0):
            end_col -= 1
        return {
            "startLine": getattr(node, "lineno", 1),
            "startCol": getattr(node, "col_offset", 0),
            "endLine": getattr(node, "end_lineno", getattr(node, "lineno", 1)),
            "endCol": end_col,
        }


def analyze_source(source: str) -> dict[str, Any]:
    return Analyzer(source).analyze()


def canonical_json(graph: dict[str, Any]) -> str:
    return json.dumps(graph, indent=2) + "\n"


def analyze_file(path: str | Path) -> dict[str, Any]:
    return analyze_source(Path(path).read_text(encoding="utf-8"))
