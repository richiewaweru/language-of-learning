<script lang="ts">
  import type { LessonDefinitionV4, LessonResponse } from '@lol/lens-contracts';
  import type { LessonComparisonState } from './session.svelte';
  import LessonBlockRenderer from './LessonBlockRenderer.svelte';
  import {
    createLessonCheckAction,
    type LessonCheckAction,
  } from './lesson-actions';

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
    onCheckActionChange,
  }: {
    definition: LessonDefinitionV4;
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
    onCheckBuild: (id: string) => void | Promise<unknown>;
    onCheckActionChange: (action: LessonCheckAction | null) => void;
  } = $props();

  const activeSection = $derived(
    definition.sections.find((section) => section.id === activeSectionId)
      ?? definition.sections[0],
  );
  const activeSectionIndex = $derived(
    Math.max(0, definition.sections.findIndex((section) => section.id === activeSection.id)),
  );
  const responseBlock = $derived(
    activeSection.blocks.find((block) => 'responseId' in block),
  );
  const responseAssessment = $derived(
    responseBlock && 'responseId' in responseBlock
      ? definition.assessments.find(
          (assessment) => assessment.responseId === responseBlock.responseId,
        )
      : undefined,
  );
  const activeCheckAction = $derived(
    responseBlock
      ? createLessonCheckAction(
          responseBlock,
          responseAssessment,
          'responseId' in responseBlock ? responses[responseBlock.responseId] : undefined,
          {
            onCommit,
            onReveal: onRevealPrediction,
            onCheckBuild,
          },
        )
      : null,
  );

  $effect(() => {
    onCheckActionChange(activeCheckAction);
  });
</script>

<div class="narrative" data-testid="lesson-narrative">
  <section
    id={activeSection.id}
    data-testid="lesson-section"
    data-section-id={activeSection.id}
    aria-labelledby={`${activeSection.id}-heading`}
  >
    <header>
      <div>
        <p>Part {activeSectionIndex + 1}</p>
        <h1 id={`${activeSection.id}-heading`}>{activeSection.heading}</h1>
      </div>
      {#if completedSectionIds.includes(activeSection.id)}
        <span class="complete" aria-label="Completed">✓ Completed</span>
      {/if}
    </header>
    {#each activeSection.blocks as block}
      <LessonBlockRenderer
        {block}
        response={'responseId' in block ? responses[block.responseId] : undefined}
        {bindings}
        variation={block.type === 'variation-prediction'
          ? definition.variations.find((variation) => variation.id === block.variationId)
          : undefined}
        {comparison}
        {onDraft}
        {onApplyVariation}
        {onRetry}
      />
    {/each}
  </section>
</div>

<style>
  .narrative { min-width: 0; }
  section { min-height: 340px; padding: clamp(24px, 4vw, 42px); border: 1px solid var(--line-soft); border-radius: 14px; background: #fffdf8; box-shadow: 0 10px 28px rgba(42, 48, 44, .055); }
  header { display: flex; justify-content: space-between; gap: 18px; align-items: start; margin-bottom: 22px; }
  header p { margin: 0 0 5px; color: #9d542e; text-transform: uppercase; letter-spacing: .1em; font-size: var(--text-xs); font-weight: 700; }
  h1 { margin: 0; color: var(--ink-primary); font-family: var(--font-display); font-size: clamp(34px, 4vw, 52px); line-height: 1.08; }
  .complete { padding: 7px 11px; border-radius: 999px; background: #e8f3ec; color: #236b54; white-space: nowrap; font-size: var(--text-sm); font-weight: 700; }
  @media (max-width: 600px) { header { display: grid; } .complete { justify-self: start; } }
</style>
