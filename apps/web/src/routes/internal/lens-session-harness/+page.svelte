<script lang="ts">
  import { browser } from '$app/environment';
  import type { LensCapabilities } from '@lol/lens-contracts';
  import LensWorkspace from '$lib/lens/LensWorkspace.svelte';
  import { createLensEngine } from '$lib/lens/engine';
  import { createLensSession } from '$lib/lens/session.svelte';
  import {
    createBrowserLensPersistence,
    lensSessionStorageKey,
    noOpLensPersistence,
  } from '$lib/lens/storage';

  const engine = createLensEngine();
  const persistence = browser
    ? createBrowserLensPersistence(window.localStorage)
    : noOpLensPersistence;

  const editableCapabilities: LensCapabilities = {
    canEditSource: true,
    canPasteSource: true,
    canReplaceProgram: true,
    canRun: true,
    canReset: true,
    canUseFreeformInput: true,
    enabledViews: ['flow', 'state', 'explain', 'structure'],
  };
  const restrictedCapabilities: LensCapabilities = {
    canEditSource: false,
    canPasteSource: false,
    canReplaceProgram: false,
    canRun: true,
    canReset: true,
    canUseFreeformInput: false,
    enabledViews: ['flow', 'state'],
  };

  const left = createLensSession({
    id: 'harness-a',
    kind: 'harness',
    source: 'first = 1\nsecond = first + 1',
    argsText: '',
    artifacts: null,
    engine,
    capabilities: editableCapabilities,
    persistence,
    persistenceKey: lensSessionStorageKey({
      kind: 'harness',
      ownerId: 'isolation',
      sessionId: 'a',
    }),
  });
  const right = createLensSession({
    id: 'harness-b',
    kind: 'harness',
    source: 'first = 99\nsecond = first + 1',
    argsText: '',
    artifacts: null,
    engine,
    capabilities: restrictedCapabilities,
    persistence,
    persistenceKey: lensSessionStorageKey({
      kind: 'harness',
      ownerId: 'isolation',
      sessionId: 'b',
    }),
  });
</script>

<svelte:head>
  <title>Lens session isolation harness</title>
</svelte:head>

<main>
  <header>
    <p class="eyebrow">Development harness</p>
    <h1>Independent Lens sessions</h1>
    <p>Each workspace owns its code, artifacts, controls, selection, and persistence namespace.</p>
  </header>

  <section class="harness-workspace" data-testid="workspace-a">
    <h2>Editable session A</h2>
    <code data-testid="persistence-key">{left.persistenceKey}</code>
    <LensWorkspace controller={left} />
  </section>

  <section class="harness-workspace" data-testid="workspace-b">
    <h2>Restricted session B</h2>
    <code data-testid="persistence-key">{right.persistenceKey}</code>
    <LensWorkspace controller={right} />
  </section>
</main>

<style>
  main { max-width: 1500px; margin: 0 auto; padding: var(--space-6); display: grid; gap: var(--space-8); }
  header { max-width: 70ch; }
  header h1, header p { margin: 0 0 var(--space-2); }
  .eyebrow { text-transform: uppercase; letter-spacing: 0.08em; color: var(--ink-muted); font-size: var(--text-xs); }
  .harness-workspace { display: grid; gap: var(--space-3); border-top: 2px solid var(--line-default); padding-top: var(--space-4); }
  .harness-workspace h2 { margin: 0; }
  code { color: var(--ink-muted); font-size: var(--text-xs); }
</style>
