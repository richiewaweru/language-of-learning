<script lang="ts">
  import { ScenePlayer } from '@lol/visual-grammar';
  import '@lol/visual-grammar/styles.css';
  import type { SemanticGraph, Trace } from '@lol/lens-scenes';
  import type { Selection } from '@lol/lens-contracts';

  let { data } = $props();
  let runInteractive = $state(false);
  let selection = $state<Selection>({ stepIndex: 0 });
  let checkAnswers = $state<Record<string, string>>({});
  let checkFeedback = $state<Record<string, string>>({});

  function grade(checkId: string) {
    const check = data.lesson.checks.find((c) => c.id === checkId);
    if (!check) return;
    const given = (checkAnswers[checkId] ?? '').trim();
    const ok = given === check.answerKey;
    checkFeedback[checkId] = ok
      ? `Correct — ${check.rubric ?? check.answerKey}`
      : `Not quite. Expected line ${check.answerKey}. ${check.rubric ?? ''}`;
  }
</script>

<svelte:head>
  <title>{data.lesson.title} — Learn</title>
</svelte:head>

<main>
  <p class="eyebrow">
    {data.pathway.title} · Lesson {data.lessonIndex}/{data.lessonCount}
  </p>
  <h1>{data.lesson.title}</h1>

  {#if data.lesson.verification?.verified_by === 'PENDING-RICHIE' || !data.lesson.verification?.verified_by}
    <p class="preview-badge" role="status">Machine-checked · awaiting human verification</p>
  {/if}

  <ul class="objectives">
    {#each data.lesson.objectives as obj}
      <li>{obj}</li>
    {/each}
  </ul>

  {#each data.lesson.blocks as block}
    {#if block.type === 'text'}
      <p class="prose">{block.content}</p>
    {:else if block.type === 'scene'}
      {@const pack = data.sceneBlocks.find((s) => s.sceneId === block.sceneId)}
      {#if pack}
        <section class="scene-panel" data-testid="static-scene">
          <p class="caption">{pack.initialCaption}</p>
          {#if !runInteractive}
            <div
              class="static-canvas"
              style:width="{Math.max(...pack.scene.layout.map((n) => n.x + n.width)) + 28}px"
              style:height="{Math.max(...pack.scene.layout.map((n) => n.y + n.height)) + 28}px"
              aria-label="Static initial scene"
            >
              {#each pack.scene.layout as node}
                <div
                  class="static-node"
                  data-kind={node.kind}
                  style:left="{node.x}px"
                  style:top="{node.y}px"
                  style:width="{node.width}px"
                  style:height="{node.height}px"
                >
                  {node.kind}
                </div>
              {/each}
            </div>
            <p class="static-note">
              Static initial state (JS animation off). Use “Run it yourself” for learner-paced
              stepping.
            </p>
            <button type="button" class="btn" onclick={() => (runInteractive = true)}>
              Run it yourself
            </button>
          {:else}
            <ScenePlayer
              scene={pack.scene}
              graph={pack.example.graph as SemanticGraph}
              trace={pack.example.trace as Trace}
              {selection}
              onselectionchange={(next) => (selection = next)}
              width={Math.max(...pack.scene.layout.map((n) => n.x + n.width)) + 28}
              height={Math.max(...pack.scene.layout.map((n) => n.y + n.height)) + 28}
            />
          {/if}
          <pre class="source">{pack.example.source}</pre>
          <p class="decode-link">
            <a href="/decode">Open in Decode →</a>
          </p>
        </section>
      {/if}
    {:else if block.type === 'check'}
      {@const check = data.lesson.checks.find((c) => c.id === block.checkId)}
      {#if check}
        <section class="check-panel" data-testid="lesson-check">
          <h2>Check</h2>
          <p>{check.prompt}</p>
          <div class="row">
            <input
              type="text"
              bind:value={checkAnswers[check.id]}
              aria-label="Answer"
              placeholder="line number"
            />
            <button type="button" class="btn" onclick={() => grade(check.id)}>Check</button>
          </div>
          {#if checkFeedback[check.id]}
            <p>{checkFeedback[check.id]}</p>
          {/if}
        </section>
      {/if}
    {/if}
  {/each}

  <nav class="lesson-nav">
    {#if data.prevSlug}
      <a href="/learn/{data.pathway.slug}/{data.prevSlug}">← Previous</a>
    {:else}
      <span></span>
    {/if}
    <a href="/learn/{data.pathway.slug}">Pathway</a>
    {#if data.nextSlug}
      <a href="/learn/{data.pathway.slug}/{data.nextSlug}">Next →</a>
    {:else}
      <span>Pathway complete</span>
    {/if}
  </nav>
</main>

<style>
  main {
    max-width: 900px;
    margin: 0 auto;
    padding: 1.5rem;
    background: var(--paper);
    min-height: 100vh;
  }
  .eyebrow {
    font: var(--eyebrow);
    letter-spacing: 0.15em;
    text-transform: uppercase;
    color: var(--muted);
  }
  h1 {
    color: var(--work-purple);
    margin: 0.25rem 0 1rem;
  }
  .preview-badge {
    display: inline-block;
    margin: 0 0 1rem;
    padding: 0.35rem 0.6rem;
    border: var(--border-w) solid var(--ink);
    font: 600 12px/1.2 var(--font-ui);
    letter-spacing: 0.04em;
    background: var(--paper);
  }
  .objectives {
    color: var(--muted);
  }
  .prose {
    line-height: 1.5;
  }
  .scene-panel,
  .check-panel {
    border: var(--border-w) solid var(--ink);
    box-shadow: var(--shadow-panel);
    padding: 1rem;
    margin: 1.25rem 0;
  }
  .caption {
    font: 500 14px/1.4 var(--font-ui);
  }
  .static-canvas {
    position: relative;
    background:
      linear-gradient(var(--grid-line) 1px, transparent 1px),
      linear-gradient(90deg, var(--grid-line) 1px, transparent 1px);
    background-size: var(--grid-unit) var(--grid-unit);
    background-color: var(--bg);
    border: var(--border-w) solid var(--ink);
    margin: 0.75rem 0;
  }
  .static-node {
    position: absolute;
    box-sizing: border-box;
    border: var(--border-w) solid var(--ink);
    background: var(--paper);
    font: 700 10px/1.2 var(--font-mono);
    padding: 0.25rem;
    overflow: hidden;
  }
  .static-node[data-kind='function'] {
    border-color: var(--work-purple);
    color: var(--work-purple);
  }
  .static-node[data-kind='loop'] {
    border-color: var(--flow-teal);
    color: var(--flow-teal);
  }
  .static-node[data-kind='branch'] {
    border-color: var(--branch-magenta);
    color: var(--branch-magenta);
  }
  .static-node[data-kind='binding'] {
    border-color: var(--state-gold);
    color: var(--state-gold);
  }
  .static-node[data-kind='return'] {
    border-color: var(--exit-green);
    color: var(--exit-green);
  }
  .static-note {
    color: var(--muted);
    font-size: 0.9rem;
  }
  .btn {
    font: 700 12px/1 var(--font-mono);
    text-transform: uppercase;
    letter-spacing: 0.08em;
    padding: 0.55rem 0.75rem;
    border: var(--border-w) solid var(--ink);
    background: var(--paper);
    box-shadow: var(--shadow-btn);
    cursor: pointer;
  }
  .source {
    margin-top: 1rem;
    font: 12px/1.4 var(--font-mono);
    background: var(--bg);
    padding: 0.75rem;
    border: var(--border-w) solid var(--line);
    overflow: auto;
  }
  .row {
    display: flex;
    gap: 0.5rem;
  }
  input {
    font: 13px/1.4 var(--font-mono);
    border: var(--border-w) solid var(--ink);
    padding: 0.4rem 0.5rem;
  }
  .lesson-nav {
    display: flex;
    justify-content: space-between;
    margin-top: 2rem;
    gap: 1rem;
  }
  a {
    color: var(--data-blue);
  }
</style>
