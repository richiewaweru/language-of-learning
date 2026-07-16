<script lang="ts">
  let { data } = $props();
</script>

<svelte:head>
  <title>{data.pathway.title} — Learn</title>
</svelte:head>

<main>
  <p class="eyebrow">Pathway</p>
  <h1>{data.pathway.title}</h1>
  <p class="lede">{data.pathway.summary}</p>

  <ol class="lessons">
    {#each data.lessons as lesson, i}
      <li>
        <a href="/learn/{data.pathway.slug}/{lesson.slug}">
          <span class="n">{i + 1}</span>
          {lesson.title}
        </a>
      </li>
    {/each}
  </ol>

  <p class="nav">
    <a href="/learn">← All pathways</a>
    ·
    <a href="/learn/{data.pathway.slug}/{data.lessons[0]?.slug}">Start lesson 1 →</a>
  </p>
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
    margin: 0.25rem 0;
  }
  .lede {
    color: var(--muted);
  }
  .lessons {
    padding-left: 0;
    list-style: none;
  }
  .lessons li {
    margin: 0.75rem 0;
  }
  .lessons a {
    display: flex;
    gap: 0.75rem;
    align-items: baseline;
    color: var(--data-blue);
    font: 600 1.05rem/1.3 var(--font-ui);
    text-decoration: none;
  }
  .n {
    font: 700 12px/1 var(--font-mono);
    color: var(--muted);
  }
  .nav {
    margin-top: 2rem;
  }
  a {
    color: var(--data-blue);
  }
</style>
