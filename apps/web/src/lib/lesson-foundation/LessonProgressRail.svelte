<script lang="ts">
  import type { LessonDefinitionV2 } from '@lol/lens-contracts';
  let {
    definition,
    activeSectionId,
    completedSectionIds,
    onSelect,
    onRestart,
  }: {
    definition: LessonDefinitionV2;
    activeSectionId: string;
    completedSectionIds: string[];
    onSelect: (id: string) => void;
    onRestart: () => void;
  } = $props();
</script>

<aside class="rail" data-testid="lesson-progress-rail">
  <a class="back" href="/learn/python-foundations">← Python Foundations</a>
  <p class="label">Lesson progress</p>
  <ol>
    {#each definition.sections as section, index}
      <li>
        <button
          type="button"
          class:active={activeSectionId === section.id}
          class:complete={completedSectionIds.includes(section.id)}
          onclick={() => onSelect(section.id)}
        >
          <span>{completedSectionIds.includes(section.id) ? '✓' : index + 1}</span>
          {section.heading}
        </button>
      </li>
    {/each}
  </ol>
  <button class="restart" type="button" data-testid="lesson-restart" onclick={onRestart}>Restart lesson</button>
</aside>

<style>
  .rail { position: sticky; top: 20px; display: grid; gap: 14px; padding: 20px; border: 1px solid var(--line-soft); border-radius: 12px; background: var(--surface-card); }
  .back { color: #32644f; text-decoration: none; font-weight: 700; font-size: var(--text-sm); }
  .label { margin: 6px 0 0; color: var(--ink-muted); text-transform: uppercase; letter-spacing: .08em; font-size: var(--text-xs); }
  ol { display: grid; gap: 6px; margin: 0; padding: 0; list-style: none; }
  li button { width: 100%; display: grid; grid-template-columns: 26px 1fr; gap: 9px; align-items: center; padding: 10px; border: 1px solid transparent; border-radius: 8px; background: transparent; color: var(--ink-secondary); text-align: left; }
  li button span { display: grid; place-items: center; width: 24px; height: 24px; border-radius: 50%; background: #e9e3d6; }
  li button.active { border-color: #94b3a3; background: #edf4ef; color: var(--ink-primary); }
  li button.complete span { background: #236b54; color: white; }
  .restart { justify-self: start; border: 0; background: transparent; color: #8b4930; text-decoration: underline; }
  @media (max-width: 900px) { .rail { position: static; } }
</style>
