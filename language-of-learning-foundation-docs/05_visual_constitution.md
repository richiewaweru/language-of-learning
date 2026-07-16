# Visual Constitution

## Purpose

The visual system is a language. Consistency is part of correctness.

## Semantic color

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

Color is never the only signal.

## Forms

value/collection → data-blue · function/call → work-purple ·
sequence/loop → flow-teal · branch → branch-magenta ·
binding[role=state]/mutation → state-gold · return → exit-green ·
effect → effect-amber · unsupported/error → alert-orange

- rounded token: runtime value;
- tag: binding name;
- outlined collection: ordered values;
- double-bordered cell: mutable state;
- purple container: function;
- transform node: operation;
- stable frame with track: loop;
- fork: branch;
- exit port: return;
- outward pulse: effect;
- dashed orange region: unsupported;
- translucent ghost: previous state.

## Arrow meanings

- solid horizontal: data movement;
- solid vertical: execution order;
- curved return: repetition;
- dashed: dependency;
- fork: conditional alternatives.

## Motion laws

1. Preserve object identity.
2. Transform rather than replace.
3. Move values along meaningful paths.
4. Show old and new state.
5. Fade skipped paths instead of deleting them.
6. Keep the skeleton spatially stable.
7. Reveal progressively.
8. Avoid decorative motion.
9. Provide back, forward, play, pause, scrub, and reset.
10. Respect reduced motion.

## Layout

- coordinates are computed;
- per-lesson manual positioning is forbidden;
- v0.1 supports one function and at most three nesting levels;
- layout failure is a validation failure;
- every scene has a static final state;
- every scene has a mobile layout.

## Accessibility

- keyboard operation;
- reduced-motion mode;
- screen-reader descriptions;
- adequate contrast;
- no color-only meanings;
- text alternatives;
- static fallback.
