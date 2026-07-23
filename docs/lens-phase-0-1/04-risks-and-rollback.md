# Risks and Rollback

| Risk | Signal | Mitigation |
|---|---|---|
| Decode visual regression | changed view/layout screenshots | retain labels/test IDs and run existing Playwright matrices |
| Stale verified output | old values remain after an error | clear artifacts at run start; regression test valid → invalid |
| Response race | older request replaces newer source | per-session run generation |
| Capability leakage | restricted harness gains controls | immutable per-instance capabilities and isolation tests |
| Persistence collision | one workspace overwrites another | validated versioned key factory and distinct harness keys |
| UI remount loss | unexpected state reset | controller owns stable session instance for mount lifetime |
| Route coupling | workspace fails in harness | static boundary test and harness mount |
| Contract drift | `unknown` artifacts reappear | public types reuse existing graph/trace/scene contracts |
| Over-extraction | lesson behavior changes | lesson progression and content are explicitly excluded |

## Rollback

The pre-extraction reference is commit `97fa2c1`. Implementation is ordered so
contracts/session primitives, engine, workspace, controller, and route reduction
can be reviewed independently. Stop or revert the extraction if artifact semantics
change, unsupported code appears verified, Decode loses an existing view, session
state leaks, or the boundary requires lesson-specific logic.
