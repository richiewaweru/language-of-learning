# Implementation Work Breakdown

## Epic A — Foundation

Monorepo, SvelteKit, contracts package, TypeScript, Vitest, Playwright, lint, CI, docs, and ADR process.

## Epic B — Contracts

Graph, trace, pattern, scene, selection schemas; JSON Schema export; fixtures; versions.

## Epic C — Parser

Pyodide worker, AST support, source ranges, deterministic IDs, binding roles, relations, unsupported regions, graph inspector.

## Epic D — Tracer

Literal arguments, instrumentation, full snapshots, mutation, loop, branch, return, print capture, timeout, step cap, hostile tests.

## Epic E — Patterns

Rule interface and six v0.1 patterns with positive and negative fixtures.

## Epic F — Scenes

Layout model, layout algorithm, semantic-to-visual mapping, trace actions, source mapping, selection resolver, overlap validation.

## Epic G — Renderers

ValueToken, BindingTag, CollectionFrame, StateCell, FunctionBoundary, OperationNode, LoopFrame, BranchFork, ReturnPort, EffectPulse, UnsupportedRegion, controls, reduced motion.

Semantic palette (design-tokens.css): value/collection → data-blue ·
function/call → work-purple · sequence/loop → flow-teal · branch →
branch-magenta · binding[role=state]/mutation → state-gold · return →
exit-green · effect → effect-amber · unsupported/error → alert-orange.

## Epic H — Decode

Editor, sample call, analyze, code view, shape view, trace view, pattern view, unsupported panel, explanation, transfer check.

## Epic I — API and persistence

FastAPI, PostgreSQL, migrations, users, projects, sources, analyses, artifacts, lessons, verification, AI calls, telemetry.

## Epic J — Studio

Concept editor, canonical examples, lesson composer, previews, verification, human checklist, publishing.

## Epic K — Learn

Lesson routes, scene embeds, static fallback, checks, progress, related concepts, navigation.

## First vertical slice

```python
def calculate_total(prices):
    total = 0
    for price in prices:
        total = total + price
    return total
```

Call: `calculate_total([3, 5, 2])`

Required outcome:

- graph identifies function, parameter, state binding, loop, operation, mutation, return;
- trace shows `0 → 3 → 8 → 10`;
- pattern is ACCUMULATE;
- code and scene synchronize;
- backward stepping works;
- transfer check asks for a count variation.
