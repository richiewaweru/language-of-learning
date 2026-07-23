# Lens State and Pipeline Audit

## State ownership

| State | Implementation | Owner | Persistence |
|---|---|---|---|
| Source and argument text | `createLensSession` | workspace session | injected adapter |
| Active view and `Selection`/frame | `createLensSession` | workspace session | injected adapter |
| Run status, error, violation, artifacts | `createLensSession` | workspace session | derived artifacts are not persisted |
| Run generation | `createRunCoordinator` | private session concurrency state | none |
| Capabilities and enabled views | controller construction | surface controller | none |
| Input tab, drawer, technical-detail toggle | `LensWorkspace.svelte` | presentation only | none |
| Transfer answer/feedback | `DecodeController.svelte` | Decode controller | none |
| Pattern link and Ask Lens context | `DecodeController.svelte` | Decode controller | none |
| Lesson progress | existing lesson progress modules | lesson surface | existing lesson keys |

No mutable Lens store is created at module scope. Each call to `createLensSession`
creates a separate reactive state object, action set, run coordinator, capabilities,
and persistence key.

## Coupling audit

- `LensWorkspace.svelte` imports shared UI and projection components only. It has
  no Decode route, lesson progression, browser storage, or navigation dependency.
- `engine.ts` imports deterministic scene/pattern builders and the API adapter. It
  has no UI, route, lesson, storage, or global mode dependency.
- Decode-specific breadcrumbs, pattern links, transfer telemetry, Ask Lens context,
  and scope copy remain in `DecodeController.svelte`.
- Browser storage is isolated in `storage.ts` and injected. Decode explicitly uses
  `noOpLensPersistence`.

## Source-to-view pipeline

```text
CodeEditor / sample input
→ createLensSession actions
→ LensEngine.analyze({ source, argsRepr })
→ apps/web/src/lib/api.ts analyzeSource
→ apps/api/main.py analyze
→ lol_analyzer.analyze_source
→ lol_trace.run_trace
→ graph + trace + violation response
→ buildScene + normalizeSemanticScene + detectPattern + buildTransferCheck
→ one atomic LensArtifacts value
→ LensWorkspace
→ deriveFlowProjection / State / Guided Trace / Graph Inspector
```

The API and trace runtime already clear trace steps on sandbox violations. The
session now applies the same atomicity to syntax, transport, and superseded-run
failures by clearing artifacts when a run begins and installing only the current
generation's completed result.
