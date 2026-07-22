<script lang="ts">
  import PageContainer from '$lib/learner-ui/shell/PageContainer.svelte';
  import Breadcrumbs from '$lib/learner-ui/shell/Breadcrumbs.svelte';
  import { summarizePathwayProgress } from '$lib/product/lessonProgress';
  let { data } = $props();

  const moduleSlug = 'loops';

  function lessonHref(slug: string) {
    return `/learn/${data.pathway.slug}/${moduleSlug}/${slug}`;
  }

  const pathwayProgress = $derived(summarizePathwayProgress(data.lessons));
  const completedSlugs = $derived(new Set(pathwayProgress.completedSlugs));
  const currentLesson = $derived(data.lessons.find(
    (lesson: (typeof data.lessons)[number]) => lesson.slug === pathwayProgress.currentSlug,
  ));

  function lessonStatus(slug: string): 'complete' | 'current' | 'available' {
    if (completedSlugs.has(slug)) return 'complete';
    if (slug === pathwayProgress.currentSlug) return 'current';
    return 'available';
  }
</script>

<svelte:head>
  <title>{data.pathway.title} — Learn</title>
</svelte:head>

<PageContainer wide>
  <Breadcrumbs
    items={[
      { label: 'Learn', href: '/learn' },
      { label: data.pathway.title },
    ]}
  />

  <header class="pathway-header">
    <h1>{data.pathway.title}</h1>
    <p class="summary">{data.pathway.summary}</p>
    <div class="tags">
      <span class="pill-tag">Beginner</span>
      <span class="pill-tag">Visual</span>
      <span class="pill-tag">Practice</span>
    </div>
  </header>

  <div class="pathway-layout">
    <aside class="path-nav">
      <div class="nav-progress surface-card">
        <div class="nav-progress-row"><span>Overall progress</span><strong>{pathwayProgress.percent}%</strong></div>
        <div class="mini-progress"><span style:width={`${pathwayProgress.percent}%`}></span></div>
        <p>{pathwayProgress.completedLessons} of {pathwayProgress.totalLessons} lessons</p>
      </div>
      <nav aria-label="Learning navigation">
        <a href="/learn">⌂ <span>Overview</span></a>
        <a href="/learn/{data.pathway.slug}" class="active">◇ <span>Pathway</span></a>
        <a href="/library">▱ <span>Saved</span></a>
        <a href="/learn/{data.pathway.slug}#progress">▥ <span>Progress</span></a>
        <a href="/learn/{data.pathway.slug}#achievements">♢ <span>Achievements</span></a>
        <a href="/learn/{data.pathway.slug}#notes">□ <span>Notes</span></a>
      </nav>
    </aside>

    <section class="roadmap">
      <h2>Your path</h2>
      <ol class="lesson-list">
        {#each data.lessons as lesson, i}
          {@const status = lessonStatus(lesson.slug)}
          <li class={status}>
            <a href={lessonHref(lesson.slug)} class="lesson-row">
              <span class="icon">{status === 'complete' ? '✓' : '●'}</span>
              <span class="lesson-number">{i + 1}</span>
              <span class="meta">
                <span class="title">{lesson.title}</span>
                <span class="lesson-description">{lesson.objectives?.[0] ?? 'Build a visual mental model.'}</span>
                {#if status === 'current'}
                  <span class="badge">In progress</span>
                {/if}
              </span>
            </a>
          </li>
        {/each}
      </ol>
    </section>

    <aside class="sidebar">
      <div class="progress-card surface-card">
        <p class="label">Overall progress</p>
        <div class="ring" aria-label={`${pathwayProgress.percent} percent complete`}>
          {pathwayProgress.percent}%
        </div>
        <p class="sub">{pathwayProgress.completedLessons} of {pathwayProgress.totalLessons} lessons</p>
      </div>

      <div class="continue-card surface-card">
        {#if currentLesson}
          <p class="label">Current lesson</p>
          <h3>{currentLesson.title}</h3>
          {#if currentLesson.objectives?.length}
            <ul class="objectives">
              {#each currentLesson.objectives as objective}
                <li>{objective}</li>
              {/each}
            </ul>
          {/if}
          <a href={lessonHref(currentLesson.slug)} class="btn-primary full">Continue lesson</a>
        {:else}
          <p class="label">Pathway complete</p>
          <h3>You completed every lesson in this pathway.</h3>
        {/if}
      </div>
    </aside>
  </div>
</PageContainer>

<style>
  .pathway-header {
    margin: var(--space-5) 0 var(--space-7);
  }

  h1 {
    font-family: var(--font-display);
    font-size: var(--heading-xl);
    margin: 0 0 var(--space-3);
    color: var(--ink-primary);
  }

  .summary {
    color: var(--ink-secondary);
    max-width: 60ch;
    line-height: 1.55;
    margin: 0 0 var(--space-4);
  }

  .tags {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-2);
  }

  .tags .pill-tag {
    background: var(--surface-soft);
    color: var(--ink-secondary);
    border: 1px solid var(--line-soft);
  }

  .pathway-layout {
    display: grid;
    gap: var(--space-6);
  }

  @media (min-width: 900px) {
    .pathway-layout {
      grid-template-columns: 190px minmax(0, 1fr) 320px;
    }
  }

  .path-nav {
    display: none;
  }

  @media (min-width: 900px) {
    .path-nav { display: block; }
  }

  .nav-progress {
    padding: var(--space-4);
    margin-bottom: var(--space-4);
  }

  .nav-progress-row {
    display: flex;
    justify-content: space-between;
    color: var(--ink-secondary);
    font-size: var(--text-xs);
  }

  .mini-progress {
    height: 6px;
    margin: var(--space-3) 0;
    border-radius: var(--radius-pill);
    background: var(--line-soft);
    overflow: hidden;
  }

  .mini-progress span {
    display: block;
    height: 100%;
    background: var(--state-gold);
  }

  .nav-progress p {
    margin: 0;
    color: var(--ink-muted);
    font-size: var(--text-xs);
  }

  .path-nav nav {
    display: grid;
    gap: var(--space-1);
  }

  .path-nav nav a {
    display: flex;
    gap: var(--space-3);
    padding: var(--space-3);
    border-radius: var(--radius-sm);
    color: var(--ink-secondary);
    text-decoration: none;
    font-size: var(--text-sm);
  }

  .path-nav nav a.active {
    color: var(--brand-blue);
    background: var(--brand-blue-soft);
    font-weight: 600;
  }

  .roadmap h2 {
    font-size: var(--heading-md);
    margin: 0 0 var(--space-4);
    color: var(--ink-primary);
  }

  .lesson-list {
    list-style: none;
    padding: 0;
    margin: 0;
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
  }

  .lesson-row {
    display: flex;
    align-items: center;
    gap: var(--space-4);
    padding: var(--space-4) var(--space-5);
    border-radius: var(--radius-md);
    border: 1px solid var(--line-soft);
    background: var(--surface-primary);
    text-decoration: none;
    color: inherit;
  }

  .lesson-row:hover {
    border-color: var(--brand-blue);
    box-shadow: var(--shadow-sm);
  }

  li.current .lesson-row {
    border-color: var(--brand-blue);
    background: var(--brand-blue-soft);
  }

  li.complete .icon {
    color: var(--exit-green);
  }

  .meta {
    display: flex;
    flex-direction: column;
    gap: var(--space-1);
  }

  .lesson-number {
    color: var(--ink-muted);
    font-size: var(--text-xs);
    min-width: 18px;
  }

  .lesson-description {
    color: var(--ink-muted);
    font-size: var(--text-xs);
    max-width: 48ch;
  }

  .title {
    font-weight: 600;
    color: var(--ink-primary);
  }

  .badge {
    font-size: var(--text-xs);
    color: var(--brand-blue);
    font-weight: 600;
  }

  .sidebar {
    display: flex;
    flex-direction: column;
    gap: var(--space-4);
  }

  .progress-card,
  .continue-card {
    padding: var(--space-5);
  }

  .label {
    font-size: var(--text-xs);
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: var(--ink-muted);
    margin: 0 0 var(--space-3);
  }

  .ring {
    font-family: var(--font-display);
    font-size: var(--heading-xl);
    font-weight: 600;
    color: var(--state-gold);
    margin-bottom: var(--space-2);
  }

  .sub {
    margin: 0;
    font-size: var(--text-sm);
    color: var(--ink-muted);
  }

  .continue-card h3 {
    margin: 0 0 var(--space-4);
    font-size: var(--text-md);
    color: var(--ink-primary);
  }

  .objectives {
    padding: 0;
    margin: 0 0 var(--space-4);
    list-style: none;
    color: var(--ink-secondary);
    font-size: var(--text-xs);
  }

  .objectives li { margin-bottom: var(--space-2); }
  .objectives li::before { content: '✓'; color: var(--flow-teal); margin-right: var(--space-2); }

  .full {
    width: 100%;
    text-align: center;
  }

</style>
