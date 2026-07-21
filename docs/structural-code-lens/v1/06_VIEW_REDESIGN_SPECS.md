# Flow, State, and Trace Redesign Specifications

## Flow

### Purpose

Show the structure and movement of computation.

### Accumulation sequence

1. Highlight the selected collection cell.
2. Derive the current-item token from that cell.
3. Move it into the loop work area.
4. Show the active operation.
5. Morph accumulator old value to new value.
6. Animate the repeat/back-edge.
7. Advance the cursor.
8. Move the final value through the return port.

### Corrections

- Do not show the final result before return.
- Do not disconnect current item from its collection source.
- Do not teleport state values.
- Do not give all elements equal visual weight.
- Do not leave operation text floating without a work-area relationship.

## State

### Purpose

Show exact factual state at the current step.

### Default columns

- Role
- Name
- Current value
- Previous value
- Change/status

### Behavior

- Highlight only changed rows.
- Group by call frame.
- Represent aliases through shared object identity.
- Use compact badges rather than full symbols.
- Keep historical values collapsed by default.

## Guided Trace

### Purpose

Explain which source code caused the current event.

### Layout

1. Step headline.
2. Active source code.
3. Event breakdown.
4. Recent-event trail.

Example:

```text
Step 5 of 11 — Update running total

Read total       2
Read number      4
Calculate        2 + 4 = 6
Update total     2 → 6
```

### Initial event glyphs

- Bind
- Read
- Select
- Calculate
- Compare
- Branch
- Repeat
- Update
- Call
- Return
- Effect
- Unsupported

### Density rules

- One primary event per step.
- No full graph in Guided mode.
- No large Flow symbols.
- No default horizontal scrolling.
- Limit visible recent history.

## Graph Inspector

Retain the current derived graph and improve it separately with focus, zoom-to-fit, minimap, inactive-edge suppression, and expandable frames.

