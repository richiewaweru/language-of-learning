<script lang="ts">
  import type { LensSessionController } from '@lol/lens-contracts';
  import LensWorkspace from '$lib/lens/LensWorkspace.svelte';
  let { controller }: { controller: LensSessionController } = $props();
</script>

<aside class="lens-region" data-testid="lesson-lens-region">
  <header><p>Learning Lens</p><h2>Watch the program remember and reuse values</h2></header>
  <LensWorkspace {controller} />
</aside>

<style>
  .lens-region { min-width: 0; padding: 16px; border: 1px solid #a8c0b3; border-radius: 14px; background: #edf2ed; }
  header { margin-bottom: 14px; }
  header p { margin: 0; color: #4f6b5e; text-transform: uppercase; letter-spacing: .1em; font-size: var(--text-xs); }
  header h2 { margin: 5px 0 0; font-family: var(--font-display); font-size: 25px; }
</style>
