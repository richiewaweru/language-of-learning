<script lang="ts">
  import PatternFamilyMap from '$lib/product/PatternFamilyMap.svelte';
  import { loadProgress } from '$lib/product/lessonProgress';

  let { data } = $props();

  function lessonProgress(slug: string): string {
    if (typeof localStorage === 'undefined') return '';
    const p = loadProgress(slug);
    return p.completedSections.length > 0 ? `${p.completedSections.length} sections started` : '';
  }
</script>

<svelte:head>
  <title>{data.pathway.title} — Learn</title>
</svelte:head>

<article class="pathway-page container">
  <p class="eyebrow">Pathway</p>
  <h1>{data.pathway.title}</h1>
  <p class="lede">{data.pathway.summary}</p>
  <p class="promise">Learn four structures that explain many beginner Python loops.</p>

  <PatternFamilyMap />

  <ol class="lessons">
    {#each data.lessons as lesson, i}
      <li>
        <a href="/learn/{data.pathway.slug}/{lesson.slug}">
          <span class="n">{i + 1}</span>
          <span class="meta">
            <span class="title">{lesson.title}</span>
            {#if lesson.difficulty}
              <span class="diff">{lesson.difficulty}</span>
            {/if}
          </span>
        </a>
      </li>
    {/each}
  </ol>

  <p class="continue">
    <a href="/learn/{data.pathway.slug}/{data.lessons[0]?.slug}" class="btn-primary">
      {data.lessons[0] ? 'Start pathway' : 'Back'}
    </a>
  </p>
</article>

<style>
  .pathway-page {
    padding: var(--space-8) var(--space-6) var(--space-10);
  }

  h1 {
    font-family: var(--font-display);
    font-size: var(--text-2xl);
    margin: var(--space-2) 0 var(--space-3);
  }

  .lede, .promise {
    color: var(--ink-muted);
    max-width: 55ch;
  }

  .lessons {
    padding: 0;
    list-style: none;
    margin: var(--space-8) 0;
  }

  .lessons li {
    margin: var(--space-3) 0;
  }

  .lessons a {
    display: flex;
    gap: var(--space-4);
    align-items: baseline;
    text-decoration: none;
    color: var(--ink-strong);
    padding: var(--space-4);
    border: 1px solid var(--line-soft);
    border-radius: var(--radius-sm);
    background: var(--surface-paper);
  }

  .lessons a:hover {
    border-color: var(--ink-strong);
  }

  .n {
    font: 700 12px/1 var(--font-mono);
    color: var(--ink-faint);
  }

  .meta {
    display: flex;
    flex-direction: column;
    gap: var(--space-1);
  }

  .title {
    font-weight: 600;
  }

  .diff {
    font-size: var(--text-xs);
    color: var(--ink-muted);
  }

  .continue {
    margin-top: var(--space-6);
  }
</style>
