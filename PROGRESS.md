# PROGRESS.md

## Current phase

**F4 — complete.** Corrective run F0–F4 done (`gate-F4`). P-motion deferred.

## Last gate

**gate-F4** — 2026-07-16

## Gate report — F4 (final corrective)

```
1. visit_stmt count = 1
2. analyzer fixture-string greps = 0
3. itemCount={5} greps = 0
4. __return__ in apps/web + visual-grammar = 0
5. .(loops|branches|mutations|returns)[0] in packages = 0
6. pnpm test:all — green (analyzer, trace, variations, patterns, scenes,
   fixtures, journey, api-save, lessons, parity-ops, visual, typecheck, lint)
7. pnpm content:rebuild — scenes regenerated with position ids
8. docs/decisions/0007* + 0008* exist
9. CI workflow present (content drift step included)
```

### What shipped (F1–F4)

- Position-based analyzer IDs + 13 variations anti-overfit suite
- Server re-verify on save + engineVersion 0.1.1 + content:rebuild
- Controlled ScenePlayer + Decode/slices/Learn Selection sync
- Renderer truth (item count, return port) + Learn preview badge + ADRs

### Manual (Richie)

(a) Decode renamed accumulator → correct pattern/shape/transfer  
(b) click line 4 → all views move; step → code follows  
(c) filter slice: 3 items = 3 positions; return shows real value  
(d) Learn pages show preview badge until verified_by set
