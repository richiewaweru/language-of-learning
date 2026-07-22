<script lang="ts">
  import LearningInstrument from '$lib/product/LearningInstrument.svelte';
  import StaticSceneFallback from '$lib/product/StaticSceneFallback.svelte';
  import PredictionPrompt from '$lib/product/PredictionPrompt.svelte';
  import ComparisonPanel from '$lib/product/ComparisonPanel.svelte';
  import PatternSummary from '$lib/product/PatternSummary.svelte';
  import { markSectionComplete, loadProgress } from '$lib/product/lessonProgress';
  import type { DemoPack } from '$lib/product/loadDemoPack';
  import type { VariationPack } from '$lib/product/loadVariationPack';
  import { normalizeSemanticScene } from '@lol/lens-scenes';

  let { data } = $props();
  function initialProgress() {
    return loadProgress(data.lesson.slug);
  }

  let progress = $state(initialProgress());
  let predictionFeedback = $state<Record<string, string>>({});
  let transferAnswers = $state<Record<string, string>>({});
  let transferFeedback = $state<Record<string, string>>({});

  function sceneForId(sceneId: string) {
    return data.sceneBlocks.find((s) => s.sceneId === sceneId);
  }

  function packFromExecution(sceneId: string): DemoPack | undefined {
    const existing = data.executionPacks[sceneId];
    if (existing) return existing;
    const loaded = data.sceneBlocks.find((entry) => entry.sceneId === sceneId);
    if (!loaded) return undefined;
    return {
      id: sceneId,
      title: data.lesson.title,
      source: loaded.example.source,
      argsRepr: loaded.example.argsRepr,
      graph: loaded.example.graph,
      trace: loaded.example.trace,
      scene: loaded.scene,
      semanticScene: normalizeSemanticScene(loaded.example.graph, loaded.example.trace, {
        sceneId: 'semantic-' + sceneId,
      }),
    };
  }

  function packFromVariation(vid: string): VariationPack | undefined {
    return data.variationPacks[vid];
  }

  function onPrediction(blockIndex: number, correct: boolean) {
    predictionFeedback[blockIndex] = correct
      ? 'Correct — that matches what the trace shows at this step.'
      : 'Not quite — step through the execution to see the actual update.';
    progress = markSectionComplete(data.lesson.slug, `prediction-${blockIndex}`);
  }

  function gradeTransfer(qid: string, answerKey: string) {
    const given = (transferAnswers[qid] ?? '').trim().toLowerCase();
    const ok = given === answerKey.toLowerCase();
    transferFeedback[qid] = ok ? 'Correct.' : `Expected: ${answerKey}`;
    if (ok) progress = markSectionComplete(data.lesson.slug, `transfer-${qid}`);
  }
</script>

<svelte:head>
  <title>{data.lesson.title} — Learn</title>
</svelte:head>

