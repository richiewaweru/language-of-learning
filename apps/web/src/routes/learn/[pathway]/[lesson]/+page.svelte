<script lang="ts">
  import LessonPlayer from '$lib/lesson-foundation/LessonPlayer.svelte';
  let { data } = $props();
</script>

<svelte:head>
  <title>{data.definition.title} — Lens</title>
</svelte:head>

<LessonPlayer definition={data.definition} />
