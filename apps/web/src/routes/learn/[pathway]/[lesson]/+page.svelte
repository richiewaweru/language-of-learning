<script lang="ts">
  import LessonRenderer from '$lib/pilot/LessonRenderer.svelte';
  import LessonPlayer from '$lib/lesson-foundation/LessonPlayer.svelte';
  let { data } = $props();
</script>

<svelte:head>
  <title>{data.lesson.title} — Lens</title>
</svelte:head>

{#if data.renderer === 'phase2'}
  <LessonPlayer definition={data.definition} />
{:else}
  <LessonRenderer {data} />
{/if}
