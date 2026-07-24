<script lang="ts">
  import PageContainer from '$lib/learner-ui/shell/PageContainer.svelte';
  import LessonWorkspace from '$lib/learner-ui/lesson/LessonWorkspace.svelte';
  import ComparisonPanel from '$lib/product/ComparisonPanel.svelte';
  import { markSectionComplete } from '$lib/product/lessonProgress';

  let { data } = $props();
  let predictionFeedback = $state('');

  const progressPercent = $derived(
    Math.round(((data.lessonIndex - 1) / data.lessonCount) * 100 + 15),
  );

  const breadcrumbs = $derived([
    { label: 'Learn', href: '/learn' },
    { label: data.pathway.title, href: `/learn/${data.pathway.slug}` },
    { label: data.module.title, href: `/learn/${data.pathway.slug}/${data.moduleSlug}` },
    { label: data.lesson.title },
  ]);

  const patternSummary = $derived(
    data.lesson.slug === 'accumulate'
      ? {
          pattern: 'Accumulate',
          description:
            'Use a loop to go through a collection and build up a single result using an operation (like addition).',
          whenToUse: 'When you need a single value that combines many values.',
          examples: ['Checkout totals', 'Scores & points', 'Running totals', 'Data aggregation'],
          related: ['Count', 'Filter', 'Transform'],
        }
      : undefined,
  );

  const subtitle = $derived(
    data.lesson.slug === 'accumulate'
      ? 'See how a loop repeats, adds each value, and builds a total step by step.'
      : data.lesson.objectives?.[0] ?? '',
  );
</script>

<svelte:head>
  <title>{data.lesson.title} — {data.pathway.title}</title>
</svelte:head>

<PageContainer wide>
  {#if data.flagshipPack}
    <LessonWorkspace
      pack={data.flagshipPack}
      {breadcrumbs}
      title={data.lesson.slug === 'accumulate' ? 'Build a Total with a Loop' : data.lesson.title}
      {subtitle}
      explainSteps={data.patternSteps}
      {patternSummary}
      {progressPercent}
      initialStep={Math.max(
        0,
        data.flagshipPack.trace.steps
          .map((step, index) => ({ type: step.event.type, index }))
          .filter((step) => step.type === 'state_change')
          .at(-2)?.index ?? 0,
      )}
      prediction={data.predictionBlock
        ? {
            prompt: data.predictionBlock.prompt,
            options: data.predictionBlock.options,
            correctId: data.predictionBlock.correctId,
            feedback: predictionFeedback,
            onAnswer: (_, correct) => {
              predictionFeedback = correct
                ? 'Correct — that matches what the trace shows at this step.'
                : 'Not quite — step through the execution to see the actual update.';
              markSectionComplete(data.lesson.slug, 'prediction');
            },
          }
        : undefined}
    />
  {/if}

  {#if data.lesson.slug !== 'accumulate'}
    {#each data.lesson.blocks as block}
      {#if block.type === 'comparison'}
        <ComparisonPanel
          currentPattern={data.lesson.slug.toUpperCase()}
          neighborPattern={block.neighborPattern}
          rows={block.rows}
        />
      {/if}
    {/each}
  {/if}

  <details class="more-lesson">
    <summary>More lesson activities</summary>
    <p class="hint">Variations, transfer checks, and comparisons remain available below the workspace.</p>
    <a
      href="/learn/{data.pathway.slug}/{data.lesson.slug}"
      class="btn-secondary"
    >
      Open full lesson anatomy
    </a>
  </details>

  <nav class="lesson-nav">
    {#if data.prevSlug}
      <a
        href="/learn/{data.pathway.slug}/{data.moduleSlug}/{data.prevSlug}"
        class="btn-secondary"
      >
        ← Previous
      </a>
    {/if}
    {#if data.nextSlug}
      <a
        href="/learn/{data.pathway.slug}/{data.moduleSlug}/{data.nextSlug}"
        class="btn-primary"
      >
        Next lesson →
      </a>
    {/if}
  </nav>
</PageContainer>

<style>
  .more-lesson {
    margin-top: var(--space-6);
    font-size: var(--text-sm);
    color: var(--ink-muted);
  }

  .hint {
    margin: var(--space-2) 0 var(--space-3);
  }

  .lesson-nav {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-3);
    margin-top: var(--space-6);
    padding-top: var(--space-5);
    border-top: 1px solid var(--line-soft);
  }
</style>
