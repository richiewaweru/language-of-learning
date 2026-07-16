# Learner validation protocol — P-motion PM7

**Status:** ready for Richie to run  
**Gate rule:** continue expanding motion only if Condition B is at least as good as A on ≥1 measure and does not harm accuracy or accessibility.

## Conditions

### A — Static structure + trace text
Use Decode or Learn with stepping, but treat motion as off (`prefers-reduced-motion: reduce` or note instant jumps). Learner sees structure, captions, and binding snapshots.

### B — Action-driven semantic motion
Same content with motion enabled (default). Learner sees token travel, state morphs, branch routes, return exit.

Equal instructional time for both conditions (suggest 8–10 minutes each). Use the same snippet:

```python
def calculate_total(prices):
    total = 0
    for price in prices:
        total = total + price
    return total
```

Call: `[3, 5, 2]`.

## Measures

| Measure | How scored |
|---------|------------|
| Output prediction | Predict final `total` before last step (correct = 10) |
| State-change explanation | Explain why total becomes 8 after the second item |
| Branch-route understanding | On filter `positive_prices([-2,4,0,7])`, name which items append and why |
| Transfer | Rename identifiers; still identify ACCUMULATE |
| Mental effort | 1–5 self-report (lower is better) |

## Results log

| Participant | Cond | Predict | Explain | Branch | Transfer | Effort | Notes |
|-------------|------|---------|---------|--------|----------|--------|-------|
| | A | | | | | | |
| | B | | | | | | |

## Pass criterion

Motion (B) improves or ties A on at least one accuracy measure, and does not worsen accessibility (keyboard / reduced-motion still usable).

Signed: _______________  Date: _______________
