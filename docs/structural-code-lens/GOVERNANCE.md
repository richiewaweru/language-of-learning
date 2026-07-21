# Structural Code Lens artifact governance

The imported implementation pack in `v1/` is the governing product and view specification for Structural Code Lens v1.

The existing v0.1 semantic contract remains authoritative at the raw analyzer and runtime boundaries. The v1 semantic model is a normalization contract between those factual outputs and all learner-facing views. This preserves deterministic fixtures while allowing richer entities, events, snapshots, identity, and source evidence.

Version ownership:

- Raw semantic graph and trace: existing engine contract, backwards compatible.
- Normalized semantic scene: `semanticModelVersion: 1.0.0`.
- Registered visual grammar: `grammarVersion: 1.0.0`.

The view-responsibility ADR in `v1/02_ARCHITECTURE_AND_VIEW_ADR.md` is accepted by this repository. Where its proposed semantic types differ from the raw v0.1 schema, the normalizer is the explicit compatibility boundary.
