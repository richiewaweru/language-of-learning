# Audit Checklist

## Deterministic pipeline
- Analyzer emits facts, not visuals.
- Trace is deterministic and sandboxed.
- Unsupported constructs are explicit.
- Symbol IDs do not leak into analyzer/runtime.

## Shared semantic truth
- Stable entity IDs.
- Source ranges.
- Previous/current snapshots.
- Confidence.
- Generic supported differs from unsupported.
- All learner views consume normalized steps.

## Hardcoding search
Search for:
- total, number, numbers, low, high, middle;
- 20, 12, fixed step counts;
- accumulate and binary_search in learner rendering;
- fixture paths in UI;
- provider names outside AI runtime;
- direct trace interpretation inside multiple views;
- fixed cursor indexes and return results.

Classify findings as acceptable fixture, acceptable copy, suspicious, confirmed bug, or dead code.

## Decode
- Flow default.
- Correct tab order.
- Unfinished upload hidden.
- Learner-facing errors.
- Responsive.
- Real API path.

## AI
- Keys server-only.
- Environment routing.
- Mock provider.
- Provider adapters.
- Server-side context verification.
- Structured validation.
- Deterministic fallback.
