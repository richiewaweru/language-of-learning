from __future__ import annotations

import ast
import json
from collections import defaultdict
from dataclasses import dataclass
from pathlib import Path
from typing import Any


@dataclass
class UnsupportedRegion:
    sourceRange: dict[str, int]
    code: str
    construct: str
    message: str
    diagnostic: str


CANONICAL_UNSUPPORTED: dict[str, tuple[str, str]] = {
    "UNSUPPORTED_MULTIPLE_FUNCTIONS": (
        "multiple functions",
        "Multiple functions are not yet supported. Lens currently explains one top-level function at a time.",
    ),
    "UNSUPPORTED_RECURSION": (
        "recursion",
        "Recursion is not yet supported. Lens currently explains single-frame iterative programs.",
    ),
    "UNSUPPORTED_CLASS": (
        "classes and object fields",
        "Classes and object fields are not yet supported. Lens currently focuses on variables, lists, loops, branches, and returns.",
    ),
    "UNSUPPORTED_DICTIONARY": (
        "dictionaries",
        "Dictionaries are not yet supported in this pilot. Use lists for the current supported collection model.",
    ),
    "UNSUPPORTED_COMPREHENSION": (
        "comprehensions",
        "Comprehensions are not yet expanded. Rewrite this as an explicit loop, branch, and append sequence.",
    ),
    "UNSUPPORTED_EXCEPTION_FLOW": (
        "exception handling",
        "Exception control flow is not yet supported.",
    ),
    "UNSUPPORTED_IMPORT": (
        "imports and external libraries",
        "Imports and external libraries are outside the current deterministic Lens scope.",
    ),
    "UNSUPPORTED_GENERATOR": (
        "generators",
        "Generators are not yet supported because suspended execution frames are not yet visualized.",
    ),
    "UNSUPPORTED_ASYNC": ("async execution", "Async execution is not yet supported."),
    "UNSUPPORTED_NESTED_FUNCTION": (
        "nested functions",
        "Nested functions and captured scopes are not yet supported.",
    ),
}