<article class="lesson-page container-wide">
  <header class="lesson-header">
    <p class="eyebrow">
      {data.pathway.title} · Lesson {data.lessonIndex}/{data.lessonCount}
      {#if data.lesson.difficulty}
        · {data.lesson.difficulty}
      {/if}
    </p>
    <h1>{data.lesson.title}</h1>
    {#if data.lesson.verification?.verified_by === 'PENDING-HUMAN' || data.lesson.verification?.verified_by === 'PENDING-RICHIE'}
      <p class="preview-badge" role="status">Machine-checked · awaiting human verification</p>
    {/if}
  </header>

  {#each data.lesson.blocks as block, i}
    {#if block.type === 'question'}
      <section class="section-question" data-testid="lesson-question">
        <h2>{block.text}</h2>
      </section>
    {:else if block.type === 'staticPreview'}
      {@const pack = sceneForId(block.sceneId)}
      {#if pack}
        <section data-testid="lesson-static-preview">
          <p class="eyebrow">Structure preview</p>
          <StaticSceneFallback scene={pack.scene} stepIndex={0} />
        </section>
      {/if}
    {:else if block.type === 'prediction'}
      <PredictionPrompt
        prompt={block.prompt}
        options={block.options}
        correctId={block.correctId}
        feedback={predictionFeedback[i] ?? ''}
        onAnswer={(_, correct) => onPrediction(i, correct)}
      />
    {:else if block.type === 'execution'}
      {@const pack = packFromExecution(block.sceneId)}
      {#if pack}
        <section data-testid="lesson-execution">
          <LearningInstrument {pack} showTruthDrawer={true} />
        </section>
      {/if}
    {:else if block.type === 'patternExplanation'}
      <section class="pattern-explanation" data-testid="lesson-pattern">
        <h2>The {block.pattern} pattern</h2>
        <ol>
          {#each block.steps as step}
            <li>{step}</li>
          {/each}
        </ol>
      </section>
    {:else if block.type === 'variation'}
      {@const vpack = packFromVariation(block.variationId)}
      {#if vpack}
        <section data-testid="lesson-variation">
          <h2>Same structure, different names</h2>
          <LearningInstrument
            pack={{
              id: vpack.id,
              title: 'Variation',
              source: vpack.source,
              argsRepr: vpack.argsRepr,
              graph: vpack.graph,
              trace: vpack.trace,
              scene: vpack.scene,
              semanticScene: normalizeSemanticScene(vpack.graph, vpack.trace),
            }}
            showTruthDrawer={true}
          />
        </section>
      {/if}
    {:else if block.type === 'comparison'}
      <ComparisonPanel
        currentPattern={data.lesson.slug.toUpperCase()}
        neighborPattern={block.neighborPattern}
        rows={block.rows}
      />
    {:else if block.type === 'transferCheck'}
      <section class="transfer" data-testid="lesson-transfer">
        <h2>Transfer check</h2>
        {#each block.questions as q}
          <p>{q.prompt}</p>
          <div class="row">
            <input type="text" bind:value={transferAnswers[q.id]} aria-label="Answer" />
            <button type="button" class="btn-secondary" onclick={() => gradeTransfer(q.id, q.answerKey)}>
              Check
            </button>
          </div>
          {#if transferFeedback[q.id]}
            <p>{transferFeedback[q.id]}</p>
          {/if}
        {/each}
      </section>
    {:else if block.type === 'summary'}
      <PatternSummary fields={block.fields} />
    {:else if block.type === 'text'}
      <p class="prose">{block.content}</p>
    {/if}
  {/each}

  <nav class="lesson-nav">
    {#if data.prevSlug}
      <a href="/learn/{data.pathway.slug}/{data.prevSlug}">← Previous</a>
    {/if}
    {#if data.nextSlug}
      <a href="/learn/{data.pathway.slug}/{data.nextSlug}">Next lesson →</a>
    {/if}
    <a href="/learn/{data.pathway.slug}">Pathway index</a>
  </nav>
</article>

<style>
  .lesson-page {
    padding: var(--space-6) var(--space-6) var(--space-10);
  }

  .lesson-header h1 {
    font-family: var(--font-display);
    font-size: var(--text-2xl);
    margin: 0 0 var(--space-3);
  }

  .preview-badge {
    font-size: var(--text-xs);
    color: var(--ink-muted);
    background: var(--surface-recessed);
    display: inline-block;
    padding: var(--space-1) var(--space-3);
    border-radius: var(--radius-xs);
  }

  .section-question h2 {
    font-size: var(--text-xl);
    line-height: 1.4;
    max-width: 50ch;
    margin: var(--space-6) 0;
  }

  .pattern-explanation ol {
    line-height: 1.7;
    color: var(--ink-body);
  }

  .prose {
    line-height: 1.6;
    color: var(--ink-body);
  }

  .transfer .row {
    display: flex;
    gap: var(--space-2);
    margin: var(--space-2) 0 var(--space-4);
  }

  .lesson-nav {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-4);
    margin-top: var(--space-8);
    padding-top: var(--space-4);
    border-top: 1px solid var(--line-soft);
  }

  .lesson-nav a {
    color: var(--ink-strong);
    font-size: var(--text-sm);
  }
</style>
