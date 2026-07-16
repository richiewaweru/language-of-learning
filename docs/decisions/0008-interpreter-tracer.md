# ADR 0008 — Purpose-built interpreter tracer

**Status:** Accepted (corrective F4, 2026-07-16)

## Context

The trace runtime re-implements expression evaluation rather than instrumenting CPython bytecode. This gives sandbox control and exact event fidelity (loop_advance, condition_eval, state_change, …) aligned to the semantic graph.

## Decision

Keep the purpose-built interpreter in `packages/trace-runtime`. Mitigate semantic divergence from real Python with an operator parity suite comparing interpreter results to CPython evaluation of the same expression under sandbox constraints (`tools/run_interpreter_parity.py`).

## Risks

- `/` always yields float in both (Python 3); intentional.
- Unsupported constructs raise `SandboxViolation` rather than running — by design.

## Mitigation

Parity covers supported binops (`+ - * /`), comparisons (`> < >= <= == !=`), and unary minus. Divergences are fixed or listed in the test module docstring.
