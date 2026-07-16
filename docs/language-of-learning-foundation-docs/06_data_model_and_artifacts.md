# Data Model and Artifact Lifecycle

## Core hierarchy

```text
Source → Analysis → Trace → Pattern hits → Scene → Lesson revision → Published artifact
```

## Principles

- Structured JSON is canonical.
- HTML and SVG are outputs.
- Verified artifacts are immutable.
- New engine versions create new artifacts.
- Published lessons pin exact artifact IDs and versions.

## Content addressing

```text
graph key = hash(source + parser version + semantic contract version)
trace key = hash(graph + call specification + tracer version)
scene key = hash(graph + optional trace + scene builder version + visual grammar version)
```

## Core tables

### source_documents
Source type, language, title, content or secure reference, content hash, save consent, timestamps.

### analyses
Source reference, versions, status, graph artifact, diagnostics.

### graph_artifacts
Graph JSON, unsupported JSON, version fields, verification state, immutable flag.

### trace_artifacts
Graph reference, call specification, trace JSON, truncation, runner version.

### scene_artifacts
Graph and trace references, scene JSON, layout version, visual grammar version.

### concepts
Slug, domain, title, concept type, summary, status, current version.

Concept types:

- semantic primitive;
- language construct;
- pattern;
- algorithm;
- data structure;
- system interaction.

### concept_relations
Prerequisite, variation-of, related-to, composed-of, contrasts-with.

### canonical_examples
Concept, source, sample call, expected result, graph, trace, difficulty, tags, verification.

### lessons
Stable identity and public slug.

### lesson_revisions
Version, objectives, prerequisites, blocks, status, verification, author, timestamps.

### checks
Prompt, answer key, rubric, transfer flag, lesson or scene reference.

### verification_runs
Artifact, validator version, checks, failures, reviewer, timestamp.

### published_artifacts
Public slug, lesson revision, pinned artifacts, publication status.

### ai_calls
Provider, model, role, latency, tokens, cost, status, error.

### telemetry_events
Minimal system and learning telemetry without raw code by default.

## Lifecycle

```text
generated → machine_checked → human_verified → published → superseded → archived
```

No direct jump from generated to published.
