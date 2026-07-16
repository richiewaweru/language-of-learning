# Semantic Contract — v0.1

## Principle

The parser may only emit what this contract defines. The renderer may only consume what this contract defines. Anything else is unsupported.

## Node kinds

```ts
type NodeKind =
  | 'value'
  | 'binding'
  | 'collection'
  | 'function'
  | 'call'
  | 'operation'
  | 'sequence'
  | 'branch'
  | 'loop'
  | 'return'
  | 'mutation'
  | 'effect';
```

Bindings carry a role:

```ts
type BindingRole = 'constant' | 'parameter' | 'local' | 'iterator' | 'state';
```

State is a role on a binding, not a separate node kind.

Roles are parser-derived: `parameter` from the function signature; `iterator`
for a loop variable; `state` for a name reassigned (or augmented-assigned)
after initialization; `constant` for a name assigned exactly once from a
literal and never reassigned; `local` otherwise. A node's kind and id never
change based on later analysis — only its role.

## Relations

```ts
type RelationType =
  | 'contains'
  | 'reads'
  | 'writes'
  | 'feeds'
  | 'returns'
  | 'iterates'
  | 'mutates';
```

`mutates` links a mutation node to the collection or binding it changes.
`triggers` is intentionally absent from v0.1: no supported construct can
trigger anything. It is reserved for the version that introduces events
and handlers.

`contains` forms a tree rooted in the analyzed function.

## Common node fields

```ts
interface SourceRange {
  startLine: number;
  startCol: number;
  endLine: number;
  endCol: number;
}

interface SemanticNodeBase {
  id: string;
  kind: NodeKind;
  sourceRange: SourceRange;
}
```

IDs are deterministic from kind, source position, and stable local ordinal.

## Graph

```ts
interface SemanticGraph {
  version: string;
  source: string;
  nodes: SemanticNode[];
  relations: Relation[];
  unsupported: UnsupportedRegion[];
  diagnostics: Diagnostic[];
}
```

Unsupported regions are never silently omitted.

## Trace

```ts
interface Trace {
  version: string;
  call: { functionId: string; argsRepr: string[] };
  steps: TraceStep[];
  result?: RuntimeValue;
  effects: CapturedEffect[];
  truncated: boolean;
  failure?: TraceFailure;
}
```

Every trace step includes a full binding snapshot. Mutation events include old and new values.

## Pattern hit

```ts
interface PatternHit {
  pattern: PatternId;
  confidence: 'deterministic' | 'candidate';
  memberNodes: string[];
  related: PatternId[];
  ruleVersion?: string;
}
```

Candidate patterns are visibly labeled.

## Scene

```ts
interface Scene {
  id: string;
  graphRef: string;
  traceRef?: string;
  visualGrammarVersion: string;
  layoutVersion: string;
  layout: LayoutNode[];
  edges: LayoutEdge[];
  steps: SceneStep[];
  mappings: SourceMapping[];
}
```

Scene actions are declarative: move, bind, advance, evaluate, change state, append, return, pulse, focus, fade.

## Selection

One global selection object drives all views:

```ts
interface Selection {
  nodeId?: string;
  line?: number;
  sourceRange?: SourceRange;
  stepIndex?: number;
}
```

The resolver supports one line mapping to many nodes and one node mapping to many trace steps.

## Version fields

Every artifact records semantic contract, parser, tracer, pattern registry, scene builder, and visual grammar versions.
