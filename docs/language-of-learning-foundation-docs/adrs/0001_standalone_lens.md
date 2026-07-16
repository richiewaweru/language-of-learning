# ADR 0001 — Standalone Lens

## Decision
The Lens engine and renderer are standalone packages. Lectio may consume approved artifacts through `lens-lectio-adapter`.

## Rationale
Decode, Learn, IDE extensions, repository viewers, and future products must use the same core without depending on lesson-document infrastructure.

## Rejected
- permanent Lectio computer-science branch;
- Lectio fork;
- low-level Lens primitives inside the Lectio registry.
