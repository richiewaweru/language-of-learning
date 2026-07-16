# Semantic Contract — Structural Code Lens v0.1
**Status:** governing document. This is the interface between the deterministic pipeline and the renderer. The parser may only emit what this contract defines; the renderer may only consume what this contract defines. Anything outside the contract is, by definition, UNSUPPORTED.

**Companion:** visual-constitution.md (how contract objects are drawn).

**Authority & alignment.** Four layers, four different jobs — kept deliberately distinct:
- **Semantic node kind** — what the parser emits (this contract; eleven kinds; governs what the system can *truthfully analyze*).
- **Pattern** — what a composition of nodes is doing (registry, §6).
- **Educational concept** — what the learner may study (programming-primitive-map.md, the teaching atlas; broader than and not equal to the parser ontology).
- **Visual representation** — how one or more of the above are displayed (visual-constitution.md).

Example of the layers cooperating: parser emits `function + loop + state-role binding + operation + return` → pattern detector emits `ACCUMULATE` → the atlas links FUNCTION, LOOP, STATE, RETURN, COMPOSITION cards → the renderer shows the Accumulator scene. The parser ontology never expands to match the atlas; the atlas never constrains the parser.

---

## 1. Pipeline

```
source code (Python subset)
  → [1] Parser (Python AST, via Pyodide in-browser)   — structure, deterministic
  → [2] Semantic Graph                                 — nodes + relations + source ranges
  → [3] Trace Runner (instrumented execution, Pyodide) — steps, deterministic
  → [4] Pattern Detector (rules over the graph)        — pattern annotations
  → [5] Scene Builder                                  — Scene objects for the renderer
  → [6] Renderer (component library)                   — the four synchronized views
  LLM (side channel only): captions at language level, analogies, pattern
  naming for uncertain cases (flagged as candidate), transfer questions.
  The LLM never adds nodes, edges, steps, or patterns to the graph.
```

Two sources of determinism, kept distinct:
- **Structure** comes from parsing (no execution needed).
- **Trace** comes from running the code with instrumentation (bounded: max 500 steps, 2s timeout, no I/O beyond captured effects).

---

## 2. Node kinds (primitive set v0.1)

Exactly twelve. The renderer has one component per kind. A parser output containing any other kind is a contract violation.

| kind | emitted for | required fields |
|---|---|---|
| `value` | literals and computed values | `repr`, `pyType` |
| `binding` | a name bound to a value | `name`, `role: "constant" \| "parameter" \| "local" \| "iterator" \| "state"`, `mutable`, `initialRepr?` |
| `collection` | list literals / list-typed bindings | `name?`, `items[]` |
| `function` | `def` | `name`, `params[]` |
| `call` | function/method invocation | `callee`, `args[]` |
| `operation` | arithmetic / comparison / concatenation | `expr` |
| `sequence` | ordered statements in a body | `children[]` |
| `branch` | `if` / `if-else` | `conditionExpr`, `trueBody`, `falseBody?` |
| `loop` | `for` over a collection | `iteratorName`, `collectionRef`, `body` |
| `return` | `return` | `valueRef` |
| `mutation` | changes to program-owned data (`.append`, augmented assignment targets) | `targetRef`, `mutationType` |
| `effect` | externally observable actions (`print`; later: file, network) | `effectType` |

**Common fields on every node:** `id` (stable string), `kind`, `sourceRange { startLine, startCol, endLine, endCol }`.

**Rules.**
- N1. **State is a role, not a kind.** Binding roles are parser-derived: `parameter` (from the signature), `iterator` (loop variable), `constant` (assigned once, never reassigned), `local` (assigned once, non-constant usage), `state` (reassigned after initialization). The identifier's node kind and id never change based on later analysis — only its role. The renderer draws `role: "state"` bindings as the double-bordered state cell (constitution §3).
- N2. IDs are deterministic (derived from kind + source position) so re-analysis of unchanged code yields identical IDs — selections survive re-analysis.
- N3. **Mutation vs effect** (adopted pre-implementation, cheapest moment): `mutation` changes program-owned data and renders in the `state-gold` family; `effect` touches the world outside the program and renders `effect-amber`. The trace events `collection_append` → mutation, `effect_fire` → effect.

