<script lang="ts">
  let {
    courseId,
    goal,
    activeIndex,
    stepCount,
    onRestart,
  }: {
    courseId: string;
    goal: string;
    activeIndex: number;
    stepCount: number;
    onRestart: () => void;
  } = $props();

  const courseName = $derived(
    courseId
      .split('-')
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' '),
  );
  const progress = $derived(stepCount ? ((activeIndex + 1) / stepCount) * 100 : 0);
</script>

<header class="lesson-header" data-testid="lesson-header">
  <a class="course" href="/learn/{courseId}" aria-label="Back to {courseName}">
    <span class="back" aria-hidden="true">‹</span>
    <span class="mark" aria-hidden="true">⌁</span>
    <strong>{courseName}</strong>
  </a>

  <div class="goal">
    <span class="goal-mark" aria-hidden="true">◎</span>
    <strong>Your goal</strong>
    <p>{goal}</p>
  </div>

  <div class="progress" aria-label={`Lesson progress ${activeIndex + 1} of ${stepCount}`}>
    <strong>Lesson progress</strong>
    <div class="progress-row">
      <span class="track"><span style={`width: ${progress}%`}></span></span>
      <span>{activeIndex + 1} of {stepCount}</span>
    </div>
  </div>

  <div class="header-actions">
    <button type="button" data-testid="lesson-restart" onclick={onRestart}>Restart</button>
    <a class="exit" href="/learn/{courseId}">Exit lesson</a>
  </div>
</header>

<style>
  .lesson-header {
    position: relative;
    z-index: 20;
    display: grid;
    grid-template-columns: minmax(240px, .9fr) minmax(360px, 1.7fr) minmax(260px, 1fr) auto;
    gap: 28px;
    align-items: center;
    min-height: 110px;
    padding: 22px clamp(22px, 3vw, 48px);
    border-bottom: 1px solid var(--line-soft);
    background: color-mix(in srgb, #fffdf8 96%, transparent);
    color: var(--ink-primary);
  }
  .course, .exit { color: inherit; text-decoration: none; }
  .course { display: flex; align-items: center; gap: 14px; font-size: 19px; color: #236b54; }
  .back { display: grid; place-items: center; width: 48px; height: 48px; border: 1px solid var(--line-medium); border-radius: 10px; color: var(--ink-primary); font-size: 34px; font-weight: 400; line-height: 1; }
  .mark { display: grid; place-items: center; width: 32px; height: 32px; border-radius: 9px; background: #236b54; color: white; font-size: 20px; }
  .goal { display: grid; grid-template-columns: auto auto 1fr; gap: 10px 14px; align-items: start; padding-inline: 24px; border-inline: 1px solid var(--line-soft); }
  .goal-mark { color: #d36c37; font-size: 26px; line-height: 1; }
  .goal strong { padding-top: 3px; white-space: nowrap; }
  .goal p { margin: 0; color: var(--ink-secondary); line-height: 1.45; }
  .progress { display: grid; min-width: 0; gap: 10px; }
  .progress-row { display: flex; min-width: 0; gap: 14px; align-items: center; color: var(--ink-secondary); white-space: nowrap; }
  .track { width: min(270px, 17vw); height: 8px; overflow: hidden; border-radius: 99px; background: #e8e2d7; }
  .track span { display: block; height: 100%; border-radius: inherit; background: #236b54; transition: width .25s ease; }
  .header-actions { display: flex; gap: 8px; align-items: center; }
  .header-actions button { border: 0; background: transparent; color: var(--ink-muted); font: inherit; font-size: var(--text-xs); cursor: pointer; }
  .exit { padding: 13px 18px; border: 1px solid var(--line-medium); border-radius: 10px; font-weight: 700; white-space: nowrap; }
  @media (max-width: 1100px) {
    .lesson-header { grid-template-columns: 1fr auto; gap: 16px 24px; }
    .goal { grid-column: 1 / -1; grid-row: 2; padding: 14px 0 0; border: 0; border-top: 1px solid var(--line-soft); }
    .progress { grid-column: 1; grid-row: 3; }
    .header-actions { grid-column: 2; grid-row: 3; }
    .track { flex: 1; width: auto; min-width: 80px; }
  }
  @media (max-width: 640px) {
    .lesson-header { min-height: auto; padding: 14px; }
    .course strong, .mark { display: none; }
    .course { min-width: 48px; }
    .goal { grid-template-columns: auto 1fr; }
    .goal p { grid-column: 1 / -1; font-size: var(--text-sm); }
    .progress { min-width: 0; }
    .track { width: min(52vw, 260px); }
    .header-actions button { display: none; }
    .exit { padding: 10px 12px; font-size: var(--text-sm); }
  }
  @media (prefers-reduced-motion: reduce) { .track span { transition: none; } }
</style>
