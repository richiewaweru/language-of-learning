# Lens Golden Corpus

The corpus defines the product boundary by algorithms Lens promises to explain, not merely by accepted syntax.

## 1. Test record required for every snippet

Each corpus case must store:

```ts
{
  id: string,
  wave: "A" | "B" | "C" | "negative",
  concept: string,
  source: string,
  inputs: Record<string, unknown>,
  expectedFinalBindings: Record<string, unknown>,
  expectedReturn?: unknown,
  expectedEventTypes: string[],
  forbiddenEventTypes?: string[],
  expectedStepCount?: number | { min: number, max: number },
  expectedUnsupportedMessage?: string
}
```

Exact step counts should be used only where execution-step semantics are already stable. Otherwise use a bounded range until the trace contract freezes.

## 2. Wave A corpus — pilot

### A01 — Running sum

```python
def running_sum(values):
    total = 0
    for value in values:
        total += value
    return total
```

Input:

```json
{"values": [2, 4, 6]}
```

Expected:

```json
{"return": 12, "finalBindings": {"total": 12}}
```

Required concepts:

- loop;
- augmented assignment;
- state update;
- return.

### A02 — Count occurrences

```python
def count_occurrences(values, target):
    count = 0
    for value in values:
        if value == target:
            count += 1
    return count
```

Input: `values=[3,1,3,3], target=3`  
Expected return: `3`

### A03 — Linear search with early return

```python
def linear_search(values, target):
    for index in range(len(values)):
        if values[index] == target:
            return index
    return -1
```

Input: `values=[5,8,11], target=8`  
Expected return: `1`

Required concepts:

- range;
- index read;
- comparison;
- early return.

### A04 — Search with break

```python
def contains_value(values, target):
    found = False
    for value in values:
        if value == target:
            found = True
            break
    return found
```

Input: `values=[4,7,9], target=7`  
Expected return: `True`

Required event: `loop-exit`

### A05 — Filter with continue

```python
def sum_non_negative(values):
    total = 0
    for value in values:
        if value < 0:
            continue
        total += value
    return total
```

Input: `values=[3,-2,4,-1]`  
Expected return: `7`

Required event: `loop-skip`

### A06 — Boolean guard

```python
def valid_score(score):
    return score >= 0 and score <= 100
```

Inputs and expected returns:

- `score=75` → `True`
- `score=-1` → `False`
- `score=120` → `False`

Trace must preserve short-circuit evaluation.

### A07 — Negated guard

```python
def first_or_default(values, default):
    if not values:
        return default
    return values[0]
```

If empty-list truthiness is not yet part of the verified contract, replace the guard with `len(values) == 0` for the Wave A pilot and retain this case as pending.

### A08 — Indexed return

```python
def get_middle(values):
    index = len(values) // 2
    return values[index]
```

Input: `values=[2,4,6,8,10]`  
Expected return: `6`

### A09 — Comparison return

```python
def is_positive(value):
    return value > 0
```

Input: `value=3` → `True`  
Input: `value=-2` → `False`

### A10 — Built-in maximum

```python
def largest(values):
    return max(values)
```

Input: `values=[3,9,4]`  
Expected return: `9`  
Required node/event: collapsed `builtin-call` / `builtin-evaluated`

### A11 — Built-in minimum

```python
def smallest(values):
    return min(values)
```

### A12 — Built-in sum

```python
def total(values):
    return sum(values)
```

### A13 — Absolute difference

```python
def distance(left, right):
    return abs(left - right)
```

### A14 — Iterative Fibonacci

```python
def fibonacci(n):
    if n <= 1:
        return n

    previous = 0
    current = 1

    for _ in range(2, n + 1):
        next_value = previous + current
        previous = current
        current = next_value

    return current
```

Input: `n=7`  
Expected return: `13`

This is a pilot stress test for repeated state transitions.

### A15 — Binary search

```python
def binary_search(values, target):
    left = 0
    right = len(values) - 1

    while left <= right:
        middle = (left + right) // 2

        if values[middle] == target:
            return middle

        if values[middle] < target:
            left = middle + 1
        else:
            right = middle - 1

    return -1
```

Input: `values=[2,4,7,9,12], target=9`  
Expected return: `3`

This is the main Wave A integration test.

## 3. Wave B corpus

### B01 — Enumerated search

```python
def find_index(values, target):
    for index, value in enumerate(values):
        if value == target:
            return index
    return -1
```

### B02 — Swap

```python
def swap_pair(left, right):
    left, right = right, left
    return [left, right]
```

Expected semantics: capture-then-bind.

### B03 — Bubble sort

```python
def bubble_sort(values):
    n = len(values)

    for end in range(n - 1, 0, -1):
        for index in range(end):
            if values[index] > values[index + 1]:
                values[index], values[index + 1] = values[index + 1], values[index]

    return values
```

Activation requirements:

- nested-loop tracing is verified;
- loop IDs are unambiguous;
- controlled indexed tuple targets are implemented according to ADR `TupleTarget`;
- capture-then-bind semantics are verified for indexed swaps.

### B04 — Selection sort

```python
def selection_sort(values):
    for start in range(len(values)):
        smallest = start

        for index in range(start + 1, len(values)):
            if values[index] < values[smallest]:
                smallest = index

        values[start], values[smallest] = values[smallest], values[start]

    return values
```

### B05 — Insertion sort

```python
def insertion_sort(values):
    for index in range(1, len(values)):
        current = values[index]
        position = index - 1

        while position >= 0 and values[position] > current:
            values[position + 1] = values[position]
            position -= 1

        values[position + 1] = current

    return values
```

### B06 — Membership check

```python
def contains(values, target):
    return target in values
```

Expected rendering: collapsed membership check, not expanded loop.

### B07 — Pop and return

```python
def remove_last(values):
    removed = values.pop()
    return removed
```

### B08 — Insert

```python
def add_at_front(values, value):
    values.insert(0, value)
    return values
```

Required event: `items-shifted` right.

### B09 — Remove by value

```python
def remove_first(values, target):
    values.remove(target)
    return values
```

Required event: item removal plus left shift.

### B10 — Full range exposure

```python
def descending_total(start):
    total = 0
    for value in range(start, 0, -1):
        total += value
    return total
```

The visual must expose start, stop, step, and current cursor.

## 4. Wave C corpus

### C01 — Matrix traversal

```python
def matrix_sum(matrix):
    total = 0

    for row in range(len(matrix))…1246 tokens truncated…tinue

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

