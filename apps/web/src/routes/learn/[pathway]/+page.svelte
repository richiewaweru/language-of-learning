<script lang="ts">
  import { onMount } from 'svelte';
  import PageContainer from '$lib/learner-ui/shell/PageContainer.svelte';
  import Breadcrumbs from '$lib/learner-ui/shell/Breadcrumbs.svelte';
  import { emptyProgress, loadPilotProgress } from '$lib/pilot/progress';

  let { data } = $props();
  let progress = $state(emptyProgress());
  onMount(() => (progress = loadPilotProgress()));
</script>

<svelte:head>
  <title>{data.pathway.title} — Lens</title>
</svelte:head>

<PageContainer wide>
  <Breadcrumbs items={[{ label: 'Learn', href: '/learn' }, { label: data.pathway.title }]} />
  <header class="pathway-header">
    <p class="eyebrow">Four-lesson pilot</p>
    <h1>{data.pathway.title}</h1>
    <p>{data.pathway.summary}</p>
  </header>
  <ol class="lesson-grid" data-testid="pilot-lesson-index">
    {#each data.lessons as lesson}
      <li>
        <a href="/learn/python-foundations/{lesson.id}">
          <span class="number">0{lesson.order}</span>
          <div>
            <h2>{lesson.title}</h2>
            <p>{lesson.summary}</p>
            <small>{progress.completedLessonIds.includes(lesson.id) ? 'Completed' : '9 learning steps'}</small>
          </div>
        </a>
      </li>
    {/each}
  </ol>
</PageContainer>

<style>
  .pathway-header { max-width: 720px; padding: 54px 0 32px; }
  .pathway-header h1 { margin: 8px 0; font-family: var(--font-display); font-size: clamp(42px, 7vw, 78px); line-height: .95; }
  .pathway-header > p:last-child { color: var(--ink-secondary); font-size: 18px; }
  .lesson-grid { list-style: none; padding: 0 0 80px; margin: 0; display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px; }
  .lesson-grid a { display: grid; grid-template-columns: 54px 1fr; gap: 16px; min-height: 150px; padding: 26px; border: 1px solid var(--line-soft); border-radius: 14px; background: var(--surface-card); text-decoration: none; color: inherit; }
  .lesson-grid a:hover { border-color: #6d9380; transform: translateY(-2px); }
  .number { color: #b75d32; font-family: var(--font-display); font-size: 22px; }
  h2 { margin: 0 0 8px; font-family: var(--font-display); font-size: 27px; }
  .lesson-grid p { color: var(--ink-secondary); }
  small { color: #32644f; font-weight: 700; }
  @media (max-width: 700px) { .lesson-grid { grid-template-columns: 1fr; } }
</style>
