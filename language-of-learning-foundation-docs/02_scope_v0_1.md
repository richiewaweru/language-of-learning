# Scope — v0.1

## Public promise

> Paste one supported Python function and see its structural pattern, execution flow, and state changes.

## Supported Python subset

- one top-level `def`;
- positional parameters;
- assignments and augmented assignments;
- integer, float, string, boolean, and list literals;
- arithmetic and comparison operators;
- `for` over a list;
- `if` and `if/else`;
- `return`;
- `list.append`;
- `print`;
- `len`;
- simple calls.

## Explicitly unsupported

- `while`;
- imports;
- classes;
- dictionaries, sets, tuples;
- comprehensions;
- generators;
- `try/except`;
- nested functions;
- async;
- recursion;
- slicing;
- multiple top-level functions;
- network and filesystem operations;
- dynamic evaluation.

Unsupported constructs are returned as first-class regions with a named explanation.

## v0.1 semantic concepts

- value;
- binding;
- collection;
- function;
- call;
- operation;
- sequence;
- branch;
- loop;
- return;
- mutation;
- effect.

A binding may have the role `constant`, `parameter`, `local`, `iterator`, or `state`.

## v0.1 patterns

- ACCUMULATE;
- COUNT;
- FILTER;
- TRANSFORM;
- SEARCH;
- GUARD.

## Canonical fixtures

1. numeric accumulator;
2. count matching values;
3. filter positive values;
4. transform values;
5. search with early return;
6. guard clause.

## Expansion rule

A construct enters scope only after semantic schema approval, parser support, trace support, a visual law, fixtures, migration tests, and a version bump.
