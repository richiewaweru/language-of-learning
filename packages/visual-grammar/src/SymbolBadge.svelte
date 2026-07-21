<script lang="ts">
  import { resolveSymbol, symbolIdForSemantic } from './symbol-registry.js';

  let {
    semantic,
    label,
    state = 'idle',
    behaviorVerified = true,
  }: {
    semantic: string;
    label?: string;
    state?: 'idle' | 'active' | 'selected' | 'changing' | 'completed' | 'unsupported';
    behaviorVerified?: boolean;
  } = $props();

  const resolution = $derived(
    resolveSymbol(symbolIdForSemantic(semantic), { behaviorVerified }),
  );
</script>

<span
  class="symbol-badge"
  class:active={state === 'active' || state === 'selected'}
  class:changing={state === 'changing'}
  class:completed={state === 'completed'}
  data-family={resolution.definition.metadata.family}
  data-resolution={resolution.kind}
  title={resolution.definition.metadata.id}
>
  <span class="mark" aria-hidden="true">
    {resolution.resolvedId === 'cursor' ? '▼' :
      resolution.resolvedId === 'comparison' ? '≶' :
      resolution.resolvedId === 'mutation' ? '→' :
      resolution.resolvedId === 'range' ? '[ ]' :
      resolution.resolvedId === 'return' ? '↦' :
      resolution.resolvedId === 'loop' ? '↻' :
      resolution.resolvedId === 'unsupported' ? '?' : '•'}
  </span>
  <span>{label ?? resolution.definition.metadata.id.replaceAll('-', ' ')}</span>
</span>

<style>
  .symbol-badge {
    --symbol-color: var(--data-blue);
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    width: fit-content;
    padding: 0.22rem 0.48rem;
    border: 1px solid color-mix(in srgb, var(--symbol-color) 55%, var(--line-soft));
    border-radius: var(--radius-pill);
    color: var(--symbol-color);
    background: color-mix(in srgb, var(--symbol-color) 8%, var(--surface-primary));
    font-size: var(--text-xs);
    text-transform: capitalize;
    white-space: nowrap;
  }
  .symbol-badge[data-family='state'] { --symbol-color: var(--state-gold); }
  .symbol-badge[data-family='flow'] { --symbol-color: var(--flow-teal); }
  .symbol-badge[data-family='decision'] { --symbol-color: var(--branch-magenta); }
  .symbol-badge[data-family='work'] { --symbol-color: var(--work-purple); }
  .symbol-badge[data-family='exit'] { --symbol-color: var(--exit-green); }
  .symbol-badge[data-family='effect'] { --symbol-color: var(--effect-amber); }
  .symbol-badge[data-family='limit'] { --symbol-color: var(--alert-orange); border-style: dashed; }
  .symbol-badge.active { box-shadow: 0 0 0 2px color-mix(in srgb, var(--symbol-color) 18%, transparent); }
  .symbol-badge.changing { font-weight: 700; }
  .symbol-badge.completed { opacity: 0.82; }
  .mark { font-family: var(--font-mono); font-weight: 700; }
</style>
