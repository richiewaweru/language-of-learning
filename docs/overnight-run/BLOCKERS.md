# Blockers

No active blockers at handoff.

## Resolved during the run

- Local browser API calls were initially blocked because CORS allowed `localhost:4173` but not `127.0.0.1:4173`; the explicit local acceptance origin was added.
- Live DeepSeek initially degraded to deterministic fallback because the model returned fenced/type-invalid JSON; provider-neutral parsing, schema validation, and a single correction retry resolved it.
- The baseline-only Svelte diagnostic exposed a missing `semanticScene` in a variation pack; it was corrected and the final diagnostic has zero errors and zero warnings.
