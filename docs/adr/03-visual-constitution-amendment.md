# Visual Constitution Amendment: Control Flow, Collapsed Semantics, Paired Bindings, and Collection Mutation

## 1. Purpose

This amendment defines how newly supported constructs appear without overcrowding the symbol language or implying more understanding than Lens has verified.

The amendment adds visual rules, not decoration. Every addition must communicate a semantic distinction.

## 2. Existing visual vocabulary remains primary

Continue composing from:

```text
value
binding
collection
state
cursor
range
loop
comparison
branch
operation
mutation
return
effect
call frame
```

New visuals are introduced only where reuse would be misleading.

## 3. Break

### Meaning

Terminate the nearest enclosing loop immediately.

### Visual rule

- originate from the branch or statement that triggered it;
- use a distinct exit edge crossing the loop boundary;
- terminate at the first post-loop state;
- label once: `Exit loop`;
- do not animate remaining iterations.

### Prohibited treatment

Do not show `break` as merely the false or true side of an ordinary branch.

## 4. Continue

### Meaning

Skip the rest of the current iteration and begin the next one.

### Visual rule

- originate from the triggering branch;
- route back to the loop iteration boundary;
- label once: `Next iteration`;
- dim skipped statements for that iteration;
- advance the cursor only after the skip event.

### Prohibited treatment

Do not route `continue` to the loop exit.

## 5. Collapsed built-in box

Applies initially to:

```text
min
max
sum
abs
membership
```

### Anatomy

```text
┌─────────────────────────────┐
│ Find maximum                │
│ Result verified             │
│ Internal steps not expanded │
└─────────────────────────────┘
```

### Rules

- use the same overall operation family as other calculations;
- add a collapse marker or secondary caption;
- show inputs entering and result leaving;
- never animate hidden comparisons or traversal;
- never display fake intermediate state.

### Learner interaction

A later “show equivalent loop” affordance may be added, but it must generate a separate pedagogical expansion rather than pretend to reveal the exact runtime internals of Python's built-in.

## 6. Boolean guards

### Rules

- show each comparison as a separate comparison unit;
- join them with `AND` or `OR`;
- show `NOT` as inversion of the following Boolean result;
- preserve short-circuit order;
- dim unevaluated clauses when short-circuiting occurs.

Example:

```python
value > 0 and value < 10
```

becomes:

```text
[value > 0] --AND--> [value < 10]
```

If the first comparison is false, the second remains visibly unevaluated.

## 7. Paired binding and enumerate

### Enumerate layout

```text
collection item focus
        │
        ├── cursor position → index
        └── selected value  → value
```

The two bindings must appear as a coordinated pair, not unrelated assignments.

### Tuple binding

This applies to both name targets and declared indexed targets.

Before applying targets:

```text
Captured values
[old right] [old left]
```

Then bind simultaneously:

```text
left  ← old right
right ← old left
```

No intermediate frame may show both variables holding the same value unless the source code genuinely produces that state.

## 8. Range exposure

For `range(start, stop, step)`, display:

```text
start
stop (exclusive)
step
current
```

Negative steps must visually reverse the movement direction.

The stop boundary must be shown as exclusive.

## 9. List-literal return

For:

```python
return [left, right]
```

show:

1. a collection-construction moment;
2. item placement in source order;
3. the constructed collection entering the return channel.

Do not show an unexplained collection appearing at the return node.

## 10. Pop

### Required sequence

1. highlight selected index;
2. detach the item;
3. show removed value separately;
4. shift remaining items left when needed;
5. update length;
6. route removed value to its binding or return destination.

## 11. Insert

### Required sequence

1. identify insertion index;
2. create space;
3. shift affected items right;
4. place new value;
5. update length.

## 12. Remove

### Required sequence

1. show collapsed or explicit first-match selection according to the semantic contract;
2. highlight the matched item;
3. remove it;
4. shift later items left;
5. update length.

For the first implementation, locating the first matching value may be treated as a collapsed part of the method call. The actual removal and shift must be explicit.

## 13. Nested collection selection

Wave C.

For `matrix[row][column]`:

1. focus the outer collection;
2. select the row;
3. establish the selected row as the active inner collection;
4. select the column;
5. read or mutate the final value.

The selection path must remain visible:

```text
matrix → row 2 → column 1
```

A one-step generic index animation is prohibited.

## 14. Unsupported state

Unsupported output should be calm, precise, and educational.

Required structure:

```text
What Lens encountered
Why it is not yet visualized
Current supported boundary
Nearest supported rewrite, when appropriate
```

All learner-facing unsupported messages must use the canonical copy table in ADR §7.1.

Do not expose raw AST names as the main message.

## 15. Density guardrail

No screen should introduce more than one unfamiliar visual primitive at a time during the Wave A pilot.

Where a feature can be expressed by composition, prefer composition over a new permanent symbol.

