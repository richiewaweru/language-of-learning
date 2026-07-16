# Testing and Quality

## Contract tests

Validate every boundary:

- parser to graph;
- tracer to trace;
- graph to pattern;
- graph plus trace to scene;
- scene to renderer;
- lesson to publication.

## Golden fixtures

Each fixture stores source, expected graph, relations, unsupported regions, call arguments, trace, result, patterns, and scene actions.

Required fixtures:

- accumulator;
- count;
- filter;
- transform;
- search;
- guard.

At least one fixture must contain a `constant` binding (e.g. `rate = 0.16`
used but never reassigned).

## Property tests

- deterministic IDs remain stable;
- unchanged code produces identical graph hashes;
- backward stepping restores prior bindings;
- relations reference existing nodes;
- containment forms a valid tree;
- scene actions reference valid nodes;
- unsupported regions do not disappear.

## Visual regression

Capture each primitive, key animation states, desktop, mobile, reduced motion, long identifiers, multiple inputs, unsupported regions, and truncation.

The FILTER example screenshot must show flow-teal loop frame and branch-magenta
fork simultaneously — this is the palette's acceptance test.

## Integration tests

- paste to analyze to render;
- edit and reanalyze;
- run and scrub trace;
- save analysis;
- publish verified lesson;
- open published lesson.

## Merge gate

- type checks;
- lint;
- unit tests;
- schema generation check;
- golden fixtures;
- component tests.

## Release gate

- integration suite;
- browser smoke tests;
- accessibility checks;
- visual regression review;
- security fixtures;
- staging verification;
- migration test;
- rollback plan.