## 3. Relations

```
{ from: nodeId, type: RelationType, to: nodeId }
RelationType = "contains" | "reads" | "writes" | "feeds" | "returns" | "iterates" | "mutates"
```
- `contains` — structural nesting (drawn as containment, per S2)
- `reads` / `writes` — data dependence on bindings/state (horizontal arrows)
- `feeds` — output of one node is input of another (composition)
- `iterates` — loop → collection
- `mutates` — mutation node → the collection/binding it changes (pairs with the `mutation` kind)
- *(`triggers` is deferred: no v0.1 construct can trigger anything; it returns with events/handlers.)*

R1. The `contains` relation must form a tree rooted at a single `function` (v0.1 analyzes one function per run).

## 4. Semantic Graph envelope

```json
{
  "version": "0.1",
  "source": "<the analyzed code>",
  "nodes": [ ...Node ],
  "relations": [ ...Relation ],
  "unsupported": [
    { "sourceRange": {...}, "construct": "async function",
      "message": "This version does not yet visualize async functions." }
  ]
}
```
U1. Unsupported regions are first-class output, rendered per constitution A6. The analyzer never silently skips code.

---

## 5. Trace schema

Produced by instrumented execution of one sample call (user-editable arguments, validated literals only).

```json
{
  "call": { "functionId": "fn-1", "argsRepr": ["[3, 5, 2]"] },
  "steps": [
    {
      "index": 2,
      "line": 4,
      "focus": ["loop-1"],
      "bindings": { "price": "3", "total": "0" },
      "event": { "type": "loop_advance", "loop": "loop-1",
                 "itemIndex": 0, "itemRepr": "3" }
    }
  ],
  "result": { "repr": "10" },
  "truncated": false
}
```

**Event types (closed set):** `call_enter`, `bind_param`, `state_init`, `loop_advance`, `condition_eval` (with `result: true|false`), `state_change` (with `oldRepr`, `newRepr`), `collection_append`, `effect_fire`, `return_exit`.

T1. Every step carries the full `bindings` snapshot → BACK is a true inverse for free (constitution §5).
T2. `state_change` must include old and new reprs → the ghost animation (M4) is data-driven.
T3. Steps are capped (500) with `truncated: true` and an honest banner beyond the cap.

**Sandbox rules (T4, mandatory).** The trace runner executes learner code and must be hard-isolated:
- no network access; no filesystem access; no dynamic imports (`import` outside the supported list is UNSUPPORTED at parse time anyway);
- `eval`, `exec`, `compile`, `getattr`-based escape routes, and dunder introspection of the instrumentation are blocked;
- resource caps: 2 s wall time, 500 trace steps, **and a memory ceiling (default 64 MB)** — oversized literals or allocations terminate the run with an honest banner;
- sample-call arguments are validated literals only, never expressions.
A sandbox violation is reported like any UNSUPPORTED construct — named, visible, calm.

---

## 6. Pattern registry

Patterns are rules over the graph, not LLM guesses. v0.1 registry:

| pattern | detection rule (over graph) | learner verb |
|---|---|---|
| `ACCUMULATE` | loop `contains` a write to a `role:"state"` binding that `reads` its own prior value + the iterator | "build up one value" |
| `FILTER` | loop `contains` branch whose true-body `writes`/appends to a collection | "keep only some items" |
| `COUNT` | ACCUMULATE where the operation is `+ 1` and iterator is unread in the update | "count matching items" |
| `TRANSFORM` | loop appends an operation-of-iterator to a new collection, no branch | "change every item" |
| `SEARCH` | loop `contains` branch whose true-body `contains` return/break | "stop at the first match" |
| `GUARD` | branch at function head whose true-body returns early | "reject bad input first" |

