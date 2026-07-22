# Revision Notes — Version 2

## Applied amendments

### 1. Indexed tuple swaps
`tuple-binding.targets` now accepts either a normal binding or a declared `indexed-target`. Bubble sort and selection sort now cite this contract directly.

### 2. Nested-loop audit
The runbook and Cursor brief now require explicit inspection of nested-loop tracing, stable loop IDs, cursor focus, and nearest-enclosing-loop resolution before Wave B sorting cases activate.

### 3. Canonical unsupported copy
ADR §7.1 is now the single source of truth for learner-facing unsupported messages. The corpus asserts error codes and references the ADR copy rather than duplicating text.

### 4. `/=` moved to Wave B
Wave A now supports `+=`, `-=`, `*=`, `//=`, and `%=` on simple names. `/=` moves to Wave B with explicit float display and normalized numeric equality requirements.

### 5. Snapshot lifecycle
Active-wave tests assert structural invariants. Full graph and trace snapshots are frozen only at the wave review gate, then become byte-exact regression locks.

