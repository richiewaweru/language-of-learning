<svelte:options runes={false} />

<script lang="ts">
  export let data;

  let selected = data.fixtures[0].name;
  $: current = data.fixtures.find((fixture) => fixture.name === selected) ?? data.fixtures[0];
</script>

<svelte:head>
  <title>Graph Inspector</title>
</svelte:head>

<main class="page">
  <header class="header">
    <div>
      <p class="eyebrow">Debug</p>
      <h1>Graph Inspector</h1>
      <p class="summary">Fixture-backed analyzer graphs for Phase P1 verification.</p>
    </div>
    <label class="picker">
      <span>Fixture</span>
      <select bind:value={selected}>
        {#each data.fixtures as fixture}
          <option value={fixture.name}>{fixture.name}</option>
        {/each}
      </select>
    </label>
  </header>

  <section class="grid">
    <article class="panel">
      <h2>Source</h2>
      <pre>{current.source}</pre>
    </article>

    <article class="panel">
      <h2>Graph JSON</h2>
      <pre>{current.graph}</pre>
    </article>
  </section>
</main>

<style>
  .page {
    min-height: 100vh;
    padding: 2rem;
    background: var(--bg);
    color: var(--ink);
  }

  .header {
    display: flex;
    justify-content: space-between;
    gap: 1rem;
    align-items: end;
    margin-bottom: 1.5rem;
  }

  .eyebrow {
    margin: 0 0 0.25rem;
    color: var(--muted);
    font: var(--eyebrow);
  }

  h1,
  h2,
  .summary {
    margin: 0;
  }

  .summary {
    margin-top: 0.5rem;
    color: var(--muted);
  }

  .picker {
    display: grid;
    gap: 0.5rem;
    min-width: 12rem;
  }

  select {
    border: var(--border-w) solid var(--ink);
    background: var(--paper);
    padding: 0.5rem 0.75rem;
    font: inherit;
  }

  .grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 1rem;
  }

  .panel {
    background: var(--paper);
    border: var(--border-w) solid var(--ink);
    box-shadow: var(--shadow-panel);
    padding: 1rem;
  }

  pre {
    overflow: auto;
    white-space: pre-wrap;
    word-break: break-word;
    font-family: var(--font-mono);
    margin: 1rem 0 0;
  }

  @media (max-width: 900px) {
    .header,
    .grid {
      grid-template-columns: 1fr;
      display: grid;
    }
  }
</style>
