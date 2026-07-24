<script lang="ts">
  import type { LessonDefinitionV3, LessonResponse } from '@lol/lens-contracts';
  import type { LessonComparisonState } from './session.svelte';
  import LessonBlockRenderer from './LessonBlockRenderer.svelte';

  let {
    definition,
    activeSectionId,
    completedSectionIds,
    responses,
    bindings,
    comparison,
    onDraft,
    onCommit,
    onRevealPrediction,
    onApplyVariation,
    onRetry,
    onCheckBuild,
  }: {
    definition: LessonDefinitionV3;
    activeSectionId: string;
    completedSectionIds: string[];
    responses: Record<string, LessonResponse>;
    bindings: Record<string, string>;
    comparison: LessonComparisonState;
    onDraft: (id: string, answer: string) => void;
    onCommit: (id: string, correct?: boolean, feedback?: string) => void;
    onRevealPrediction: (id: string, correct: boolean, feedback: string) => void;
    onApplyVariation: (id: string, variationId: string) => void;
    onRetry: (id: string) => void;
    onCheckBuild: (id: string) => void;
  } = $props();
</script>

<div class="narrative" data-testid="lesson-narrative">
  {#each definition.sections as section, index}
    <section
      id={section.id}
      class:active={section.id === activeSectionId}
      data-testid="lesson-section"
      data-section-id={section.id}
      aria-labelledby={`${section.id}-heading`}
    >
      <header>
        <div><p>Part {index + 1}</p><h2 id={`${section.id}-heading`}>{section.heading}</h2></div>
        {#if completedSectionIds.includes(section.id)}
          <span class="complete" aria-label="Completed">✓ Completed</span>
        {/if}
      </header>
      {#each section.blocks as block}
        <LessonBlockRenderer
          {block}
          response={'responseId' in block ? responses[block.responseId] : undefined}
          {bindings}
          variation={block.type === 'variation-prediction'
            ? definition.variations.find((variation) => variation.id === block.variationId)
            : undefined}
          {comparison}
          {onDraft}
          {onCommit}
          {onRevealPrediction}
          {onApplyVariation}
          {onRetry}
          {onCheckBuild}
        />
      {/each}
    </section>
  {/each}
</div>

<style>
  .narrative { display: grid; gap: 18px; min-width: 0; }
  section { scroll-margin-top: 24px; padding: clamp(24px, 4vw, 42px); border: 1px solid var(--line-soft); border-radius: 16px; background: #fffdf8; opacity: .92; }
  section.active { border-color: #91ad9f; box-shadow: 0 12px 28px rgba(42, 48, 44, .07); opacity: 1; }
  header { display: flex; justify-content: space-between; gap: 18px; align-items: start; margin-bottom: 22px; }
  header p { margin: 0 0 5px; color: #9d542e; text-transform: uppercase; letter-spacing: .1em; font-size: var(--text-xs); font-weight: 700; }
  h2 { margin: 0; font-family: var(--font-display); font-size: clamp(28px, 3vw, 40px); }
  .complete { padding: 8px 11px; border-radius: 999px; background: #236b54; color: white; white-space: nowrap; font-size: var(--text-sm); }
  @media (max-width: 600px) { header { display: grid; } .complete { justify-self: start; } }
</style>
