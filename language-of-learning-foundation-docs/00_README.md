# Language of Learning — Foundation Documents

This is the governing document set for the first functional release of the **Structural Code Lens / Language of Learning platform**.

The system has three connected surfaces:

1. **Decode** — paste supported code and explore its structure, execution trace, patterns, and grounded explanations.
2. **Learn** — study verified topic pathways such as functions, loop patterns, and later DSA.
3. **Studio** — author, verify, version, and publish reusable learning artifacts.

The first release is deliberately narrow:

> Paste one supported Python function and see its structural pattern, execution flow, state changes, and related learning material clearly and truthfully.

## Read order

1. `01_product_charter.md`
2. `02_scope_v0_1.md`
3. `03_system_architecture.md`
4. `04_semantic_contract.md`
5. `05_visual_constitution.md`
6. `06_data_model_and_artifacts.md`
7. `07_concept_and_pattern_atlas.md`
8. `08_security_and_sandbox.md`
9. `09_ai_boundary.md`
10. `10_authoring_verification_and_publishing.md`
11. `11_testing_and_quality.md`
12. `12_delivery_roadmap.md`
13. `13_research_and_learning_validation.md`
14. `14_implementation_work_breakdown.md`
15. `adrs/`

## Governing principles

- Deterministic truth before AI interpretation.
- The semantic graph is the source of truth.
- Renderers consume structured scenes, never free-form model drawings.
- Unsupported constructs are shown honestly.
- Published learning artifacts are versioned and human-verified.
- Visual consistency is part of correctness, not decoration.
- The Lens is standalone. Lectio and Textbook Generator may consume it through adapters later.