class Analyzer:
    """Builds a semantic graph from a single top-level function.

    Node ids are purely positional (`<kind>-L<line>C<col>`), per the N2
    contract. Names, literals, and reprs live only in their own contract
    fields — never in ids — so the analyzer carries no fixture knowledge.
    """

    def __init__(self, source: str) -> None:
        self.source = source.rstrip()
        self.tree = ast.parse(self.source)
        self.nodes: list[dict[str, Any]] = []
        self.relations: list[dict[str, str]] = []
        self.unsupported: list[dict[str, Any]] = []
        self.assignment_sites: dict[str, list[ast.Assign | ast.AugAssign]] = defaultdict(list)
        self.loop_iterators: set[str] = set()
        self.current_function: ast.FunctionDef | None = None
        self.node_ids: set[str] = set()
        # Positional id bookkeeping.
        self.used_ids: set[str] = set()
        self._id_cache: dict[tuple[str, int], str] = {}
        # name -> id maps so relations can resolve by identifier, never by guess.
        self.binding_ids: dict[str, str] = {}
        self.collection_ids: dict[str, str] = {}

    def analyze(self) -> dict[str, Any]:
        rejection = self.canonical_rejection()
        if rejection is not None:
            self.unsupported = [rejection]
            return self.graph()

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
                        code="UNSUPPORTED_PROGRAM_SHAPE",
                        construct=construct,
                        message=message,
                        diagnostic=f"top-level FunctionDef count={len(functions)}; body count={len(self.tree.body)}",
                    ).__dict__
                )
            return self.graph()

        function = functions[0]
        self.current_function = function
        self.precollect(function)

        function_id = self.alloc_id("fn", function)
        param_ids = [self.define_binding_id(arg.arg, arg) for arg in function.args.args]
        self.nodes.append(
            {
                "id": function_id,
                "kind": "function",
                "sourceRange": self.range_for(function),
                "name": function.name,
                "params": param_ids,
            }
        )
        self.node_ids.add(function_id)

        for arg in function.args.args:
            binding_id = self.binding_ids[arg.arg]
            self.nodes.append(
                {
                    "id": binding_id,
                    "kind": "binding",
                    "sourceRange": self.range_for(arg),
                    "name": arg.arg,
                    "role": "parameter",
                    "mutable": False,
                }
            )
            self.node_ids.add(binding_id)

        for stmt in function.body:
            self.visit_stmt(stmt, parent_id=function_id)

        return self.graph()

    def graph(self) -> dict[str, Any]:
        # Rejection is atomic: unsupported source never retains nodes or
        # relations that could be mistaken for a partially verified graph.
        nodes = [] if self.unsupported else self.nodes
        relations = [] if self.unsupported else self.relations
        return {
            "version": "0.1",
            "source": self.source,
            "nodes": nodes,
            "relations": relations,
            "unsupported": self.unsupported,
        }

    def canonical_rejection(self) -> dict[str, Any] | None:
        top_functions = [node for node in self.tree.body if isinstance(node, ast.FunctionDef)]
        checks: list[tuple[str, ast.AST | None]] = [
            ("UNSUPPORTED_CLASS", next((node for node in ast.walk(self.tree) if isinstance(node, ast.ClassDef)), None)),
            ("UNSUPPORTED_ASYNC", next((node for node in ast.walk(self.tree) if isinstance(node, (ast.AsyncFunctionDef, ast.AsyncFor, ast.AsyncWith, ast.Await))), None)),
            ("UNSUPPORTED_IMPORT", next((node for node in ast.walk(self.tree) if isinstance(node, (ast.Import, ast.ImportFrom))), None)),
        ]
        if len(top_functions) > 1:
            checks.insert(0, ("UNSUPPORTED_MULTIPLE_FUNCTIONS", top_functions[1]))
        function = top_functions[0] if len(top_functions) == 1 else None
        if function is not None:
            nested = next(
                (node for node in ast.walk(function) if isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef)) and node is not function),
                None,
            )
            recursion = next(
                (
                    node
                    for node in ast.walk(function)
                    if isinstance(node, ast.Call)
                    and isinstance(node.func, ast.Name)
                    and node.func.id == function.name
                ),
                None,
            )
            checks.extend(
                [
                    ("UNSUPPORTED_NESTED_FUNCTION", nested),
                    ("UNSUPPORTED_RECURSION", recursion),
                    ("UNSUPPORTED_GENERATOR", next((node for node in ast.walk(function) if isinstance(node, (ast.Yield, ast.YieldFrom))), None)),
                    ("UNSUPPORTED_DICTIONARY", next((node for node in ast.walk(function) if isinstance(node, ast.Dict)), None)),
                    ("UNSUPPORTED_COMPREHENSION", next((node for node in ast.walk(function) if isinstance(node, (ast.ListComp, ast.SetComp, ast.DictComp, ast.GeneratorExp))), None)),
                    ("UNSUPPORTED_EXCEPTION_FLOW", next((node for node in ast.walk(function) if isinstance(node, (ast.Try, ast.TryStar, ast.Raise))), None)),
                ]
            )
        for code, node in checks:
            if node is not None:
                construct, message = CANONICAL_UNSUPPORTED[code]
                return UnsupportedRegion(
                    sourceRange=self.range_for(node),
                    code=code,
                    construct=construct,
                    message=message,
                    diagnostic=f"{type(node).__name__} at line {getattr(node, 'lineno', 1)}, column {getattr(node, 'col_offset', 0)}",
                ).__dict__
        return None

    def precollect(self, function: ast.FunctionDef) -> None:
        for node in ast.walk(function):
            if isinstance(node, ast.For) and isinstance(node.target, ast.Name):
                self.loop_iterators.add(node.target.id)
            elif isinstance(node, ast.Assign):
                if len(node.targets) == 1 and isinstance(node.targets[0], ast.Name):
                    self.assignment_sites[node.targets[0].id].append(node)
            elif isinstance(node, ast.AugAssign) and isinstance(node.target, ast.Name):
                self.assignment_sites[node.target.id].append(node)

    # --- statement visitors -------------------------------------------------

    def visit_stmt(self, stmt: ast.stmt, parent_id: str) -> None:
        if isinstance(stmt, ast.Assign):
            self.visit_assign(stmt, parent_id)
        elif isinstance(stmt, ast.AugAssign):
            self.visit_aug_assign(stmt, parent_id)
        elif isinstance(stmt, ast.For):
            self.visit_for(stmt, parent_id)
        elif isinstance(stmt, ast.While):
            self.visit_while(stmt, parent_id)
        elif isinstance(stmt, ast.If):
            self.visit_if(stmt, parent_id)
        elif isinstance(stmt, ast.Return):
            self.visit_return(stmt, parent_id)
        elif isinstance(stmt, ast.Expr):
            self.visit_expr_stmt(stmt, parent_id)
        else:
            self.add_unsupported(stmt, type(stmt).__name__)

    def visit_aug_assign(self, stmt: ast.AugAssign, parent_id: str) -> None:
        operators = {
            ast.Add: "+",
            ast.Sub: "-",
            ast.Mult: "*",
            ast.FloorDiv: "//",
            ast.Mod: "%",
        }
        if not isinstance(stmt.target, ast.Name) or type(stmt.op) not in operators:
            self.add_unsupported(stmt, "augmented assignment target or operator")
            return
        target_id = self.binding_or_collection_id(stmt.target.id)
        if target_id.startswith("unsupported-ref-"):
            self.add_unsupported(stmt, "augmented assignment before binding")
            return
        operator = operators[type(stmt.op)]
        operation_id = self.alloc_id("op", stmt)
        mutation_id = self.alloc_id("mut", stmt)
        self.nodes.extend(
            [
                {
                    "id": operation_id,
                    "kind": "operation",
                    "sourceRange": self.range_for(stmt),
                    "expr": f"{stmt.target.id} {operator} {self.expr_text(stmt.value)}",
                },
                {
                    "id": mutation_id,
                    "kind": "mutation",
                    "sourceRange": self.range_for(stmt),
                    "targetRef": target_id,
                    "mutationType": "augmented-assignment",
                    "operator": operator,
                },
            ]
        )
        self.node_ids.update({operation_id, mutation_id})
        self.rel(parent_id, "contains", operation_id)
        self.rel(parent_id, "contains", mutation_id)
        self.rel(operation_id, "reads", target_id)
        for ref in self.read_refs(stmt.value):
            self.rel(operation_id, "reads", ref)
        self.rel(operation_id, "feeds", mutation_id)
        self.rel(mutation_id, "mutates", target_id)
        self.ensure_expression_facts(stmt.value, operation_id)

    def visit_assign(self, stmt: ast.Assign, parent_id: str) -> None:
        if len(stmt.targets) == 1 and isinstance(stmt.targets[0], ast.Subscript):
            self.visit_indexed_assign(stmt, parent_id)
            return
        if len(stmt.targets) != 1 or not isinstance(stmt.targets[0], ast.Name):
            self.add_unsupported(stmt, "complex assignment")
            return
        name = stmt.targets[0].id
        value = stmt.value

        if isinstance(value, ast.List):
            node_id = self.define_collection_id(name, stmt)
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

        binding_id = self.define_binding_id(name, stmt)
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

        # General rule: emit a value node for every literal initializer of a
        # constant/state binding. No name- or literal-keyed special cases.
        if self.is_literal(value) and role in {"constant", "state"}:
            value_id = self.alloc_id("val", value)
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

        if isinstance(value, (ast.BinOp, ast.Subscript)):
            op_id = self.alloc_id("op", value)
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
            self.ensure_expression_facts(value, parent_id)
            for ref in self.read_refs(value):
                self.rel(op_id, "reads", ref)
            self.rel(op_id, "writes", binding_id)
        elif self.is_supported_call(value):
            call_id = self.ensure_call_node(value, parent_id)
            self.rel(call_id, "writes", binding_id)
        elif isinstance(value, ast.Name):
            source_id = self.binding_or_collection_id(value.id)
            self.rel(binding_id, "reads", source_id)
        elif not self.is_literal(value):
            self.add_unsupported(value, type(value).__name__)

    def visit_indexed_assign(self, stmt: ast.Assign, parent_id: str) -> None:
        target = stmt.targets[0]
        assert isinstance(target, ast.Subscript)
        if not isinstance(target.value, ast.Name):
            self.add_unsupported(target, "indexed assignment target")
            return
        mutation_id = self.alloc_id("mut", stmt)
        target_ref = self.binding_or_collection_id(target.value.id)
        self.nodes.append(
            {
                "id": mutation_id,
                "kind": "mutation",
                "sourceRange": self.range_for(stmt),
                "targetRef": target_ref,
                "mutationType": "indexed-assignment",
            }
        )
        self.node_ids.add(mutation_id)
        self.rel(parent_id, "contains", mutation_id)
        self.rel(mutation_id, "mutates", target_ref)
        for ref in self.read_refs(target.slice):
            self.rel(mutation_id, "reads", ref)
        for ref in self.read_refs(stmt.value):
            self.rel(mutation_id, "reads", ref)
        self.ensure_expression_facts(target.slice, parent_id)
        self.ensure_expression_facts(stmt.value, parent_id)

    def visit_for(self, stmt: ast.For, parent_id: str) -> None:
        if not isinstance(stmt.target, ast.Name) or not (
            isinstance(stmt.iter, ast.Name) or self.is_range_call(stmt.iter)
        ):
            self.add_unsupported(stmt, "for target")
            return
        loop_id = self.alloc_id("loop", stmt)
        body_target = self.body_reference(stmt.body)
        if isinstance(stmt.iter, ast.Name):
            collection_ref = self.binding_or_collection_id(stmt.iter.id)
        else:
            collection_ref = self.ensure_call_node(stmt.iter, parent_id)
            self.ensure_expression_facts(stmt.iter, parent_id)
        self.nodes.append(
            {
                "id": loop_id,
                "kind": "loop",
                "sourceRange": self.range_for(stmt),
                "iteratorName": stmt.target.id,
                "collectionRef": collection_ref,
                "body": body_target,
            }
        )
        self.node_ids.add(loop_id)
        iter_id = self.define_binding_id(stmt.target.id, stmt.target)
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
        self.rel(loop_id, "iterates", collection_ref)
        for child in stmt.body:
            self.visit_stmt(child, parent_id=loop_id)

    def visit_while(self, stmt: ast.While, parent_id: str) -> None:
        if stmt.orelse:
            self.add_unsupported(stmt, "while else")
            return
        condition_id = self.alloc_id("op", stmt.test)
        self.nodes.append(
            {
                "id": condition_id,
                "kind": "operation",
                "sourceRange": self.range_for(stmt.test),
                "expr": self.expr_text(stmt.test),
            }
        )
        self.node_ids.add(condition_id)
        for ref in self.read_refs(stmt.test):
            self.rel(condition_id, "reads", ref)
        self.ensure_expression_facts(stmt.test, condition_id)
        loop_id = self.alloc_id("loop", stmt)
        iterator_name = next(
            (node.id for node in ast.walk(stmt.test) if isinstance(node, ast.Name)),
            "condition",
        )
        self.nodes.append(
            {
                "id": loop_id,
                "kind": "loop",
                "sourceRange": self.range_for(stmt),
                "iteratorName": iterator_name,
                "collectionRef": condition_id,
                "body": self.body_reference(stmt.body),
            }
        )
        self.node_ids.add(loop_id)
        self.rel(parent_id, "contains", loop_id)
        self.rel(loop_id, "reads", condition_id)
        for child in stmt.body:
            self.visit_stmt(child, parent_id=loop_id)

    def visit_if(self, stmt: ast.If, parent_id: str) -> None:
        branch_id = self.alloc_id("branch", stmt)
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
        self.ensure_expression_facts(stmt.test, branch_id)
        for child in stmt.body:
            self.visit_stmt(child, parent_id=branch_id)
        for child in stmt.orelse:
            self.visit_stmt(child, parent_id=branch_id)

    def visit_return(self, stmt: ast.Return, parent_id: str) -> None:
        ret_id = self.alloc_id("ret", stmt)
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

        value = stmt.value
        if isinstance(value, ast.Constant) and self.is_literal(value):
            if value_ref not in self.node_ids:
                self.nodes.append(
                    {
                        "id": value_ref,
                        "kind": "value",
                        "sourceRange": self.range_for(value),
                        "repr": self.literal_repr(value),
                        "pyType": self.py_type(value),
                    }
                )
                self.node_ids.add(value_ref)
        elif (
            isinstance(value, ast.UnaryOp)
            and isinstance(value.op, ast.USub)
            and isinstance(value.operand, ast.Constant)
        ):
            if value_ref not in self.node_ids:
                self.nodes.append(
                    {
                        "id": value_ref,
                        "kind": "value",
                        "sourceRange": self.range_for(value),
                        "repr": self.literal_repr(value),
                        "pyType": type(value.operand.value).__name__,
                    }
                )
                self.node_ids.add(value_ref)
        elif isinstance(value, (ast.BinOp, ast.BoolOp, ast.Compare, ast.UnaryOp, ast.Subscript)):
            if value_ref not in self.node_ids:
                self.nodes.append(
                    {
                        "id": value_ref,
                        "kind": "operation",
                        "sourceRange": self.range_for(value),
                        "expr": self.expr_text(value),
                    }
                )
                self.node_ids.add(value_ref)
                for ref in self.read_refs(value):
                    self.rel(value_ref, "reads", ref)
            self.ensure_expression_facts(value, ret_id)
        elif self.is_supported_call(value):
            self.ensure_call_node(value, parent_id)

    def visit_expr_stmt(self, expr: ast.Expr, parent_id: str) -> None:
        if self.is_print_call(expr.value):
            effect_id = self.alloc_id("eff", expr)
            self.nodes.append(
                {
                    "id": effect_id,
                    "kind": "effect",
                    "sourceRange": self.range_for(expr),
                    "effectType": "print",
                }
            )
            self.node_ids.add(effect_id)
            self.rel(parent_id, "contains", effect_id)
            return
        if not self.is_append_call(expr.value):
            self.add_unsupported(expr, type(expr.value).__name__)
            return
        mutation_id = self.alloc_id("mut", expr)
        target = expr.value.func.value
        assert isinstance(target, ast.Name)
        target_ref = self.binding_or_collection_id(target.id)
        self.nodes.append(
            {
                "id": mutation_id,
                "kind": "mutation",
                "sourceRange": self.range_for(expr),
                "targetRef": target_ref,
                "mutationType": "append",
            }
        )
        self.node_ids.add(mutation_id)
        self.rel(parent_id, "contains", mutation_id)
        self.rel(mutation_id, "mutates", target_ref)
        arg = expr.value.args[0]
        if isinstance(arg, ast.BinOp):
            op_id = self.alloc_id("op", arg)
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
        elif self.is_literal(arg):
            pass
        else:
            self.add_unsupported(arg, type(arg).__name__)

    # --- reference resolution ------------------------------------------------

    def body_reference(self, body: list[ast.stmt]) -> str:
        """Resolve a block's entry node by the position of its first statement's
        primary node — never by hardcoded literals or ordinals."""
        if not body:
            return "unsupported-empty"
        first = body[0]
        if isinstance(first, ast.If):
            return self.alloc_id("branch", first)
        if isinstance(first, ast.While):
            return self.alloc_id("loop", first)
        if isinstance(first, ast.Return):
            return self.alloc_id("ret", first)
        if isinstance(first, ast.Assign) and isinstance(first.value, ast.BinOp):
            return self.alloc_id("op", first.value)
        if isinstance(first, ast.AugAssign):
            return self.alloc_id("op", first)
        if isinstance(first, ast.Assign) and isinstance(first.targets[0], ast.Subscript):
            return self.alloc_id("mut", first)
        if (
            isinstance(first, ast.Assign)
            and len(first.targets) == 1
            and isinstance(first.targets[0], ast.Name)
        ):
            name = first.targets[0].id
            if isinstance(first.value, ast.List):
                return self.define_collection_id(name, first)
            return self.define_binding_id(name, first)
        if isinstance(first, ast.Expr) and self.is_append_call(first.value):
            return self.alloc_id("mut", first)
        if isinstance(first, ast.Expr) and self.is_print_call(first.value):
            return self.alloc_id("eff", first)
        return "unsupported-body"

    def return_value_ref(self, value: ast.expr | None) -> str:
        if isinstance(value, ast.Name):
            return self.binding_or_collection_id(value.id)
        if isinstance(value, ast.Constant) and self.is_literal(value):
            return self.alloc_id("val", value)
        if (
            isinstance(value, ast.UnaryOp)
            and isinstance(value.op, ast.USub)
            and isinstance(value.operand, ast.Constant)
        ):
            return self.alloc_id("val", value)
        if isinstance(value, (ast.BinOp, ast.BoolOp, ast.Compare, ast.UnaryOp, ast.Subscript)):
            return self.alloc_id("op", value)
        if self.is_supported_call(value):
            assert isinstance(value, ast.Call)
            return self.ensure_call_node(value, self.alloc_id("fn", self.current_function))
        if (
            isinstance(value, ast.Call)
            and isinstance(value.func, ast.Name)
            and self.current_function is not None
            and value.func.id == self.current_function.name
        ):
            self.add_unsupported(value, "recursion")
            return "unsupported-return"
        self.add_unsupported(value or self.current_function, "return value")
        return "unsupported-return"

    def read_refs(self, value: ast.expr) -> list[str]:
        refs: list[str] = []
        for node in ast.walk(value):
            if isinstance(node, ast.Name):
                if node.id in {"len", "range"}:
                    continue
                refs.append(self.binding_or_collection_id(node.id))
        return refs

    def binding_or_collection_id(self, name: str) -> str:
        if name in self.collection_ids:
            return self.collection_ids[name]
        if name in self.binding_ids:
            return self.binding_ids[name]
        # Name referenced before any definition site was recorded. This only
        # happens for unsupported programs; fall back to a positional-free
        # marker so the graph stays inspectable.
        return f"unsupported-ref-{name}"

    # --- roles ---------------------------------------------------------------

    def binding_role(self, name: str, value: ast.expr) -> str:
        if name in self.loop_iterators:
            return "iterator"
        assignments = self.assignment_sites.get(name, [])
        if len(assignments) > 1:
            return "state"
        if self.is_literal(value):
            return "constant"
        return "local"

    # --- id allocation -------------------------------------------------------

    def alloc_id(self, prefix: str, node: ast.AST) -> str:
        """Return the positional id for an AST node, stable per node and unique
        across the graph (an ordinal suffix breaks positional collisions)."""
        key = (prefix, id(node))
        cached = self._id_cache.get(key)
        if cached is not None:
            return cached
        rng = self.range_for(node)
        base = f"{prefix}-L{rng['startLine']}C{rng['startCol']}"
        candidate = base
        ordinal = 2
        while candidate in self.used_ids:
            candidate = f"{base}-{ordinal}"
            ordinal += 1
        self.used_ids.add(candidate)
        self._id_cache[key] = candidate
        return candidate

    def define_binding_id(self, name: str, def_node: ast.AST) -> str:
        existing = self.binding_ids.get(name)
        if existing is not None:
            return existing
        binding_id = self.alloc_id("bind", def_node)
        self.binding_ids[name] = binding_id
        return binding_id

    def define_collection_id(self, name: str, def_node: ast.AST) -> str:
        existing = self.collection_ids.get(name)
        if existing is not None:
            return existing
        collection_id = self.alloc_id("coll", def_node)
        self.collection_ids[name] = collection_id
        return collection_id

    # --- primitives ----------------------------------------------------------

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

    def is_print_call(self, value: ast.AST) -> bool:
        return (
            isinstance(value, ast.Call)
            and isinstance(value.func, ast.Name)
            and value.func.id == "print"
        )

    def is_supported_call(self, value: ast.AST | None) -> bool:
        return (
            isinstance(value, ast.Call)
            and isinstance(value.func, ast.Name)
            and value.func.id in {"len", "range"}
            and not value.keywords
        )

    def is_range_call(self, value: ast.AST) -> bool:
        return self.is_supported_call(value) and isinstance(value, ast.Call) and value.func.id == "range"

    def ensure_call_node(self, call: ast.Call, parent_id: str) -> str:
        call_id = self.alloc_id("call", call)
        if call_id not in self.node_ids:
            assert isinstance(call.func, ast.Name)
            self.nodes.append(
                {
                    "id": call_id,
                    "kind": "call",
                    "sourceRange": self.range_for(call),
                    "callee": call.func.id,
                    "args": [self.expr_text(arg) for arg in call.args],
                }
            )
            self.node_ids.add(call_id)
            self.rel(parent_id, "contains", call_id)
            for arg in call.args:
                for ref in self.read_refs(arg):
                    self.rel(call_id, "reads", ref)
        return call_id

    def ensure_expression_facts(self, expr: ast.AST, parent_id: str) -> None:
        for node in ast.walk(expr):
            if isinstance(node, (ast.Subscript, ast.Compare, ast.BoolOp)) or (
                isinstance(node, ast.UnaryOp) and isinstance(node.op, ast.Not)
            ):
                operation_id = self.alloc_id("op", node)
                if operation_id not in self.node_ids:
                    self.nodes.append(
                        {
                            "id": operation_id,
                            "kind": "operation",
                            "sourceRange": self.range_for(node),
                            "expr": self.expr_text(node),
                        }
                    )
                    self.node_ids.add(operation_id)
                    self.rel(parent_id, "contains", operation_id)
                    for ref in self.read_refs(node):
                        self.rel(operation_id, "reads", ref)
            elif self.is_supported_call(node):
                assert isinstance(node, ast.Call)
                self.ensure_call_node(node, parent_id)

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
            code="UNSUPPORTED_CONSTRUCT",
            construct=construct,
            message=message,
            diagnostic=f"{type(node).__name__} at line {getattr(node, 'lineno', 1)}, column {getattr(node, 'col_offset', 0)}",
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
