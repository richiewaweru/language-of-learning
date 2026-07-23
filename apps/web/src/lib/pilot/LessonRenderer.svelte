<script lang="ts">
  import { onMount } from 'svelte';
  import LearningInstrument from '$lib/product/LearningInstrument.svelte';
  import {
    emptyProgress,
    loadPilotProgress,
    resetPilotProgress,
    savePilotProgress,
    type PilotProgress,
  } from './progress';

  let { data } = $props();
  let progress = $state<PilotProgress>(emptyProgress());
  let activeStep = $state(0);
  let activeExampleId = $state('');
  let predictionChoice = $state('');
  let predictionChecked = $state(false);
  let productionAttempt = $state('');
  let hydrated = $state(false);

  const completedForLesson = $derived(progress.completedSteps[data.lesson.id] ?? []);
  const completedSet = $derived(new Set(completedForLesson));
  const selectedStep = $derived(data.lesson.steps[activeStep]);
  const activeDefinition = $derived(data.examples[activeExampleId]);
  const activePack = $derived(data.packs[activeExampleId]);
  const completedCount = $derived(completedSet.size);
  const maxUnlocked = $derived.by(() => {
    for (let index = 0; index < 9; index += 1) {
      if (!completedSet.has(index)) return index;
    }
    return 8;
  });

  onMount(() => {
    progress = loadPilotProgress();
    activeExampleId = data.lesson.primaryExampleId;
    progress.currentLessonId = data.lesson.id;
    predictionChoice = progress.predictionAnswers[data.lesson.id] ?? '';
    predictionChecked = Boolean(predictionChoice);
    productionAttempt = progress.productionAttempts[data.lesson.id] ?? '';
    hydrated = true;
    save();
  });

  $effect(() => {
    const step = data.lesson.steps[activeStep];
    if (step?.type !== 'directed-exploration') {
      activeExampleId = step?.exampleId ?? data.lesson.primaryExampleId;
    }
  });

  function save() {
    progress = savePilotProgress({
      ...progress,
      completedLessonIds: [...progress.completedLessonIds],
      completedSteps: { ...progress.completedSteps },
      predictionAnswers: { ...progress.predictionAnswers },
      explorationExampleIds: { ...progress.explorationExampleIds },
      productionAttempts: { ...progress.productionAttempts },
    });
  }

  function completeStep(index = activeStep) {
    const completed = new Set(progress.completedSteps[data.lesson.id] ?? []);
    completed.add(index);
    progress.completedSteps[data.lesson.id] = [...completed].sort((a, b) => a - b);
    if (completed.size === 9 && !progress.completedLessonIds.includes(data.lesson.id)) {
      progress.completedLessonIds.push(data.lesson.id);
    }
    save();
    if (index < 8) activeStep = index + 1;
  }

  function choosePrediction(id: string) {
    predictionChoice = id;
    predictionChecked = true;
    progress.predictionAnswers[data.lesson.id] = id;
    save();
  }

  function chooseMutation(id: string) {
    activeExampleId = id;
    const explored = new Set(progress.explorationExampleIds[data.lesson.id] ?? []);
    explored.add(id);
    progress.explorationExampleIds[data.lesson.id] = [...explored];
    save();
  }

  function saveProduction(value: string) {
    productionAttempt = value;
    progress.productionAttempts[data.lesson.id] = value;
    save();
  }

  function reset() {
    progress = resetPilotProgress();
    activeStep = 0;
    activeExampleId = data.lesson.primaryExampleId;
    predictionChoice = '';
    predictionChecked = false;
    productionAttempt = '';
  }

  function exampleForStep() {
    const id = selectedStep?.exampleId;
    return id ? data.examples[id] : undefined;
  }
</script>

