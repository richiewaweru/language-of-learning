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

    for row in range(len(matrix)):
        for column in range(len(matrix[row])):
            total += matrix[row][column]

    return total
```

### C02 — Matrix update

```python
def mark_cell(matrix, row, column, value):
    matrix[row][column] = value
    return matrix
```

### C03 — Count target in grid

```python
def count_in_grid(matrix, target):
    count = 0

    for row in range(len(matrix)):
        for column in range(len(matrix[row])):
            if matrix[row][column] == target:
                count += 1

    return count
```

### C04 — Basic DP table

```python
def stair_ways(n):
    ways = [0] * (n + 1)
    ways[0] = 1

    for step in range(1, n + 1):
        ways[step] = ways[step - 1]

        if step >= 2:
            ways[step] += ways[step - 2]

    return ways[n]
```

This case may require list repetition support. If that is outside Wave C, initialize the fixed example explicitly in the corpus or add list repetition as a separately declared contract.

## 5. Negative corpus

Each case must assert the exact learner-facing message and that no verified graph is rendered.

### N01 — Multiple top-level functions

Expected error code: `UNSUPPORTED_MULTIPLE_FUNCTIONS`

Expected learner message: use the canonical copy in ADR §7.1.

### N02 — Recursion

Expected error code: `UNSUPPORTED_RECURSION`

Expected learner message: use the canonical copy in ADR §7.1.

### N03 — Class

Expected error code: `UNSUPPORTED_CLASS`

Expected learner message: use the canonical copy in ADR §7.1.

### N04 — Dictionary

Expected error code: `UNSUPPORTED_DICTIONARY`

Expected learner message: use the canonical copy in ADR §7.1.

### N05 — Comprehension

Expected error code: `UNSUPPORTED_COMPREHENSION`

Expected learner message: use the canonical copy in ADR §7.1.

### N06 — Exception handling

Expected error code: `UNSUPPORTED_EXCEPTION_FLOW`

Expected learner message: use the canonical copy in ADR §7.1.

### N07 — Import

Expected error code: `UNSUPPORTED_IMPORT`

Expected learner message: use the canonical copy in ADR §7.1.

### N08 — Generator

Expected error code: `UNSUPPORTED_GENERATOR`

Expected learner message: use the canonical copy in ADR §7.1.

### N09 — Async function

Expected error code: `UNSUPPORTED_ASYNC`

Expected learner message: use the canonical copy in ADR §7.1.

### N10 — Nested function

Expected error code: `UNSUPPORTED_NESTED_FUNCTION`

Expected learner message: use the canonical copy in ADR §7.1.

## 6. Snapshot policy

During active development inside a wave, tests assert structural invariants rather than full byte-exact graph snapshots:

- required node kinds;
- key edges and relationships;
- required and forbidden event ordering;
- final bindings and return value;
- support/unsupported status;
- canonical error code and message.

Full `expected-graph.json` and byte-exact trace goldens are generated and frozen only at the wave review gate.

After a wave is accepted, its frozen full snapshots become regression locks for all later waves.

## 7. Golden-corpus CI gates

A pull request fails when:

- a positive case changes its final result;
- an expected event disappears;
- a forbidden event appears;
- analyzer and tracer disagree on supported status;
- an unsupported message changes without ADR approval;
- a construct falls back to a generic node despite a declared semantic node;
- a Wave A change breaks a frozen Wave A case during Wave B or C.
