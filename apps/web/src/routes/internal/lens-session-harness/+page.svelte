<script lang="ts">
  import { browser } from '$app/environment';
  import { onMount } from 'svelte';
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

  const leftSession = createLensSession({
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
  const rightSession = createLensSession({
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
  const left = leftSession.controller;
  const right = rightSession.controller;
  let sessionsReady = $state(false);

  onMount(() => {
    void (async () => {
      await Promise.all([left.actions.hydrate(), right.actions.hydrate()]);
      const leftFrame = left.state.selection.stepIndex ?? 0;
      const rightFrame = right.state.selection.stepIndex ?? 0;
      await Promise.all([left.actions.run(), right.actions.run()]);
      left.actions.setCurrentFrame(leftFrame);
      right.actions.setCurrentFrame(rightFrame);
      sessionsReady = true;
    })();
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

  <section class="harness-workspace" data-testid="workspace-a" data-session-initialized={left.state.initialized} data-sessions-ready={sessionsReady}>
    <h2>Editable session A</h2>
    <code data-testid="persistence-key">{left.persistenceKey}</code>
    <LensWorkspace controller={left} />
  </section>

  <section class="harness-workspace" data-testid="workspace-b" data-session-initialized={right.state.initialized} data-sessions-ready={sessionsReady}>
    <h2>Restricted session B</h2>
    <code data-testid="persistence-key">{right.persistenceKey}</code>
    <button
      type="button"
      class="owner-load"
      data-testid="owner-load-program"
      onclick={() => rightSession.ownerActions.loadProgramFromOwner({
        id: 'owner-program',
        language: 'python',
        source: 'owner_loaded = 42',
        argsText: '',
      })}
    >Load from owner controller</button>
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
  .owner-load { justify-self: start; }
</style>
