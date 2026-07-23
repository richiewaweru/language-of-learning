# Reusable Lens Architecture and Contracts

## Decision

```text
Surface route
→ surface controller (capabilities, context, persistence policy)
→ one Lens session
→ LensWorkspace
→ LensEngine
→ deterministic graph/trace/scene artifacts
```

Decode uses `DecodeController → decode-default session → LensWorkspace`.
The development harness mounts two independent controllers and sessions at once.
Future Lessons or Playground surfaces must create their own controllers rather
than adding a global mode switch.

## Public contracts

The public types are exported from `@lol/lens-contracts` in `workspace.ts`.

- `LensEngineRequest` contains `language: 'python'`, `source`, and `argsRepr`.
- `LensArtifacts` uses the existing `SemanticGraph`, `Trace`, `Scene`,
  `SemanticScene`, `PatternHit`, transfer, violation, and diagnostic types.
- `LensSessionState` contains serializable workspace identity and controls plus
  transient status, errors, and atomic artifacts.
- `LensSessionActions` is the only mutation surface.
- `LensCapabilities` is immutable per instance and governs editing, running,
  resetting, freeform arguments, replacement, and enabled views.
- `LensSessionPersistence` loads/saves serializable snapshots; derived artifacts
  are regenerated.

Storage keys use `lens:v1:<kind>:<owner>[:<session>]`. Segments accept only letters,
numbers, `.`, `_`, and `-`. Decode's reserved key is `lens:v1:decode:default`, but
its no-op adapter intentionally performs no read or write.

## Invariants

1. A session never mutates another session.
2. Disabled actions are rejected by the action layer, not only hidden in the UI.
3. Only enabled views render or become active.
4. Starting a run invalidates previous verified artifacts.
5. Only the latest run generation can install success or failure.
6. Unsupported input may expose diagnostics but not partial verified views.
7. Reset affects one session and restores that session's construction-time state.
8. Engine and workspace contain no Decode/Lesson mode flag.
