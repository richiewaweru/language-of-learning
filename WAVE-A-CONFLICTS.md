# Wave A Conflicts

No unresolved governing-document conflicts were found during Wave A.

The golden corpus explicitly permits A07 to replace empty-list truthiness with `len(values) == 0` when truthiness is not already verified. The fixture uses the equivalent negated form `not len(values) == 0` so that Wave A still exercises `not` without inventing an empty-list truthiness contract.

The pre-existing `array-update` graph snapshot had a formatting-only mismatch before Wave A began. It was regenerated from the canonical analyzer together with the other integration snapshots; this was not treated as a semantic conflict.
