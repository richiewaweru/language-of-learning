<script lang="ts">
  import { ScenePlayer } from '@lol/visual-grammar';
  import '@lol/visual-grammar/styles.css';

  let { data } = $props();
  let variantId = $state('canonical');
  let paste = $state('');
  let pasteMessage = $state('');
  let forceReduced = $state(false);
  let hydrated = $state(false);

  $effect(() => {
    if (!hydrated && data.variants[0]) {
      variantId = data.variants[0].id;
      paste = data.variants[0].source;
      hydrated = true;
    }
  });

  const variant = $derived(
    data.variants.find((v) => v.id === variantId) ?? data.variants[0],
  );

  function selectVariant(id: string) {
    variantId = id;
    const v = data.variants.find((x) => x.id === id);
    if (v) {
      paste = v.source;
      pasteMessage = '';
    }
  }

  function applyPaste() {
    const match = data.variants.find((v) => v.source.trim() === paste.trim());
    if (match) {
      variantId = match.id;
      pasteMessage = `Matched variation “${match.label}”.`;
      return;
    }
    pasteMessage =
      'Pasted source is not a known ACCUMULATE variation in this slice. Known variations are listed above — live analyze lands in P5.';
  }
</script>

<svelte:head>
  <title>Accumulate slice — Language of Learning</title>
</svelte:head>

<main>
  <p class="eyebrow">Slice · ACCUMULATE</p>
  <h1>Accumulator</h1>
  <p class="lede">
    Interactive scene for the accumulate pattern. Step forward and back; bindings restore exactly
    from the trace snapshot (T1).
  </p>

  <div class="row">
    <label>
      Variation
      <select bind:value={variantId} onchange={() => selectVariant(variantId)}>
        {#each data.variants as v}
          <option value={v.id}>{v.label}</option>
        {/each}
      </select>
    </label>
    <label class="check">
      <input type="checkbox" bind:checked={forceReduced} />
      Force reduced motion
    </label>
  </div>

  <label class="paste">
    Paste a known variation source
    <textarea rows="6" bind:value={paste}></textarea>
  </label>
  <button type="button" class="btn" onclick={applyPaste}>Use pasted source</button>
  {#if pasteMessage}
    <p class="msg" data-testid="paste-message">{pasteMessage}</p>
  {/if}

  {#if variant}
    <p class="call">call args: {variant.argsRepr.join(', ')}</p>
    {#key variant.id}
      <ScenePlayer
        scene={variant.scene}
        graph={variant.graph}
        trace={variant.trace}
        width={Math.max(...variant.scene.layout.map((n) => n.x + n.width)) + 28}
        height={Math.max(...variant.scene.layout.map((n) => n.y + n.height)) + 28}
        reducedMotion={forceReduced}
      />
    {/key}
  {/if}

  <p class="nav"><a href="/slices/filter">Filter slice →</a> · <a href="/">Home</a></p>
</main>

<style>
  main {
    padding: 1.5rem;
    max-width: 960px;
    margin: 0 auto;
    background: var(--paper);
    min-height: 100vh;
  }
  .eyebrow {
    font: var(--eyebrow);
    letter-spacing: 0.15em;
    text-transform: uppercase;
    color: var(--muted);
    margin: 0;
  }
  h1 {
    color: var(--work-purple);
    margin: 0.25rem 0 0.5rem;
  }
  .lede {
    color: var(--muted);
  }
  .row {
    display: flex;
    gap: 1rem;
    flex-wrap: wrap;
    align-items: end;
    margin: 1rem 0;
  }
  select,
  textarea {
    display: block;
    width: 100%;
    margin-top: 0.25rem;
    font: 13px/1.4 var(--font-mono);
    border: var(--border-w) solid var(--ink);
    background: var(--paper);
    padding: 0.5rem;
  }
  .paste {
    display: block;
    width: 100%;
    margin: 0.75rem 0;
  }
  .btn {
    font: 700 12px/1 var(--font-mono);
    text-transform: uppercase;
    letter-spacing: 0.08em;
    padding: 0.55rem 0.75rem;
    border: var(--border-w) solid var(--ink);
    background: var(--paper);
    box-shadow: var(--shadow-btn);
    cursor: pointer;
  }
  .msg {
    color: var(--alert-orange);
  }
  .call {
    font: 12px/1.4 var(--font-mono);
    color: var(--muted);
  }
  .check {
    display: flex;
    gap: 0.4rem;
    align-items: center;
    font: 13px/1.2 var(--font-ui);
  }
  .nav {
    margin-top: 1.5rem;
  }
  a {
    color: var(--data-blue);
  }
</style>
