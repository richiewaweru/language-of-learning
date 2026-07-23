<script lang="ts">
  import type { LessonDefinitionV1 } from '@lol/lens-contracts';
  import LessonBlockRenderer from './LessonBlockRenderer.svelte';

  let {
    definition,
    activeSectionId,
    completedSectionIds,
    predictions,
    onComplete,
    onPrediction,
  }: {
    definition: LessonDefinitionV1;
    activeSectionId: string;
    completedSectionIds: string[];
    predictions: Record<string, string>;
    onComplete: (id: string) => void;
    onPrediction: (id: string, answer: string) => void;
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
        <button
          type="button"
          class:complete={completedSectionIds.includes(section.id)}
          onclick={() => onComplete(section.id)}
        >
          {completedSectionIds.includes(section.id) ? 'Completed' : 'Mark complete'}
        </button>
      </header>
      {#each section.blocks as block}
        <LessonBlockRenderer
          {block}
          predictionAnswer={block.type === 'prediction' ? predictions[block.id] : undefined}
          {onPrediction}
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
  header button { padding: 8px 11px; border: 1px solid #8b968f; border-radius: 999px; background: transparent; white-space: nowrap; }
  header button.complete { background: #236b54; border-color: #236b54; color: white; }
  @media (max-width: 600px) { header { display: grid; } header button { justify-self: start; } }
</style>
