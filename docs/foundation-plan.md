# Foundation Plan — Language of Learning v0.1

**Authority:** Synthesized from `03_system_architecture.md` and `autonomous-build-brief.md` §3. On conflict, `semantic-contract.md` and `visual-constitution.md` win.

## Architecture

```text
SOURCE → PARSER → SEMANTIC GRAPH → TRACE → PATTERNS → SCENES → RENDERER
```

AI is a side channel only. It never changes deterministic artifacts.

## Monorepo layout (v0.1-local)

```text
language-of-learning/
├── apps/
│   ├── web/                    # SvelteKit — Decode, Learn, Studio surfaces
│   └── api/                    # FastAPI — persistence, events (SQLite v0.1-local)
├── packages/
│   ├── lens-contracts/         # Zod schemas, JSON Schema export, types
│   ├── analyzer-python/        # AST → semantic graph (CPython + Pyodide)
│   ├── trace-runtime/          # Instrumented execution, sandbox
│   ├── lens-patterns/          # Deterministic pattern rules
│   ├── lens-scenes/            # Layout engine, scene builder, selection resolver
│   └── visual-grammar/         # Svelte visual primitives + motion
├── fixtures/                   # Golden fixtures (six patterns)
├── content/                    # Lesson JSON
├── docs/                       # Governing documents
├── reference/                  # HTML PoCs (look/feel only)
└── vendor/pyodide/             # Vendored Pyodide (setup script)
```

## Package boundaries

- **lens-contracts** — schemas only; imports nothing from other Lens packages.
- **analyzer-python** — parsing, deterministic IDs, unsupported regions.
- **trace-runtime** — bounded execution, binding snapshots, hostile containment.
- **lens-patterns** — six v0.1 rules; no LLM path.
- **lens-scenes** — layout (zero hand coordinates), trace→actions, selection resolver.
- **visual-grammar** — primitives, controls, reduced motion; never infers semantics.

## Local-only constraints (v0.1)

- pnpm workspaces; `workspace:*` links; no npm publishing.
- Pyodide vendored locally; no CDN at runtime.
- SQLite (or JSON file store) behind repository interface; Alembic-ready; no auth.
- No LLM calls at build or runtime; `ExplanationProvider` stub with deterministic fake.
- Telemetry → local NDJSON file.
- Node 20+, Python 3.12, pnpm 9.

## Runtime

- **Browser:** SvelteKit + Pyodide Web Worker for parse/trace.
- **Server:** FastAPI for save/load and lesson API (localhost only in v0.1-local).

## Reuse notes

From Lectio: module-owned truth, registries, contract export, stable IDs, versioning.

From Textbook Generator: FastAPI composition, SQLAlchemy/Alembic patterns (Postgres deferred).

Build new: semantic graph, trace runtime, pattern engine, scene model, visual grammar, sync.
