<script lang="ts">
  let { data } = $props();
</script>

<svelte:head>
  <title>Learn — Language of Learning</title>
</svelte:head>

<main>
  <p class="eyebrow">Learn</p>
  <h1>Pathways</h1>
  <ul>
    {#each data.pathways as p}
      <li>
        <a href="/learn/{p.slug}">{p.title}</a>
        <p>{p.summary}</p>
      </li>
    {/each}
  </ul>
  <p class="nav"><a href="/">Home</a> · <a href="/decode">Decode</a></p>
</main>

<style>
  main {
    max-width: 720px;
    margin: 0 auto;
    padding: 1.5rem;
    background: var(--paper);
    min-height: 100vh;
  }
  .eyebrow {
    font: var(--eyebrow);
    letter-spacing: 0.15em;
    text-transform: uppercase;
    color: var(--muted);
  }
  h1 {
    color: var(--work-purple);
  }
  li {
    margin: 1rem 0;
  }
  a {
    color: var(--data-blue);
  }
</style>
