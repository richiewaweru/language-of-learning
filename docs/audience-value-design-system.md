# Living Diagram Notebook — Design System

**Internal direction name:** Living Diagram Notebook

## Visual principles

The experience combines:

- Clarity of an educational diagram
- Focus of a code editor
- Tactility of a printed workbook
- Liveliness of trace-driven simulation
- Restraint of a professional technical product

### Emotional qualities

Intelligent, calm, curious, spatial, tactile, alive, precise, trustworthy, welcoming.

### Must not feel like

Generic SaaS dashboard, children's coding game, IDE clone, cyberpunk developer tool, card-grid marketing template, neon animation showcase.

## Color law

Semantic palette is **law** — see `docs/design-tokens.css`. Semantic hues carry meaning and must not decorate chrome.

| Role | Token | Hex |
|------|-------|-----|
| Data and values | `--data-blue` | #3757D5 |
| Functions and calls | `--work-purple` | #7653D6 |
| Loops and sequence | `--flow-teal` | #0E8A8A |
| Branches and choices | `--branch-magenta` | #B0388A |
| Mutable state | `--state-gold` | #B68428 |
| Returns and outputs | `--exit-green` | #2F7F58 |
| External effects | `--effect-amber` | #D98E1F |
| Unsupported behavior | `--alert-orange` | #D95F24 |

Chrome uses neutral skin tokens only.

## Neutral palette

Warm paper-like neutrals: `--bg-canvas`, `--bg-page`, `--surface-paper`, `--surface-raised`, `--surface-recessed`, `--surface-code`.

Text: `--ink-strong`, `--ink-body`, `--ink-muted`, `--ink-faint`, `--ink-inverse`.

Lines: `--line-soft`, `--line-default`, `--line-strong`, `--grid-line-soft`, `--grid-line-emphasis`.

## Typography

- **Display serif** (`--font-display`): homepage hero, pathway titles only
- **UI sans** (`--font-ui`): explanations, nav, controls, lesson text
- **Mono** (`--font-mono`): code, tiny execution labels, technical evidence

Scale: `--text-xs` through `--text-3xl`.

## Spacing and layout

28px grid rhythm (`--grid-unit`). UI scale `--space-1` through `--space-11`.

Content widths: `--content-narrow` (720px) through `--content-canvas` (1520px).

## Shadows

Layered editorial shadows (`--shadow-xs` through `--shadow-lg`). Offset shadow (`--shadow-offset`) sparingly for primary actions.

## Background

Graph-paper grid on `--bg-canvas`. Nearly invisible when focused on scene. No continuous grid animation.

## Component hierarchy

1. Current learning question
2. Current execution moment
3. Code–visual relationship
4. Learner explanation
5. Controls
6. Secondary technical details

## Page wireframes

See product contract and audience-value-proposal for homepage, demo stage, and lesson layouts.

## Responsive behavior

- **Desktop:** side-by-side code and visual
- **Tablet:** balanced split or stacked
- **Mobile:** tabs Code | Visual | Explain; controls persistent

## Motion rules

Motion may only show: value origin/destination, binding receipt, state change, path selection/skip, return, execution advance.

Preserve token identity, stable skeleton, ghost old state, fade skipped branches. No decorative motion.

## Prohibited visual drift

Semantic colors on buttons/nav/headings. Bouncing UI. Particles. Random entrance animations. Every card as floating tile. Display typography inside execution canvas.
