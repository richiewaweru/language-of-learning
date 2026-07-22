# Hardcoding and Derivation Rules

## Allowed
Tests, expected fixture results, design tokens, route labels, semantic vocabulary, provider capabilities, and deterministic explanation templates.

## Forbidden
Product output tied to exact variable names, fixed results, fixed step indexes, fixture IDs, manually selected branch outcomes, algorithm names choosing symbols where semantic evidence exists, or provider-specific behavior in learner components.

## Required chain
source → analyzer fact → runtime event → semantic entity/event → scene step → view projection → rendered symbol/text

A feature is considered derived only after it survives renamed variables, renamed functions, changed literals, changed inputs, and structurally similar unseen examples.
