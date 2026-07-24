<script lang="ts">
  import type {
    LessonDefinitionBlockV4,
    LessonResponse,
    LessonVariationV3,
  } from '@lol/lens-contracts';
  import type { LessonComparisonState } from './session.svelte';

  let {
    block,
    response,
    bindings,
    variation,
    comparison,
    onDraft,
    onApplyVariation,
    onRetry,
  }: {
    block: LessonDefinitionBlockV4;
    response?: LessonResponse;
    bindings: Record<string, string>;
    variation?: LessonVariationV3;
    comparison: LessonComparisonState;
    onDraft: (id: string, answer: string) => void;
    onApplyVariation: (id: string, variationId: string) => void;
    onRetry: (id: string) => void;
  } = $props();

  function parseRecord(answer?: string): Record<string, string> {
    try {
      const value: unknown = JSON.parse(answer ?? '{}');
      return value && typeof value === 'object' ? value as Record<string, string> : {};
    } catch {
      return {};
    }
  }

  function updateRecord(id: string, key: string, value: string) {
    onDraft(id, JSON.stringify({ ...parseRecord(response?.answer), [key]: value }));
  }

  function parseList(answer?: string): string[] {
    try {
      const value: unknown = JSON.parse(answer ?? '[]');
      return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];
    } catch {
      return [];
    }
  }

  function toggleList(id: string, value: string) {
    const selected = parseList(response?.answer);
    onDraft(id, JSON.stringify(
      selected.includes(value)
        ? selected.filter((item) => item !== value)
        : [...selected, value],
    ));
  }

  function recognitionItems(block: Extract<LessonDefinitionBlockV4, { type: 'recognition-check' }>) {
    return block.items;
  }

  function recognitionRoles(block: Extract<LessonDefinitionBlockV4, { type: 'recognition-check' }>) {
    return block.roles;
  }
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
{:else if block.type === 'assignment-shape'}
  <div class="assignment-shape" data-testid="lesson-assignment-shape">
    {#if block.title}<h3>{block.title}</h3>{/if}
    {#each block.lines as line}
      <article class="assignment-line">
        <code class="whole-line">{line.source}</code>
        <dl>
          <div><dt>Target</dt><dd><code>{line.target}</code></dd></div>
          <div><dt>Assign</dt><dd><code>{line.operator}</code></dd></div>
          <div><dt>Value or expression</dt><dd><code>{line.expression}</code></dd></div>
          <div><dt>Depends on</dt><dd>{line.dependencies.length ? line.dependencies.join(', ') : 'no earlier names'}</dd></div>
        </dl>
      </article>
    {/each}
  </div>
{:else if block.type === 'callout'}
  <aside class="callout" data-tone={block.tone}>
    <strong>{block.label ?? block.tone}</strong><p>{block.text}</p>
  </aside>
{:else if block.type === 'prediction'}
  <fieldset class="prediction" data-testid="branch-prediction">
    <legend>{block.prompt}</legend>
    {#each block.options as option}
      <label>
        <input
          type="radio"
          name={block.responseId}
          value={option.id}
          checked={response?.answer === option.id}
          disabled={response?.status === 'revealed'}
          onchange={() => onDraft(block.responseId, option.id)}
        />
        {option.label}
      </label>
    {/each}
    {#if response?.status === 'committed'}
      <p class="committed">Prediction committed and ready to check.</p>
    {:else}
      {#if response?.status === 'revealed'}
        <p class:success={response.correct} class:error={!response.correct}>{response.feedback}</p>
      {/if}
    {/if}
  </fieldset>
{:else if block.type === 'value-prediction'}
  {@const answers = parseRecord(response?.answer)}
  <fieldset class="interaction" data-testid="value-prediction">
    <legend>{block.prompt}</legend>
    <div class="prediction-fields">
      {#each block.fields as field}
        <label>
          <span>{field.label} =</span>
          <input
            type="number"
            inputmode="decimal"
            value={answers[field.id] ?? ''}
            disabled={response?.status !== undefined && response.status !== 'draft'}
            data-testid="prediction-{field.id}"
            oninput={(event) => updateRecord(block.responseId, field.id, event.currentTarget.value)}
          />
        </label>
      {/each}
    </div>
    {#if response?.status === 'committed'}
      <p class="committed">Prediction committed. It will not change when execution is revealed.</p>
    {:else if response?.status === 'revealed'}
      <div class="comparison" data-testid="prediction-comparison">
        {#each block.fields as field}
          <p><strong>{field.label}</strong><span>Predicted {answers[field.id]}</span><span>Actual {bindings[field.id] ?? '—'}</span></p>
        {/each}
      </div>
      <p class:success={response.correct} class:error={!response.correct}>{response.feedback}</p>
    {/if}
  </fieldset>
{:else if block.type === 'variation-prediction'}
  {@const selected = parseList(response?.answer)}
  <fieldset class="interaction" data-testid="variation-prediction">
    <legend>{block.prompt}</legend>
    {#each block.options as option}
      <label class="choice">
        <input
          type="checkbox"
          checked={selected.includes(option)}
          disabled={response?.status !== undefined && response.status !== 'draft'}
          onchange={() => toggleList(block.responseId, option)}
        />
        {option}
      </label>
    {/each}
    {#if response?.status === 'committed'}
      <button
        type="button"
        class="primary"
        data-testid="apply-variation"
        onclick={() => onApplyVariation(block.responseId, block.variationId)}
      >{variation?.applyLabel ?? variation?.label ?? 'Apply variation'}</button>
    {:else if response?.status === 'revealed'}
      <div class="comparison" data-testid="variation-comparison">
        {#each comparison?.rows ?? [] as row}
          <p><strong>{row.label}</strong><span>Original {row.baseline}</span><span>Changed {row.current}</span></p>
        {/each}
      </div>
      <p class:success={response.correct} class:error={!response.correct}>{response.feedback}</p>
    {/if}
  </fieldset>
{:else if block.type === 'observation'}
  <div class="observation"><strong>Try this in Lens</strong><p>{block.text}</p></div>
{:else if block.type === 'recognition-check'}
  {@const classifications = parseRecord(response?.answer)}
  {@const items = recognitionItems(block)}
  {@const roles = recognitionRoles(block)}
  <div class="interaction" data-testid="recognition-check">
    <p>{block.prompt}</p>
    <pre><code>{block.source}</code></pre>
    <div class="classification">
      {#each items as item}
        <fieldset>
          <legend><code>{item.label}</code></legend>
          {#each roles as role}
            <label class="choice">
              <input
                type="radio"
                name={`${block.responseId}-${item.id}`}
                value={role.id}
                checked={classifications[item.id] === role.id}
                disabled={response?.status === 'revealed'}
                onchange={() => updateRecord(block.responseId, item.id, role.id)}
              />
              {role.label}
            </label>
          {/each}
        </fieldset>
      {/each}
    </div>
    {#if response?.status === 'revealed'}
      <p class:success={response.correct} class:error={!response.correct}>{response.feedback}</p>
      {#if !response.correct}
        <button type="button" data-testid="retry-recognition" onclick={() => onRetry(block.responseId)}>Try again</button>
      {/if}
    {/if}
  </div>
{:else if block.type === 'build'}
  <div class="interaction build" data-testid="build-instructions">
    <p>{block.prompt}</p>
    {#if block.criteria?.length}
      <ul>{#each block.criteria as criterion}<li>{criterion}</li>{/each}</ul>
    {/if}
    {#if response?.feedback}
      <p class:success={response.correct} class:error={!response.correct} data-testid="build-feedback">{response.feedback}</p>
    {/if}
  </div>
{:else if block.type === 'transfer-check'}
  <div class="interaction" data-testid="transfer-check" data-phase={block.phase}>
    <p>{block.prompt}</p>
    <pre><code>{block.source}</code></pre>
    {#each block.options as option}
      <label class="choice">
        <input
          type="radio"
          name={block.responseId}
          value={option.id}
          checked={response?.answer === option.id}
          disabled={response?.status === 'revealed'}
          onchange={() => onDraft(block.responseId, option.id)}
        />
        {option.label}
      </label>
    {/each}
    {#if response?.status === 'revealed'}
      <p class:success={response.correct} class:error={!response.correct}>{response.feedback}</p>
    {/if}
  </div>
{/if}

<style>
  .prose, .definition, .callout, .observation, .code-shape, .assignment-shape, .code-block, .interaction { margin: 0 0 20px; }
  .prose p, .definition p, .callout p, .observation p { line-height: 1.7; color: var(--ink-secondary); }
  .definition { margin-inline: 0; padding: 22px 24px; border-left: 4px solid #d36c37; background: #f6ede2; }
  .definition p, .callout p, .observation p { margin-bottom: 0; }
  pre { overflow: auto; padding: 18px; border-radius: 10px; background: #19221e; color: #eef4ef; line-height: 1.55; }
  figcaption { color: var(--ink-muted); font-size: var(--text-sm); }
  .code-shape, .assignment-shape { padding: 22px; border: 1px solid #b9cbbf; border-radius: 12px; background: #f4f8f4; }
  .code-shape h3, .assignment-shape h3 { margin-top: 0; font-family: var(--font-display); }
  .shape-rows, .assignment-shape { display: grid; gap: 10px; }
  .shape-row { display: grid; grid-template-columns: 110px minmax(110px, .55fr) 1fr; gap: 14px; align-items: center; padding: 12px; border-radius: 8px; background: white; }
  .shape-row > span { color: #496158; font-size: var(--text-sm); font-weight: 700; }
  .shape-row code { color: #9d542e; font-weight: 700; }
  .shape-row p { margin: 0; color: var(--ink-secondary); }
  .assignment-line { padding: 14px; border-radius: 10px; background: white; }
  .whole-line { display: block; margin-bottom: 12px; color: #173b2f; font-size: 16px; font-weight: 700; white-space: pre-wrap; }
  dl { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 8px; margin: 0; }
  dl div { min-width: 0; }
  dt { color: var(--ink-muted); font-size: var(--text-xs); text-transform: uppercase; }
  dd { margin: 3px 0 0; overflow-wrap: anywhere; }
  .callout, .observation { padding: 18px 20px; border-radius: 10px; background: #e8f1eb; }
  .callout[data-tone='warning'] { background: #f8e6df; }
  .callout[data-tone='idea'] { background: #e7eff7; }
  .prediction, .interaction { padding: 20px; border: 1px solid var(--line-soft); border-radius: 10px; background: white; }
  .interaction legend, .prediction legend { padding: 0 6px; font-weight: 700; }
  .prediction-fields { display: flex; flex-wrap: wrap; gap: 12px; margin: 12px 0; }
  .prediction-fields label { display: flex; align-items: center; gap: 8px; }
  .prediction-fields input { width: 100px; padding: 8px; }
  .choice { display: flex; gap: 9px; align-items: center; margin: 9px 0; }
  .primary { margin-top: 12px; padding: 10px 15px; border: 0; border-radius: 8px; background: #236b54; color: white; font-weight: 700; }
  .primary:disabled { opacity: .45; }
  .committed { color: #496158; }
  .comparison { display: grid; gap: 7px; margin-top: 12px; }
  .comparison p { display: grid; grid-template-columns: 90px 1fr 1fr; gap: 10px; margin: 0; padding: 9px; border-radius: 6px; background: #f2f5f2; }
  .classification { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; }
  .classification fieldset { border: 1px solid var(--line-soft); border-radius: 8px; }
  .success { color: #176342; font-weight: 700; }
  .error { color: #9f3b28; font-weight: 700; }
  @media (max-width: 700px) {
    .shape-row, dl, .classification { grid-template-columns: 1fr; gap: 6px; }
    .comparison p { grid-template-columns: 1fr; }
  }
</style>
