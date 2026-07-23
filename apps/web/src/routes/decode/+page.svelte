<script lang="ts">
  import DecodeController from '$lib/lens/DecodeController.svelte';

  let { data } = $props();
</script>

<svelte:head>
  <title>Decode — Language of Learning</title>
</svelte:head>

<DecodeController pack={data.pack} />
