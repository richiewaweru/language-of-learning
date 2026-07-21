# Audience Value Product Contract

**Authority:** This document governs the V0–V4 audience layer. Conflicts resolve per document precedence (semantic-contract.md first).

## Public promise

> See what code is doing, not just what it says.

Language of Learning turns code into a synchronized visual model of values, decisions, state changes, and results.

## Target audiences

1. Beginner and intermediate programming learners
2. Programming teachers and tutors
3. Curriculum designers
4. Technical evaluators (secondary; details in `/how-it-works`)

## Route hierarchy

### Primary public routes

| Route | Purpose |
|-------|---------|
| `/` | Public landing page |
| `/demo` | Redirects to flagship lesson |
| `/learn` | Learning pathway index |
| `/learn/python-foundations` | Pathway browser |
| `/learn/python-foundations/loops/{accumulate,count,filter,transform}` | Lessons (canonical) |
| `/library` | Saved content stub |
| `/decode` | Paste-code experience |
| `/how-it-works` | Optional technical explanation |
| `/about` | Product about page |
| `/internal/style-gallery` | Design token gallery (internal) |

Legacy `/learn/how-loops-build-results/*` redirects to `python-foundations/loops/*`.

### Secondary (developer) routes

| Route | Purpose |
|-------|---------|
| `/debug/graph` | Graph inspector |
| `/slices/accumulate` | Accumulate slice |
| `/slices/filter` | Filter slice |

Developer routes must not appear in primary navigation.

## Primary navigation

Maximum four items: **Learn · Decode · Library** (+ progress cluster in header)

Footer links: How It Works, About, developer tools.

Logo/product name returns to `/`.

## Flagship example

```python
def calculate_total(numbers):
    total = 0
    for number in numbers:
        total = total + number
    return total
```

Call: `calculate_total([3, 5, 2])` → result `10`

Must run through the real analyzer, trace runtime, pattern engine, scene builder, and motion-state reducer.

## Lesson anatomy (required sections)

Every lesson must contain:

1. Question
2. Static structure preview
3. Prediction
4. Step-by-step execution
5. Pattern explanation
6. Variation
7. Neighbor comparison
8. Transfer check
9. Summary

## Connected Truth View

Five synchronized regions: Code, Structural visual, Runtime values, Explanation, Progress.

Selecting an entity in one region reveals counterparts in others via the shared Selection contract and TruthDrawer.

Learner drawer fields: What is this? · Current value · Where did it come from? · What changed it? · Where is it going? · Why is it active now?

Technical evidence defaults to closed.

## Learner-facing terminology

Use: current value, running total, current item, remembered state, condition, chosen path, result, function, loop, next step.

Avoid in primary experience: semantic graph, trace artifact, scene reducer, pattern detector, AST node, motion contract, graph inspector.

## Prohibited product drift

- Generic marketing site without real engine demo
- IDE clone aesthetics
- Children's game gamification
- Animation showcase without trace events
- Dashboard fragmentation
- Manual lesson truth (hand-typed caption values)
- LLM-generated execution truth
- Decorative motion unrelated to execution

## Acceptance gates

| Gate | Key criteria |
|------|--------------|
| gate-V0 | Audience homepage; nav ≤4 items; dev routes demoted; responsive |
| gate-V1 | Flagship demo engine-derived; learner captions; mobile + static fallback |
| gate-V2 | Four lessons with full anatomy; machine gate 4/4 |
| gate-V3 | Bidirectional selection; TruthDrawer; keyboard/SR |
| gate-V4 | No P0/P1 defects; full suite green; human validation protocol filed |

Human validation (five-person learner protocol, teacher review, Richie sign-off) remains `PENDING-HUMAN` until evidence exists.
