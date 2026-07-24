<script lang="ts">
  import { onMount, tick } from 'svelte';
  import type { LessonDefinitionV4 } from '@lol/lens-contracts';

  let {
    definition,
    activeSectionId,
    completedSectionIds,
    onSelect,
  }: {
    definition: LessonDefinitionV4;
    activeSectionId: string;
    completedSectionIds: string[];
    onSelect: (id: string) => void;
  } = $props();

  let pathwayElement!: HTMLElement;

  async function keepCurrentVisible() {
    await tick();
    pathwayElement
      ?.querySelector<HTMLElement>('[aria-current="step"]')
      ?.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'smooth' });
  }

  onMount(() => {
    const observer = new ResizeObserver(() => void keepCurrentVisible());
    observer.observe(pathwayElement);
    void keepCurrentVisible();
    return () => observer.disconnect();
  });

  $effect(() => {
    activeSectionId;
    void keepCurrentVisible();
  });
</script>

<nav
  bind:this={pathwayElement}
  class="pathway"
  aria-label="Lesson pathway"
  data-testid="lesson-progress-rail"
  data-orientation="horizontal"
>
  <ol>
    {#each definition.sections as section, index}
      <li class:complete={completedSectionIds.includes(section.id)}>
        <button
          type="button"
          class:active={activeSectionId === section.id}
          aria-current={activeSectionId === section.id ? 'step' : undefined}
          onclick={() => onSelect(section.id)}
        >
          <span class="number" aria-hidden="true">
            {completedSectionIds.includes(section.id) ? '✓' : index + 1}
          </span>
          <span class="label">{section.heading}</span>
        </button>
      </li>
    {/each}
  </ol>
</nav>

<style>
  .pathway {
    position: relative;
    z-index: 18;
    overflow-x: auto;
    padding: 14px clamp(18px, 3vw, 48px);
    border-bottom: 1px solid var(--line-soft);
    background: #fffdf8;
    scrollbar-width: thin;
    scroll-padding-inline: 48px;
  }
  ol { display: flex; align-items: center; min-width: max-content; margin: 0; padding: 0; list-style: none; }
  li { display: flex; align-items: center; }
  li:not(:last-child)::after { content: ''; width: clamp(16px, 2vw, 34px); height: 1px; background: #ddd6c9; }
  button {
    display: flex;
    gap: 9px;
    align-items: center;
    min-height: 44px;
    padding: 7px 9px;
    border: 1px solid transparent;
    border-radius: 10px;
    background: transparent;
    color: var(--ink-secondary);
    cursor: pointer;
  }
  button.active { border-color: #82aa98; background: #edf4ef; color: #1d5845; }
  .number { display: grid; place-items: center; flex: 0 0 auto; width: 28px; height: 28px; border-radius: 50%; background: #e9e3d8; color: var(--ink-primary); font-weight: 700; }
  .active .number, .complete .number { background: #236b54; color: white; }
  .label { max-width: 145px; text-align: left; font-size: var(--text-xs); line-height: 1.25; }
  @media (max-width: 640px) {
    .pathway { padding-inline: 10px; scroll-padding-inline: 10px; }
    .label { max-width: 110px; }
  }
  @media (prefers-reduced-motion: reduce) { .pathway { scroll-behavior: auto; } }
</style>