```json
{ "pattern": "ACCUMULATE", "confidence": "deterministic",
  "memberNodes": ["loop-1", "state-total", "op-1"],
  "related": ["COUNT", "FILTER", "SEARCH"] }
```

P1. `confidence` is `"deterministic"` when a rule fires. The LLM may propose `"candidate"` patterns only when no rule fires, and candidates render with a visible "suggested" tag. The registry grows only by adding rules, never by trusting candidates silently.
P2. `related` powers the PATTERN view's "show relatives" — each related form links to a canonical example in `/examples`.

---

## 7. Scene schema (renderer input)

```ts
interface Scene {
  id: string;
  graphRef: string;                    // semantic graph version/id
  layout: LayoutNode[];                // computed positions — never hand-authored
  steps: SceneStep[];                  // derived 1:1 from trace steps
}

interface SceneStep {
  index: number;
  focus: string[];                     // node ids (M6: one primary)
  line: number;                        // code view sync
  actions: Action[];
  caption: { key: string; params: Record<string,string> };
}

type Action =
  | { type: "move_value";  repr: string; fromNode: string; toNode: string }
  | { type: "advance_item"; loop: string; itemIndex: number }
  | { type: "evaluate";     branch: string; result: boolean }      // → M3
  | { type: "change_state"; cell: string; oldRepr: string; newRepr: string } // → M4
  | { type: "exit_return";  repr: string; port: string }           // → M5
  | { type: "pulse_effect"; node: string };
```

SC1. Actions are declarative; the component library owns all timing and easing (constitution §4). No scene may carry animation code.
SC2. `layout` comes from the scene builder's layout engine. Hand-placed coordinates are a contract violation (lesson from the mockup).
SC3. Captions are **deterministic by default**: `caption.key` + params filled with real identifiers from the trace, rendered from the built-in template set. LLM involvement (localization, language-level adjustment) is an optional post-v0.1 layer applied to *templates offline*, never to facts, and ships only after the mechanics are validated.

---

## 8. Synchronization contract

One global selection object drives all views:

```ts
interface Selection { nodeId?: string; line?: number; stepIndex?: number; }
```
Any view may set any field; a resolver maps between them. All views re-render from the same Selection. Views never talk to each other directly — only through Selection. This is constitution A2 made mechanical.

**Resolver rules.**
- SY1. Line → nodes is one-to-many: `resolve(line) → nodeIds[]`. One line can hold several nodes (`return double(x + 1)` = operation + call + return).
- SY2. Primary selection among co-located nodes is chosen by column containment first, then innermost nesting (the most specific node under the cursor wins); the remaining co-located nodes render as secondary highlights.
- SY3. Node ↔ steps resolves via `steps[].focus`; step → line via the step's `line` field.

---

## 9. v0.1 language subset (parser scope)

**Supported:** `def` (single function), positional params, assignments and augmented assignments, `int`/`float`/`str`/`bool`/list literals, arithmetic and comparison operators, `for` over a list, `if`/`else`, `return`, `list.append`, `print`, `len`.
**Explicitly unsupported (emit `unsupported`):** `while`, nested functions, classes, imports, dict/set/tuple, comprehensions, `try`, `async`, slicing, recursion (deferred to v0.2 — it needs its own visual law), multiple functions per analysis.

The two canonical examples (accumulator, filter) plus COUNT/TRANSFORM/SEARCH/GUARD one-liners in `/examples` must all parse, trace, and pattern-detect green before v0.1 ships.

---

## 10. Validation

Every stage boundary is schema-validated (Zod or equivalent). A validation failure never degrades silently: it surfaces as an honest UNSUPPORTED banner with the failing construct named. The pipeline's promise: **everything on screen is either deterministically true or explicitly labeled as a suggestion or a gap.**
