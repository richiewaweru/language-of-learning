<script lang="ts">
  import { onMount } from 'svelte';
  import {
    askLensChat,
    explainProgram,
    explainStep,
    getAIStatus,
    type AIStatus,
    type TeachingResponse,
  } from '$lib/api';

  let {
    source,
    argsRepr,
    stepIndex,
    lessonGoal = 'Understand the verified execution.',
  }: {
    source: string;
    argsRepr: string[];
    stepIndex: number;
    lessonGoal?: string;
  } = $props();

  let status = $state<AIStatus | null>(null);
  let response = $state<TeachingResponse | null>(null);
  let question = $state('');
  let loading = $state<'step' | 'program' | 'chat' | null>(null);
  let error = $state('');
  let contextNotice = $state('');
  let lastContext = $state('');

  const contextKey = $derived(`${source}\u0000${argsRepr.join('\u0000')}\u0000${stepIndex}`);
  const payload = $derived({ source, argsRepr, stepIndex, learnerLevel: 'beginner', lessonGoal });

  onMount(async () => {
    try {
      status = await getAIStatus();
    } catch {
      status = null;
    }
  });

  $effect(() => {
    const next = contextKey;
    if (lastContext && lastContext !== next && response) {
      response = null;
      contextNotice = 'The code or selected step changed. Ask again for an explanation of the current context.';
    }
    lastContext = next;
  });

  async function run(kind: 'step' | 'program' | 'chat') {
    loading = kind;
    error = '';
    contextNotice = '';
    try {
      if (kind === 'step') response = await explainStep(payload);
      if (kind === 'program') response = await explainProgram(payload);
      if (kind === 'chat') {
        const trimmed = question.trim();
        if (!trimmed) return;
        response = await askLensChat({ ...payload, question: trimmed });
      }
    } catch (err) {
      error = err instanceof Error ? err.message : 'Ask Lens could not respond.';
    } finally {
      loading = null;
    }
  }
</script>

<section class="ask-lens surface-card" aria-labelledby="ask-lens-title" data-testid="ask-lens">
  <header>
    <div>
      <p class="eyebrow">Grounded teaching help</p>
      <h2 id="ask-lens-title">Ask Lens</h2>
    </div>
    <span class="status" class:available={status?.enabled && status?.configured}>
      {#if status?.enabled && status?.configured}
        {status.provider === 'mock' ? 'Practice teacher' : 'AI available'}
      {:else}
        Deterministic help
      {/if}
    </span>
  </header>

  <p class="intro">Explanations use execution facts re-verified by the server.</p>
  <div class="actions">
    <button type="button" class="btn-secondary" onclick={() => run('step')} disabled={loading !== null}>
      {loading === 'step' ? 'Explaining…' : 'Explain this step'}
    </button>
    <button type="button" class="btn-secondary" onclick={() => run('program')} disabled={loading !== null}>
      {loading === 'program' ? 'Explaining…' : 'Explain the whole process'}
    </button>
  </div>
  <form onsubmit={(event) => { event.preventDefault(); run('chat'); }}>
    <label for="ask-lens-question">Ask about this execution</label>
    <div class="chat-row">
      <input id="ask-lens-question" bind:value={question} placeholder="Why did this value change?" maxlength="1200" />
      <button type="submit" class="btn-primary" disabled={loading !== null || !question.trim()}>
        {loading === 'chat' ? 'Asking…' : 'Ask'}
      </button>
    </div>
  </form>

  {#if contextNotice}<p class="notice" role="status">{contextNotice}</p>{/if}
  {#if error}
    <div class="error" role="alert">
      <p>{error}</p>
      <button type="button" class="btn-secondary" onclick={() => run(question.trim() ? 'chat' : 'step')}>Retry</button>
    </div>
  {/if}
  {#if response}
    <article class:unsupported={response.supportStatus === 'unsupported'} aria-live="polite" data-testid="ask-lens-response">
      <div class="attribution">
        {#if response.stepIndex !== null}<span>Step {response.stepIndex + 1}</span>{/if}
        {#if response.sourceLine !== null}<span>Line {response.sourceLine}</span>{/if}
        <span>{response.fallback ? 'Deterministic explanation' : 'AI explanation'}</span>
      </div>
      <h3>{response.summary}</h3>
      <p>{response.answer}</p>
      {#if response.vocabulary.length}
        <ul aria-label="Visual vocabulary">
          {#each response.vocabulary as word}<li>{word}</li>{/each}
        </ul>
      {/if}
    </article>
  {/if}
</section>

<style>
  .ask-lens { padding:var(--space-5); display:grid; gap:var(--space-3); min-width:0; }
  header { display:flex; justify-content:space-between; align-items:flex-start; gap:var(--space-3); }
  h2,h3,p { margin:0; }
  h2 { font-family:var(--font-display); font-size:var(--heading-md); }
  h3 { font-size:var(--text-sm); }
  .eyebrow { color:var(--work-purple); font-size:var(--text-xs); font-weight:700; text-transform:uppercase; letter-spacing:.06em; }
  .status { border:1px solid var(--line-medium); border-radius:999px; padding:.25rem .55rem; color:var(--ink-muted); font-size:var(--text-xs); white-space:nowrap; }
  .status.available { color:var(--exit-green); border-color:color-mix(in srgb,var(--exit-green) 45%,var(--line-soft)); }
  .intro,label { color:var(--ink-muted); font-size:var(--text-xs); }
  .actions,.chat-row { display:flex; gap:var(--space-2); flex-wrap:wrap; }
  form { display:grid; gap:.35rem; }
  input { min-width:0; flex:1; padding:.7rem; border:1px solid var(--line-medium); border-radius:var(--radius-sm); font:inherit; }
  article { border:1px solid color-mix(in srgb,var(--work-purple) 35%,var(--line-soft)); border-radius:var(--radius-sm); padding:var(--space-4); display:grid; gap:var(--space-2); background:color-mix(in srgb,var(--work-purple) 4%,var(--surface-primary)); }
  article.unsupported,.error { border-color:color-mix(in srgb,var(--alert-orange) 45%,var(--line-soft)); background:color-mix(in srgb,var(--alert-orange) 6%,var(--surface-primary)); }
  .attribution,ul { display:flex; flex-wrap:wrap; gap:.4rem; margin:0; padding:0; list-style:none; }
  .attribution span,li { font-size:10px; padding:.2rem .4rem; border-radius:999px; background:var(--surface-soft); color:var(--ink-muted); }
  article p { color:var(--ink-secondary); line-height:1.55; font-size:var(--text-sm); }
  .notice { color:var(--ink-muted); font-size:var(--text-xs); }
  .error { padding:var(--space-3); border:1px solid; border-radius:var(--radius-sm); display:flex; justify-content:space-between; gap:var(--space-3); align-items:center; }
  @media(max-width:560px) { header,.actions,.chat-row { flex-direction:column; } .actions button,.chat-row button,.chat-row input { width:100%; box-sizing:border-box; } }
</style>
