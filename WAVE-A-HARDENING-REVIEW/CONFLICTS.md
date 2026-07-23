# Conflicts and Audited Tensions

## Corrupted committed corpus

`docs/adr/02-golden-corpus.md` was corrupted in committed `main` from line 387. It was restored from `lens-thoughtful-implementation-pack-v2.zip`, the intact ADR v2 source. No semantics were invented.

## Patch authority

The hardening patch narrows an older Cursor implementation brief. The patch is authoritative for this bounded change.

## Literal-list boundary

The patch requires literal-only list assignment parity while ADR v2 otherwise defers general collection construction. The implementation supports only the declared scalar-literal assignment boundary and does not activate Wave B collection construction or list-literal returns.

## Three-argument range

Existing analyzer/tracer execution supports three arguments, while explicit renderer exposure is deferred. The matrix records renderer status as `experimental`.

## Prior browser-message claim

The prior review bundle described canonical browser messaging even though `/analyze` could return `violation: null` after analyzer rejection. This patch routes the analyzer rejection through the trace/API path and locks the rendered result.

## Structural verifier assumption

The verifier previously treated every empty trace as a malformed supported execution. It now recognizes a canonical unsupported result while still asserting zero nodes, relations, steps, and result.

## Rejection workspace honesty

The first integrated browser gate found that tabs still appeared beside a rejection. The UI was corrected; the full e2e suite then passed with tabs, playback, flow, trace, graph, and result absent.

## Concurrent shared-worktree edits

During final browser verification, unrelated module-program changes appeared in the shared worktree and caused `/decode` to return 500. Those changes are outside this bounded patch and were left untouched. Verification and review-bundle work continued from an isolated worktree pinned to candidate `e929828`, preventing accidental inclusion or deletion of the concurrent work.

## Clean-install root executable

The original working environment had a hoisted `tsx` executable, but a clean frozen workspace install did not. Root scripts invoke `pnpm exec tsx`, while the dependency was declared only in `packages/lens-contracts`. The dependency is now declared at the root and the full suite passes from the isolated clean install.

## Cross-platform pnpm executable

The strengthened Linux CI gate exposed two Python subprocess calls that invoked the Windows-only name `pnpm.cmd`. They now resolve `pnpm.cmd` or `pnpm` through `PATH` without a shell fallback. This changes no analysis or trace semantics.

No unresolved semantic conflict remains inside the bounded candidate.
