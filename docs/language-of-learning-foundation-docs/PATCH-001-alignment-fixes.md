# PATCH-001 — Alignment fixes to language-of-learning-foundation-docs
**For:** Cursor (or any implementing agent).
**Applies to:** the 20-file foundation docs set (`language-of-learning-foundation-docs/`).
**Authority:** semantic-contract.md and visual-constitution.md take precedence over these docs (see autonomous-build-brief.md §1). This patch brings the docs into compliance so no conflict remains at build time.
**Rule:** apply exactly; where a doc phrases things differently than the "find" text below, locate the equivalent statement and apply the same semantic change. After patching, run the verification greps at the bottom.

---

## FIX 1 — Restore the `constant` binding role (5 roles, not 4)

**Why:** the docs dropped `constant` (a name assigned once and never reassigned). It is parser-derivable for free and pedagogically useful (a constant renders as a plain tag; it never earns a state cell).

### 1a. `04_semantic_contract.md` — BindingRole type
FIND:
```ts
type BindingRole = 'parameter' | 'local' | 'iterator' | 'state';
```
REPLACE WITH:
```ts
type BindingRole = 'constant' | 'parameter' | 'local' | 'iterator' | 'state';
```

### 1b. `04_semantic_contract.md` — add the role-derivation rule
Immediately after the line "State is a role on a binding, not a separate node kind." ADD:
```
Roles are parser-derived: `parameter` from the function signature; `iterator`
for a loop variable; `state` for a name reassigned (or augmented-assigned)
after initialization; `constant` for a name assigned exactly once from a
literal and never reassigned; `local` otherwise. A node's kind and id never
change based on later analysis — only its role.
```

### 1c. Sweep the rest of the set
In `06_data_model_and_artifacts.md`, `07_concept_and_pattern_atlas.md`, and `11_testing_and_quality.md`: wherever binding roles are enumerated, use the 5-role list. Add one golden-fixture requirement to `11_testing_and_quality.md`: at least one fixture must contain a `constant` binding (e.g. `rate = 0.16` used but never reassigned).

---

## FIX 2 — Relations: keep `mutates`, remove `triggers`

**Why:** `mutates` pairs with the `mutation` node kind and is detectable in v0.1 (`.append`, augmented assignment targets). `triggers` has no possible source in the v0.1 subset (no events, no handlers, no callbacks) — an unused relation type invites speculative parser code and untestable schema branches. It returns with events/handlers in a future version.

### 2a. `04_semantic_contract.md` — RelationType
FIND:
```ts
type RelationType =
  | 'contains'
  | 'reads'
  | 'writes'
  | 'feeds'
  | 'returns'
  | 'iterates'
  | 'mutates'
  | 'triggers';
```
REPLACE WITH:
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
Then ADD directly below the type:
```
`mutates` links a mutation node to the collection or binding it changes.
`triggers` is intentionally absent from v0.1: no supported construct can
trigger anything. It is reserved for the version that introduces events
and handlers.
```

### 2b. Sweep
Remove/adjust any other mention of `triggers` as a v0.1 relation in `03_system_architecture.md`, `06_data_model_and_artifacts.md`, and `11_testing_and_quality.md`. If a doc lists it under "future," that's fine — leave future mentions.

---

## FIX 3 — Semantic palette: the full 8 hues are law, not the PoC's 5

**Why:** one hue per meaning is the core visual discipline. The 5-color list merges loops into blue and leaves branches hueless — which fails exactly when a FILTER (loop + branch on one canvas) is rendered and the learner must see two different structures. The PoC only used 5 because its examples never drew that case. Canonical tokens live in `design-tokens.css`; docs must match it.

### 3a. `05_visual_constitution.md` — color list
FIND (the color meanings list):
```
- Blue: values, collections, and data movement.
- Purple: function and reusable-work boundaries.
- Gold: mutable or remembered state.
- Green: transformation and successful output.
- Orange: errors, unsupported constructs, and interruption.
```
REPLACE WITH:
```
- data-blue #3757D5: values, collections, and data movement.
- work-purple #7653D6: function and reusable-work boundaries.
- flow-teal #0E8A8A: sequence lines and loop frames.
- branch-magenta #B0388A: conditions and forks.
- state-gold #B68428: mutable or remembered state, and mutation.
- exit-green #2F7F58: returns and successful output.
- effect-amber #D98E1F: externally observable actions (print; later file/network).
- alert-orange #D95F24: errors, unsupported constructs, and interruption.

Canonical values live in design-tokens.css. Skin/chrome tokens (paper, ink,
grid, shadows) are defined there too and are never used on canvas elements.
Focus = weight/glow of the element's own hue; dimming = opacity 0.35;
no new colors for emphasis, ever.
```

### 3b. `05_visual_constitution.md` — element mapping
Where structural forms are listed (pill, container, fork, etc.), ensure the mapping reads:
```
value/collection → data-blue · function/call → work-purple ·
sequence/loop → flow-teal · branch → branch-magenta ·
binding[role=state]/mutation → state-gold · return → exit-green ·
effect → effect-amber · unsupported/error → alert-orange
```

### 3c. Sweep + test hook
Any renderer/component doc (`03_system_architecture.md`, `11_testing_and_quality.md`, Epic G in `14_implementation_work_breakdown.md`) referencing the 5-color palette updates to the 8-hue mapping. Add to visual-regression requirements in `11_testing_and_quality.md`: "the FILTER example screenshot must show flow-teal loop frame and branch-magenta fork simultaneously — this is the palette's acceptance test."

---

## Verification (run after applying)

```bash
cd language-of-learning-foundation-docs
# FIX 1: constant role present, 0 four-role lists remain
grep -rn "'constant'" 04_semantic_contract.md | wc -l          # expect ≥ 1
grep -rn "'parameter' | 'local' | 'iterator' | 'state';" . | wc -l   # expect 0
# FIX 2: triggers absent as v0.1 relation
grep -rn "'triggers'" . | wc -l                                # expect 0 (prose "reserved/future" mentions OK)
grep -rn "'mutates'" 04_semantic_contract.md | wc -l           # expect ≥ 1
# FIX 3: all 8 hues named in the constitution
grep -c "data-blue\|work-purple\|flow-teal\|branch-magenta\|state-gold\|exit-green\|effect-amber\|alert-orange" 05_visual_constitution.md   # expect ≥ 8
```

**Out of scope for this patch:** everything else. No restructuring, no scope changes, no new sections beyond those specified. If a FIND string can't be located, find the semantically equivalent passage, apply the same change, and note the file+line in a short PATCH-001-REPORT.md.
