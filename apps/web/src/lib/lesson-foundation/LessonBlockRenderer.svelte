<script lang="ts">
  import type { LessonDefinitionBlock } from '@lol/lens-contracts';

  let {
    block,
    predictionAnswer,
    onPrediction,
  }: {
    block: LessonDefinitionBlock;
    predictionAnswer?: string;
    onPrediction?: (id: string, answer: string) => void;
  } = $props();
</script>

{#if block.type === 'prose'}
  <div class="prose">
    {#each block.paragraphs as paragraph}<p>{paragraph}</p>{/each}
  </div>
{:else if block.type === 'definition'}
  <blockquote class="definition"><strong>Definition</strong><p>{block.text}</p></blockquote>
{:else if block.type === 'code'}
  <figure class="code-block">
    <pre><code>{block.source}</code></pre>
    {#if block.caption}<figcaption>{block.caption}</figcaption>{/if}
  </figure>
{:else if block.type === 'code-shape'}
  <div class="code-shape" data-testid="lesson-code-shape">
    {#if block.title}<h3>{block.title}</h3>{/if}
    <div class="shape-rows">
      {#each block.rows as row}
        <div class="shape-row" data-tone={row.tone ?? 'value'}>
          <span>{row.label}</span><code>{row.code}</code><p>{row.explanation}</p>
        </div>
      {/each}
    </div>
  </div>
{:else if block.type === 'callout'}
  <aside class="callout" data-tone={block.tone}>
    <strong>{block.label ?? block.tone}</strong><p>{block.text}</p>
  </aside>
{:else if block.type === 'prediction'}
  <fieldset class="prediction">
    <legend>{block.prompt}</legend>
    {#each block.options ?? [] as option}
      <label>
        <input
          type="radio"
          name={block.id}
          value={option.id}
          checked={predictionAnswer === option.id}
          onchange={() => onPrediction?.(block.id, option.id)}
        />
        {option.label}
      </label>
    {/each}
  </fieldset>
{:else if block.type === 'observation'}
  <div class="observation"><strong>Try this in Lens</strong><p>{block.text}</p></div>
{:else if block.type === 'recognition'}
  <div class="recognition"><p>{block.prompt}</p><pre><code>{block.source}</code></pre></div>
{:else if block.type === 'production'}
  <div class="production">
    <label>{block.prompt}<textarea rows="6" value={block.scaffold ?? ''}></textarea></label>
  </div>
{/if}

<style>
  .prose, .definition, .callout, .observation, .recognition, .production, .code-shape, .code-block { margin: 0 0 20px; }
  .prose p, .definition p, .callout p, .observation p { line-height: 1.7; color: var(--ink-secondary); }
  .definition { margin-inline: 0; padding: 22px 24px; border-left: 4px solid #d36c37; background: #f6ede2; }
  .definition p, .callout p, .observation p { margin-bottom: 0; }
  pre { overflow: auto; padding: 18px; border-radius: 10px; background: #19221e; color: #eef4ef; line-height: 1.55; }
  figcaption { color: var(--ink-muted); font-size: var(--text-sm); }
  .code-shape { padding: 22px; border: 1px solid #b9cbbf; border-radius: 12px; background: #f4f8f4; }
  .code-shape h3 { margin-top: 0; font-family: var(--font-display); }
  .shape-rows { display: grid; gap: 10px; }
  .shape-row { display: grid; grid-template-columns: 110px minmax(110px, .55fr) 1fr; gap: 14px; align-items: center; padding: 12px; border-radius: 8px; background: white; }
  .shape-row > span { color: #496158; font-size: var(--text-sm); font-weight: 700; }
  .shape-row code { color: #9d542e; font-weight: 700; }
  .shape-row p { margin: 0; color: var(--ink-secondary); }
  .callout, .observation { padding: 18px 20px; border-radius: 10px; background: #e8f1eb; }
  .callout[data-tone='warning'] { background: #f8e6df; }
  .callout[data-tone='idea'] { background: #e7eff7; }
  .prediction { display: grid; gap: 10px; margin: 0 0 20px; padding: 20px; border: 1px solid var(--line-soft); border-radius: 10px; }
  .prediction legend { padding: 0 6px; font-weight: 700; }
  .prediction label { display: flex; gap: 9px; align-items: center; }
  textarea { display: block; width: 100%; margin-top: 10px; padding: 14px; box-sizing: border-box; border: 1px solid var(--line-default); border-radius: 8px; font-family: monospace; }
  @media (max-width: 700px) {
    .shape-row { grid-template-columns: 1fr; gap: 6px; }
  }
</style>
