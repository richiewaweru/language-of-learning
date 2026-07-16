# System Architecture

## Decision

Build a standalone monorepo. Reuse proven patterns from Lectio and Textbook Generator, but do not fork either product.

## Core flow

```text
SOURCE → PARSER → SEMANTIC GRAPH → TRACE → PATTERNS → SCENES → RENDERER
```

AI is a side channel for language and authoring assistance. It never changes deterministic artifacts.

## Monorepo

```text
language-of-learning/
├── apps/
│   ├── web/                 # Decode, Learn, Studio
│   └── api/                 # persistence, publishing, AI, auth
├── packages/
│   ├── lens-contracts/
│   ├── lens-parser-python/
│   ├── lens-tracer-python/
│   ├── lens-patterns/
│   ├── lens-scenes/
│   ├── lens-render-svelte/
│   ├── lens-learning-model/
│   ├── lens-lectio-adapter/
│   └── learning-ui-core/
├── content/
├── examples/
├── tests/
└── docs/
```

## Boundaries

### lens-contracts
Owns schemas, generated JSON Schema, types, versions, and validation errors. Imports nothing from other Lens packages.

### lens-parser-python
Owns AST parsing, source ranges, deterministic IDs, unsupported regions, and semantic graph creation.

### lens-tracer-python
Owns bounded execution, instrumentation, binding snapshots, trace events, captured effects, and truncation.

### lens-patterns
Owns deterministic pattern rules and pattern metadata.

### lens-scenes
Owns graph-to-scene conversion, trace-to-actions, automatic layout, source mapping, selection resolution, and caption keys.

### lens-render-svelte
Owns visual primitives, scene renderers, animation timing, interaction controls, accessibility, and reduced motion. It never infers semantics.

### lens-learning-model
Owns concepts, lessons, checks, prerequisites, revisions, and verification records.

### lens-lectio-adapter
Optional integration. Lens core never imports Lectio.

## Runtime

### Browser
SvelteKit plus Pyodide in a Web Worker for immediate local parsing and tracing.

### Server
FastAPI plus PostgreSQL for persistence, publication, AI assistance, server revalidation, and Studio.

## Reuse

Borrow from Lectio: module-owned truth, registries, contract export, validated examples, stable IDs, versioning, component-gallery discipline.

Borrow from Textbook Generator: FastAPI composition, configuration, auth, SQLAlchemy/Alembic, telemetry, deployment, model routing, and health checks.

Build new: semantic graph, trace runtime, pattern engine, scene model, visual grammar, synchronization, and verification workflow.
