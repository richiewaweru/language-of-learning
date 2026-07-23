<script lang="ts">
  import LessonRenderer from '$lib/pilot/LessonRenderer.svelte';
  let { data } = $props();
</script>

<svelte:head>
  <title>{data.lesson.title} — Lens</title>
</svelte:head>

<LessonRenderer {data} />
