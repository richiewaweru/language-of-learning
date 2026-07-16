# Hand analysis — accumulate

- Nodes: function + param `prices` + state `total` + val `0` + loop + iterator + op `total+price` + return.
- Key ids by position: `fn-L1C0`, state bind on L2, loop on L3, op on L4, ret on L5.
- Pattern: ACCUMULATE — state written from prior value + iterator inside one loop; no early return.
