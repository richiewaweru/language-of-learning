<svelte:head>
  <title>Language of Learning</title>
</svelte:head>

<main>
  <p class="brand">Language of Learning</p>
  <p class="tagline">Structural Code Lens — v0.1 skeleton</p>
  <p class="link-row"><a href="/debug/graph">Open graph inspector</a></p>
</main>

<style>
  main {
    padding: 2rem;
    background: var(--paper);
    min-height: 100vh;
  }

  .brand {
    font-size: 2rem;
    font-weight: 700;
    color: var(--work-purple);
    margin: 0 0 0.5rem;
  }

  .tagline {
    color: var(--muted);
    margin: 0;
  }

  .link-row {
    margin-top: 1rem;
  }

  a {
    color: var(--data-blue);
  }
</style>