<div class="pilot-shell" data-testid="four-lesson-pilot" data-hydrated={hydrated}>
  <aside class="lesson-rail">
    <a class="brand" href="/learn/python-foundations">Lens <span>Python Foundations</span></a>
    <p class="rail-label">Four-lesson pilot</p>
    <nav class="lesson-list" aria-label="Lessons">
      {#each data.lessons as lesson}
        <a
          href="/learn/python-foundations/{lesson.id}"
          class:current={lesson.id === data.lesson.id}
          class:complete={progress.completedLessonIds.includes(lesson.id)}
          data-testid="pilot-lesson-link"
        >
          <span>{lesson.order}</span>
          <span><strong>{lesson.title}</strong><small>{progress.completedLessonIds.includes(lesson.id) ? 'Complete' : lesson.id === data.lesson.id ? 'Current lesson' : lesson.summary}</small></span>
        </a>
      {/each}
    </nav>

    <div class="step-progress">
      <div class="progress-heading"><strong>Lesson progress</strong><span>{completedCount}/9</span></div>
      <div class="progress-bar"><span style:width={`${(completedCount / 9) * 100}%`}></span></div>
      <ol>
        {#each data.lesson.steps as step, index}
          <li>
            <button
              type="button"
              class:active={activeStep === index}
              class:complete={completedSet.has(index)}
              onclick={() => (activeStep = index)}
              disabled={index > maxUnlocked}
              data-testid="pilot-step-button"
            >
              <span>{completedSet.has(index) ? '✓' : index + 1}</span>{step.title}
            </button>
          </li>
        {/each}
      </ol>
    </div>
    <button class="reset" type="button" onclick={reset} data-testid="reset-progress">Reset progress</button>
  </aside>

  <main class="lesson-column">
    <header class="lesson-header">
      <p>Lesson {data.lesson.order} of 4 · Step {activeStep + 1} of 9</p>
      <h1>{data.lesson.title}</h1>
      <p>{data.lesson.summary}</p>
    </header>

    <section class="step-card" data-step-type={selectedStep.type} data-testid="pilot-active-step">
      <p class="step-number">0{activeStep + 1}</p>
      <h2>{selectedStep.title}</h2>
      <p class="instruction">{selectedStep.instruction}</p>

      {#if selectedStep.type === 'name-it'}
        <blockquote>{data.lesson.anchorSentence}</blockquote>
      {:else if selectedStep.type === 'show-shape'}
        <div class="shape-flow">
          {#each selectedStep.shape ?? [] as item, index}
            <span>{item}</span>{#if index < (selectedStep.shape?.length ?? 0) - 1}<b>→</b>{/if}
          {/each}
        </div>
      {:else if selectedStep.type === 'predict'}
        <div class="prediction-options">
          {#each selectedStep.options ?? [] as option}
            <button
              type="button"
              class:selected={predictionChoice === option.id}
              onclick={() => choosePrediction(option.id)}
            >{option.label}</button>
          {/each}
        </div>
        {#if predictionChecked}
          <p class:correct={predictionChoice === selectedStep.correctId} class="feedback">
            {predictionChoice === selectedStep.correctId
              ? 'That prediction is correct. You can reveal the syntax next.'
              : 'That route does not match the deterministic trace. Try again before moving on.'}
          </p>
        {/if}
      {:else if selectedStep.type === 'map-shape-to-syntax'}
        <pre><code>{exampleForStep()?.code}</code></pre>
        <p class="sync-note">This code and the Lens workspace resolve from example <code>{selectedStep.exampleId}</code>.</p>
      {:else if selectedStep.type === 'watch'}
        <ol class="trace-list">
          {#each selectedStep.trace ?? [] as observation}<li>{observation}</li>{/each}
        </ol>
        <p class="mode-note">Watch mode is a fixed authored execution. Choose the next step to make supported changes.</p>
      {:else if selectedStep.type === 'directed-exploration'}
        <div class="mutation-picker">
          {#each selectedStep.mutationIds ?? [] as id}
            <button type="button" class:selected={activeExampleId === id} onclick={() => chooseMutation(id)}>
              {data.examples[id].title}
            </button>
          {/each}
        </div>
        <p class="mode-note">Explore mode offers authored mutations only; arbitrary Python is not implied.</p>
      {:else if selectedStep.type === 'vary-surface'}
        <div class="code-grid">
          {#each selectedStep.exampleIds ?? [] as id}
            <article><h3>{data.examples[id].title}</h3><pre><code>{data.examples[id].code}</code></pre></article>
          {/each}
        </div>
      {:else if selectedStep.type === 'recognize'}
        <div class="raw-code">
          <span>Unannotated code</span>
          <pre><code>{exampleForStep()?.code}</code></pre>
        </div>
      {:else if selectedStep.type === 'produce'}
        <pre><code>{exampleForStep()?.code}</code></pre>
        <label for="production">Your completed program</label>
        <textarea id="production" rows="9" value={productionAttempt} oninput={(event) => saveProduction(event.currentTarget.value)}></textarea>
      {/if}

      <div class="step-actions">
        {#if activeStep > 0}<button type="button" class="secondary" onclick={() => (activeStep -= 1)}>Previous step</button>{/if}
        <button
          type="button"
          onclick={() => completeStep()}
          disabled={selectedStep.type === 'predict' && predictionChoice !== selectedStep.correctId}
          data-testid="complete-step"
        >{activeStep === 8 ? 'Complete lesson' : 'Complete & continue'}</button>
      </div>
    </section>

    <nav class="lesson-neighbors">
      {#if data.previousLessonId}<a href="/learn/python-foundations/{data.previousLessonId}">← Previous lesson</a>{/if}
      {#if data.nextLessonId}<a href="/learn/python-foundations/{data.nextLessonId}">Next lesson →</a>{/if}
    </nav>
  </main>

  <aside class="lens-workspace" data-mode={selectedStep.type === 'directed-exploration' ? 'explore' : 'watch'} data-testid="pilot-lens-workspace">
    <header>
      <div>
        <p>Lens workspace</p>
        <h2>{activeDefinition?.title ?? 'Lesson workspace'}</h2>
      </div>
      <span>{selectedStep.type === 'directed-exploration' ? 'Explore mode' : 'Watch mode'}</span>
    </header>
    {#if activePack && activeStep >= 3 && activeStep <= 5}
      <LearningInstrument pack={activePack} showTruthDrawer={true} />
    {:else}
      <div class="workspace-placeholder">
        <strong>{activeStep < 3 ? 'Predict before reveal' : 'Lens is linked during steps 4–6'}</strong>
        <p>{activeStep < 3 ? 'The executable scene stays hidden until you have named the shape and made a prediction.' : 'Return to syntax, watch, or exploration to inspect the deterministic scene.'}</p>
      </div>
    {/if}
  </aside>
</div>

<style>
  .pilot-shell { min-height: calc(100vh - 64px); display: grid; grid-template-columns: 260px minmax(440px, 0.85fr) minmax(520px, 1.15fr); background: #f5f1e8; color: #18211d; }
  .lesson-rail { padding: 24px 18px; border-right: 1px solid #d9d3c5; background: #fffdf7; position: sticky; top: 0; height: 100vh; overflow-y: auto; }
  .brand { display: flex; flex-direction: column; color: #173f35; text-decoration: none; font-family: var(--font-display); font-size: 26px; }
  .brand span, .rail-label { font-family: var(--font-body); font-size: 11px; letter-spacing: .08em; text-transform: uppercase; color: #68736d; }
  .rail-label { margin: 28px 0 8px; }
  .lesson-list { display: grid; gap: 6px; }
  .lesson-list a { display: grid; grid-template-columns: 26px 1fr; gap: 8px; padding: 10px; border-radius: 8px; text-decoration: none; color: inherit; border: 1px solid transparent; }
  .lesson-list a.current { background: #e5f0e8; border-color: #94b3a3; }
  .lesson-list a.complete > span:first-child { background: #236b54; color: white; }
  .lesson-list a > span:first-child { display: grid; place-items: center; width: 24px; height: 24px; border-radius: 50%; background: #e9e3d6; font-size: 12px; }
  .lesson-list strong, .lesson-list small { display: block; font-size: 12px; line-height: 1.25; }
  .lesson-list small { margin-top: 3px; color: #6d756f; }
  .step-progress { margin-top: 24px; padding-top: 18px; border-top: 1px solid #ded8ca; }
  .progress-heading { display: flex; justify-content: space-between; font-size: 12px; }
  .progress-bar { height: 4px; margin: 8px 0 12px; background: #e4dfd4; }
  .progress-bar span { display: block; height: 100%; background: #d36c37; transition: width .2s; }
  .step-progress ol { list-style: none; padding: 0; margin: 0; display: grid; gap: 2px; }
  .step-progress button { width: 100%; display: flex; align-items: center; gap: 8px; padding: 6px; border: 0; background: transparent; text-align: left; color: #5b655f; font-size: 12px; }
  .step-progress button span { display: grid; place-items: center; width: 20px; height: 20px; border-radius: 50%; background: #e8e2d6; }
  .step-progress button.active { color: #173f35; font-weight: 700; }
  .step-progress button.complete span { background: #236b54; color: white; }
  .step-progress button:disabled { opacity: .45; cursor: not-allowed; }
  .reset { margin-top: 18px; border: 0; background: transparent; color: #8b4930; text-decoration: underline; font-size: 12px; }
  .lesson-column { padding: 42px 36px 72px; min-width: 0; }
  .lesson-header p:first-child, .step-number { color: #9d542e; text-transform: uppercase; letter-spacing: .12em; font-size: 11px; font-weight: 700; }
  .lesson-header h1 { font-family: var(--font-display); font-size: clamp(34px, 4vw, 54px); line-height: 1; margin: 8px 0 12px; }
  .lesson-header > p:last-child { color: #5e6862; }
  .step-card { margin-top: 30px; padding: 30px; background: #fffdf8; border: 1px solid #dcd6c9; border-radius: 14px; box-shadow: 0 10px 28px rgba(42, 48, 44, .06); }
  .step-card h2 { font-family: var(--font-display); font-size: 30px; margin: 4px 0 10px; }
  .instruction { max-width: 60ch; line-height: 1.65; color: #4e5a54; }
  blockquote { margin: 28px 0; padding: 22px; border-left: 4px solid #d36c37; background: #f5ede2; font-family: var(--font-display); font-size: 24px; }
  .shape-flow { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; margin: 26px 0; }
  .shape-flow span { padding: 10px 14px; border: 1px solid #8ead9d; border-radius: 999px; background: #e7f0e9; font-weight: 700; }
  .shape-flow b { color: #d36c37; }
  .prediction-options, .mutation-picker { display: grid; gap: 8px; margin: 22px 0; }
  .prediction-options button, .mutation-picker button { padding: 12px 14px; border: 1px solid #beb7aa; border-radius: 8px; background: white; text-align: left; }
  .prediction-options button.selected, .mutation-picker button.selected { border-color: #236b54; background: #e4f0e8; }
  .feedback, .mode-note, .sync-note { padding: 12px; background: #f5e9dd; border-radius: 7px; color: #7f452c; }
  .feedback.correct, .mode-note { background: #e5f0e8; color: #235944; }
  pre { overflow: auto; padding: 18px; border-radius: 9px; background: #19221e; color: #eef4ef; line-height: 1.55; font-size: 13px; }
  .trace-list { line-height: 1.8; }
  .code-grid { display: grid; gap: 14px; }
  .code-grid article { min-width: 0; }
  .code-grid h3 { font-size: 14px; }
  .raw-code > span { display: inline-block; padding: 5px 8px; background: #e8e2d6; border-radius: 5px; font-size: 11px; text-transform: uppercase; letter-spacing: .08em; }
  textarea { width: 100%; margin-top: 8px; padding: 14px; border: 1px solid #aaa496; border-radius: 8px; font-family: monospace; box-sizing: border-box; }
  .step-actions { display: flex; justify-content: flex-end; gap: 10px; margin-top: 24px; }
  .step-actions button { padding: 11px 16px; border: 1px solid #173f35; border-radius: 7px; background: #173f35; color: white; }
  .step-actions button.secondary { margin-right: auto; background: transparent; color: #173f35; }
  .step-actions button:disabled { opacity: .45; }
  .lesson-neighbors { display: flex; justify-content: space-between; margin-top: 22px; }
  .lesson-neighbors a { color: #235944; }
  .lens-workspace { padding: 28px 24px 70px; border-left: 1px solid #d3cec2; background: #eef1eb; min-width: 0; overflow-x: hidden; }
  .lens-workspace > header { display: flex; justify-content: space-between; gap: 12px; align-items: start; margin-bottom: 16px; }
  .lens-workspace header p { margin: 0; text-transform: uppercase; letter-spacing: .1em; font-size: 10px; color: #65726b; }
  .lens-workspace header h2 { margin: 4px 0; font-family: var(--font-display); }
  .lens-workspace header > span { padding: 6px 9px; border-radius: 999px; background: #dce8df; color: #235944; font-size: 11px; font-weight: 700; white-space: nowrap; }
  .lens-workspace[data-mode='explore'] header > span { background: #f2dfcf; color: #8b4930; }
  .workspace-placeholder { margin-top: 28px; padding: 32px; border: 1px dashed #9ca89f; border-radius: 12px; text-align: center; color: #5c6861; }
  @media (max-width: 1180px) {
    .pilot-shell { grid-template-columns: 230px 1fr; }
    .lens-workspace { grid-column: 2; border-left: 0; border-top: 1px solid #d3cec2; }
  }
  @media (max-width: 760px) {
    .pilot-shell { display: block; }
    .lesson-rail { position: static; height: auto; border-right: 0; }
    .lesson-list { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    .step-progress ol { grid-template-columns: repeat(3, minmax(0, 1fr)); }
    .lesson-column, .lens-workspace { padding: 24px 16px 48px; }
    .step-card { padding: 22px 18px; }
  }
</style>
