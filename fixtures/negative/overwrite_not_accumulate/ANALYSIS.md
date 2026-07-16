Loop writes `total` from the iterator without reading the prior `total`.
Looks like ACCUMULATE at a glance but fails the "reads its own prior value" rule.
