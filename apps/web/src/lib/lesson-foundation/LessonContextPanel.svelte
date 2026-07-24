<script lang="ts">
  import type {
    LessonDefinitionV4,
    LessonLensCue,
    LessonResponse,
  } from '@lol/lens-contracts';

  let {
    definition,
    activeSectionId,
    cue,
    responses,
    onReturn,
  }: {
    definition: LessonDefinitionV4;
    activeSectionId: string;
    cue: LessonLensCue;
    responses: Record<string, LessonResponse>;
    onReturn: () => void;
  } = $props();

  const sectionIndex = $derived(
    Math.max(0, definition.sections.findIndex((section) => section.id === activeSectionId)),
  );
  const section = $derived(definition.sections[sectionIndex] ?? definition.sections[0]);
  const sectionResponses = $derived(
    section.blocks
      .filter((block) => 'responseId' in block)
      .map((block) => ({
        id: 'responseId' in block ? block.responseId : '',
        response: 'responseId' in block ? responses[block.responseId] : undefined,
      }))
      .filter((item) => item.id && item.response?.answer.trim()),
  );

  function statusLabel(status: LessonResponse['status']) {
    if (status === 'revealed') return 'Revealed';
    if (status === 'committed') return 'Committed';
    return 'Draft';
  }
</script>

<aside class="lesson-context" data-testid="lesson-context-panel" aria-label="Current lesson context">
  <div class="context-heading">
    <p>Part {sectionIndex + 1} of {definition.sections.length}</p>
    <h2>{section.heading}</h2>
  </div>

  <div class="lens-prompt">
    <p>{cue.eyebrow ?? 'Learning Lens'}</p>
    <h3>{cue.title ?? 'Explore the current program'}</h3>
    {#if cue.instruction}<span>{cue.instruction}</span>{/if}
  </div>

  {#if sectionResponses.length}
    <div class="responses">
      <p class="response-label">Your response</p>
      {#each sectionResponses as item}
        <article>
          <span>{statusLabel(item.response!.status)}</span>
          <p>{item.response!.answer}</p>
        </article>
      {/each}
    </div>
  {/if}

  <button type="button" class="return" onclick={onReturn}>← Return to lesson</button>
</aside>

<style>
  .lesson-context {
    position: sticky;
    top: 18px;
    display: flex;
    min-width: 0;
    max-height: calc(100vh - 36px);
    flex-direction: column;
    gap: 20px;
    overflow: auto;
    padding: 20px;
    border-right: 1px solid var(--line-soft);
    background: #fffaf2;
  }
  p, h2, h3 { margin: 0; }
  .context-heading > p, .lens-prompt > p, .response-label {
    color: #9d542e;
    font-size: var(--text-xs);
    font-weight: 700;
    letter-spacing: .09em;
    text-transform: uppercase;
  }
  h2 { margin-top: 6px; font-family: var(--font-display); font-size: clamp(24px, 2.2vw, 34px); line-height: 1.05; }
  .lens-prompt { display: grid; gap: 7px; padding-top: 18px; border-top: 1px solid var(--line-soft); }
  .lens-prompt h3 { font-size: var(--text-md); line-height: 1.3; }
  .lens-prompt span { color: var(--ink-secondary); font-size: var(--text-sm); line-height: 1.5; }
  .responses { display: grid; gap: 10px; }
  article { padding: 12px; border: 1px solid var(--line-soft); border-radius: 8px; background: white; }
  article span { color: #32644f; font-size: var(--text-xs); font-weight: 700; }
  article p { margin-top: 5px; overflow-wrap: anywhere; color: var(--ink-secondary); font-size: var(--text-sm); }
  .return { margin-top: auto; padding: 10px 0; border: 0; background: transparent; color: #8b4930; text-align: left; font-weight: 700; cursor: pointer; }
</style>
