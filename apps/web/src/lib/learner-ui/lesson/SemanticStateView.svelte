<script lang="ts">
  import type { SemanticScene } from '@lol/lens-contracts';
  import { SymbolBadge } from '@lol/visual-grammar';

  let {
    semanticScene,
    stepIndex,
  }: {
    semanticScene: SemanticScene;
    stepIndex: number;
  } = $props();

  const step = $derived(semanticScene.steps[stepIndex] ?? semanticScene.steps[0]);
  const rows = $derived(
    (step?.snapshots ?? [])
      .map((snapshot) => ({
        snapshot,
        entity: semanticScene.entities.find((entity) => entity.id === snapshot.entityId),
      }))
      .filter(({ entity, snapshot }) =>
        Boolean(
          entity &&
            ['binding', 'collection', 'state', 'cursor', 'reference', 'result'].includes(entity.role) &&
            (snapshot.value !== undefined || snapshot.previousValue !== undefined),
        ),
      ),
  );
  function groupFrames(items: typeof rows): Map<string, typeof rows> {
    const groups = new Map<string, typeof rows>();
    for (const item of items) {
      const frameId = String(item.snapshot.properties?.frameId ?? 'frame-root');
      groups.set(frameId, [...(groups.get(frameId) ?? []), item]);
    }
    return groups;
  }
  const frameGroups = $derived(groupFrames(rows));
</script>

<div class="state-view" data-testid="semantic-state-view">
  {#each [...frameGroups.entries()] as [frameId, frameRows]}
    <section class="frame-group">
      <header>
        <SymbolBadge
          semantic="call-frame"
          label={frameId === 'frame:module' ? 'Program variables' : frameId === 'frame-root' ? 'Current frame' : 'Function variables'}
        />
      </header>
      <div class="table-wrap">
        <table>
          <thead>
            <tr><th>Role</th><th>Name</th><th>Current value</th><th>Previous value</th><th>Change/status</th></tr>
          </thead>
          <tbody>
            {#each frameRows as { entity, snapshot }}
              {#if entity}
                <tr
                  class:changed={snapshot.status === 'changing'}
                  data-entity-label={entity.label ?? entity.id}
                  data-testid={`state-binding-${entity.label ?? entity.id}`}
                >
                  <td><SymbolBadge semantic={entity.role} label={entity.role} state={snapshot.status} /></td>
                  <th scope="row">{entity.label ?? entity.id}</th>
                  <td data-testid="state-current-value"><code>{snapshot.value === undefined ? '—' : String(snapshot.value)}</code></td>
                  <td data-testid="state-previous-value"><code>{snapshot.previousValue === undefined ? '—' : String(snapshot.previousValue)}</code></td>
                  <td>
                    <span class="status">{snapshot.status}</span>
                    {#if snapshot.properties?.objectId}
                      <span class="identity" title="Shared object identity">id: {String(snapshot.properties.objectId)}</span>
                    {/if}
                  </td>
                </tr>
              {/if}
            {/each}
          </tbody>
        </table>
      </div>
      <details>
        <summary>Value history</summary>
        <ol>
          {#each semanticScene.steps.slice(0, stepIndex + 1) as historyStep}
            <li>Step {historyStep.index + 1}: {historyStep.activeEvent.type}</li>
          {/each}
        </ol>
      </details>
    </section>
  {/each}
</div>

<style>
  .state-view { padding:var(--space-4); display:grid; gap:var(--space-4); }
  .frame-group { border:1px solid color-mix(in srgb,var(--work-purple) 30%,var(--line-soft)); border-radius:var(--radius-sm); overflow:hidden; }
  header { padding:var(--space-3); background:color-mix(in srgb,var(--work-purple) 5%,var(--surface-primary)); }
  .table-wrap { overflow-x:auto; }
  table { width:100%; border-collapse:collapse; font-size:var(--text-xs); }
  th,td { padding:var(--space-2) var(--space-3); text-align:left; border-top:1px solid var(--line-soft); vertical-align:middle; }
  thead th { color:var(--ink-muted); font-weight:600; white-space:nowrap; }
  tbody th { font-weight:600; }
  tr.changed { background:color-mix(in srgb,var(--state-gold) 10%,var(--surface-primary)); }
  code { font-family:var(--font-mono); white-space:pre-wrap; overflow-wrap:anywhere; }
  .status { display:block; text-transform:capitalize; }
  .identity { display:block; margin-top:.2rem; color:var(--work-purple); font-family:var(--font-mono); font-size:10px; }
  details { padding:var(--space-3); border-top:1px solid var(--line-soft); color:var(--ink-muted); font-size:var(--text-xs); }
  details ol { margin:.5rem 0 0; padding-left:1.25rem; }
  @media(max-width:720px) {
    .state-view { padding:var(--space-3); }
    th,td { padding:.45rem; }
    thead th:nth-child(4), tbody td:nth-child(4) { display:none; }
  }
</style>
