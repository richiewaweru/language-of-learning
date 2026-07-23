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
  let predictionChoice = $state('');
  let activeMutationId = $state('');
  let productionAttempt = $state('');
  let hydrated = $state(false);

  const completedForLesson = $derived(progress.completedSteps[data.lesson.id] ?? []);
  const completedSet = $derived(new Set(completedForLesson));
  const completedCount = $derived(completedSet.size);
  const predictionStep = $derived(data.lesson.steps[2]);
  const predictionCorrect = $derived(
    predictionChoice !== '' && predictionChoice === predictionStep.correctId,
  );
  const primaryPack = $derived(data.packs[data.lesson.primaryExampleId]);
  const activeMutationPack = $derived(
    activeMutationId ? data.packs[activeMutationId] : primaryPack,
  );

  onMount(() => {
    progress = loadPilotProgress();
    progress.currentLessonId = data.lesson.id;
    predictionChoice = progress.predictionAnswers[data.lesson.id] ?? '';
    activeMutationId =
      progress.explorationExampleIds[data.lesson.id]?.at(-1) ??
      data.lesson.steps[5]?.mutationIds?.[0] ??
      '';
    productionAttempt = progress.productionAttempts[data.lesson.id] ?? '';
    hydrated = true;
    save();
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

  function markStep(index: number) {
    const completed = new Set(progress.completedSteps[data.lesson.id] ?? []);
    if (completed.has(index)) completed.delete(index);
    else completed.add(index);
    progress.completedSteps[data.lesson.id] = [...completed].sort((a, b) => a - b);
    const lessonIsComplete = completed.size === 9;
    progress.completedLessonIds = lessonIsComplete
      ? [...new Set([...progress.completedLessonIds, data.lesson.id])]
      : progress.completedLessonIds.filter((id) => id !== data.lesson.id);
    save();
  }

  function choosePrediction(id: string) {
    predictionChoice = id;
    progress.predictionAnswers[data.lesson.id] = id;
    if (id === predictionStep.correctId) {
      const completed = new Set(progress.completedSteps[data.lesson.id] ?? []);
      completed.add(2);
      progress.completedSteps[data.lesson.id] = [...completed].sort((a, b) => a - b);
    }
    save();
  }

  function chooseMutation(id: string) {
    activeMutationId = id;
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
    predictionChoice = '';
    activeMutationId = data.lesson.steps[5]?.mutationIds?.[0] ?? '';
    productionAttempt = '';
  }

  function example(id: string | undefined) {
    return id ? data.examples[id] : undefined;
  }
</script>

<div class="pilot-flow" data-testid="four-lesson-pilot" data-hydrated={hydrated}>
  <aside class="lesson-rail">
    <a class="brand" href="/learn/python-foundations">
      Lens
      <span>Python Foundations</span>
    </a>

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
          <span>
            <strong>{lesson.title}</strong>
            <small>
              {progress.completedLessonIds.includes(lesson.id)
                ? 'Complete'
                : lesson.id === data.lesson.id
                  ? 'Current lesson'
                  : lesson.summary}
            </small>
          </span>
        </a>
      {/each}
    </nav>

    <div class="step-progress">
      <div class="progress-heading">
        <strong>On this page</strong>
        <span>{completedCount}/9</span>
      </div>
      <div class="progress-bar"><span style:width={`${(completedCount / 9) * 100}%`}></span></div>
      <ol>
        {#each data.lesson.steps as step, index}
          <li>
            <a href="#step-{index + 1}" class:complete={completedSet.has(index)}>
              <span>{completedSet.has(index) ? '✓' : index + 1}</span>
              {step.title}
            </a>
          </li>
        {/each}
      </ol>
    </div>
    <button class="reset" type="button" onclick={reset} data-testid="reset-progress">
      Reset progress
    </button>
  </aside>

  <main class="lesson-flow">
    <header class="lesson-header">
      <p>Lesson {data.lesson.order} of 4 · Continuous lesson</p>
      <h1>{data.lesson.title}</h1>
      <p>{data.lesson.summary}</p>
      <div class="lesson-orientation">
        <strong>One continuous lesson</strong>
        <span>Scroll through all nine moments. Lens appears where seeing execution adds meaning.</span>
      </div>
    </header>

    {#each data.lesson.steps as step, index}
      <section
        id="step-{index + 1}"
        class="lesson-section"
        class:lens-section={index >= 3 && index <= 5}
        data-step-type={step.type}
        data-testid="pilot-step-section"
      >
        <header class="section-heading">
          <div>
            <p>0{index + 1}</p>
            <h2>{step.title}</h2>
          </div>
          <button
            type="button"
            class:complete={completedSet.has(index)}
            disabled={step.type === 'predict' && !predictionCorrect}
            onclick={() => markStep(index)}
            aria-label={`${completedSet.has(index) ? 'Unmark' : 'Mark'} ${step.title} complete`}
          >
            {completedSet.has(index) ? '✓ Complete' : 'Mark complete'}
          </button>
        </header>
        <p class="instruction">{step.instruction}</p>

        {#if step.type === 'name-it'}
          <blockquote>{data.lesson.anchorSentence}</blockquote>
        {:else if step.type === 'show-shape'}
          <div class="shape-flow">
            {#each step.shape ?? [] as item, shapeIndex}
              <span>{item}</span>
              {#if shapeIndex < (step.shape?.length ?? 0) - 1}<b>→</b>{/if}
            {/each}
          </div>
        {:else if step.type === 'predict'}
          <div class="prediction-layout">
            <div class="prediction-options">
              {#each step.options ?? [] as option}
                <button
                  type="button"
                  class:selected={predictionChoice === option.id}
                  onclick={() => choosePrediction(option.id)}
                >
                  {option.label}
                </button>
              {/each}
            </div>
            {#if predictionChoice}
              <p class:correct={predictionCorrect} class="feedback">
                {predictionCorrect
                  ? 'Correct. The syntax and embedded Lens below are now revealed.'
                  : 'That does not match the deterministic trace. Try another prediction.'}
              </p>
            {:else}
              <p class="prediction-note">
                Make a prediction before revealing the annotated execution below.
              </p>
            {/if}
          </div>
        {:else if step.type === 'map-shape-to-syntax'}
          {#if predictionCorrect}
            <div class="syntax-intro">
              <div>
                <h3>Authoritative program</h3>
                <pre><code>{example(step.exampleId)?.code}</code></pre>
                <p>
                  This code and the embedded Lens resolve from
                  <code>{step.exampleId}</code>.
                </p>
              </div>
              <div>
                <h3>What to map</h3>
                <p>
                  Read the authored explanation beside the structural view. Select trace steps to
                  connect source lines with bindings, operations, and control flow.
                </p>
              </div>
            </div>
            <div class="lens-embed" data-testid="pilot-lens-embed" data-lens-mode="syntax">
              <header>
                <div><span>Embedded Lens</span><h3>Structure beside syntax</h3></div>
                <strong>Map mode</strong>
              </header>
              <LearningInstrument pack={primaryPack} showTruthDrawer={true} autoplayAllowed={false} />
            </div>
          {:else}
            <div class="reveal-gate">
              <strong>Prediction comes first</strong>
              <p>Answer step 3 correctly to reveal this program and its structural Lens.</p>
              <a href="#step-3">Go to prediction ↑</a>
            </div>
          {/if}
        {:else if step.type === 'watch'}
          {#if predictionCorrect}
            <div class="observation-grid">
              <div>
                <h3>Watch for these moments</h3>
                <ol>
                  {#each step.trace ?? [] as observation}<li>{observation}</li>{/each}
                </ol>
              </div>
              <p>
                This is a fixed authored execution. Move through the trace and compare each visible
                state with the observation list.
              </p>
            </div>
            <div class="lens-embed" data-testid="pilot-lens-embed" data-lens-mode="watch">
              <header>
                <div><span>Embedded Lens</span><h3>Watch the canonical run</h3></div>
                <strong>Watch mode</strong>
              </header>
              <LearningInstrument pack={primaryPack} showTruthDrawer={true} autoplayAllowed={true} />
            </div>
          {:else}
            <div class="reveal-gate">
              <strong>Watch follows prediction</strong>
              <p>The deterministic run appears after the prediction in step 3.</p>
              <a href="#step-3">Go to prediction ↑</a>
            </div>
          {/if}
        {:else if step.type === 'directed-exploration'}
          {#if predictionCorrect}
            <div class="exploration-layout">
              <div>
                <h3>Choose an authored change</h3>
                <div class="mutation-picker" data-testid="pilot-mutation-picker">
                  {#each step.mutationIds ?? [] as id}
                    <button
                      type="button"
                      class:selected={activeMutationId === id}
                      onclick={() => chooseMutation(id)}
                    >
                      {data.examples[id].title}
                    </button>
                  {/each}
                </div>
              </div>
              <div class="mutation-source">
                <h3>Changed program</h3>
                <pre><code>{example(activeMutationId)?.code}</code></pre>
              </div>
            </div>
            <div class="lens-embed explore" data-testid="pilot-lens-embed" data-lens-mode="explore">
              <header>
                <div><span>Embedded Lens</span><h3>{example(activeMutationId)?.title}</h3></div>
                <strong>Explore mode</strong>
              </header>
              <LearningInstrument
                pack={activeMutationPack}
                showTruthDrawer={true}
                autoplayAllowed={true}
              />
            </div>
            <p class="scope-note">
              Explore mode intentionally offers verified mutations rather than implying arbitrary
              Python support.
            </p>
          {:else}
            <div class="reveal-gate">
              <strong>Explore after predicting</strong>
              <p>Answer step 3 to unlock the authored code variations and their Lens scenes.</p>
              <a href="#step-3">Go to prediction ↑</a>
            </div>
          {/if}
        {:else if step.type === 'vary-surface'}
          <div class="code-grid">
            {#each step.exampleIds ?? [] as id}
              <article>
                <h3>{data.examples[id].title}</h3>
                <pre><code>{data.examples[id].code}</code></pre>
              </article>
            {/each}
          </div>
        {:else if step.type === 'recognize'}
          <div class="raw-code">
            <span>Unannotated code</span>
            <pre><code>{example(step.exampleId)?.code}</code></pre>
          </div>
        {:else if step.type === 'produce'}
          <div class="production-grid">
            <div>
              <h3>Scaffold</h3>
              <pre><code>{example(step.exampleId)?.code}</code></pre>
            </div>
            <div>
              <label for="production">Your completed program</label>
              <textarea
                id="production"
                rows="10"
                value={productionAttempt}
                oninput={(event) => saveProduction(event.currentTarget.value)}
              ></textarea>
            </div>
          </div>
        {/if}
      </section>
    {/each}

    <section class="lesson-finish">
      <p>{completedCount} of 9 moments marked complete</p>
      <h2>{completedCount === 9 ? 'Lesson complete' : 'Finish when you are ready'}</h2>
      <p>Your progress, prediction, exploration choices, and production attempt are saved locally.</p>
    </section>

    <nav class="lesson-neighbors">
      {#if data.previousLessonId}
        <a href="/learn/python-foundations/{data.previousLessonId}">← Previous lesson</a>
      {/if}
      {#if data.nextLessonId}
        <a href="/learn/python-foundations/{data.nextLessonId}">Next lesson →</a>
      {/if}
    </nav>
  </main>
</div>

<style>
  :global(html) { scroll-behavior: smooth; }
  .pilot-flow { min-height: calc(100vh - 64px); display: grid; grid-template-columns: 260px minmax(0, 1fr); background: #f5f1e8; color: #18211d; }
  .lesson-rail { padding: 24px 18px; border-right: 1px solid #d9d3c5; background: #fffdf7; position: sticky; top: 0; height: 100vh; overflow-y: auto; box-sizing: border-box; }
  .brand { display: flex; flex-direction: column; color: #173f35; text-decoration: none; font-family: var(--font-display); font-size: 26px; }
  .brand span, .rail-label { font-family: var(--font-body); font-size: 11px; letter-spacing: .08em; text-transform: uppercase; color: #68736d; }
  .rail-label { margin: 28px 0 8px; }
  .lesson-list { display: grid; gap: 6px; }
  .lesson-list > a { display: grid; grid-template-columns: 26px 1fr; gap: 8px; padding: 10px; border-radius: 8px; text-decoration: none; color: inherit; border: 1px solid transparent; }
  .lesson-list > a.current { background: #e5f0e8; border-color: #94b3a3; }
  .lesson-list > a.complete > span:first-child { background: #236b54; color: white; }
  .lesson-list > a > span:first-child { display: grid; place-items: center; width: 24px; height: 24px; border-radius: 50%; background: #e9e3d6; font-size: 12px; }
  .lesson-list strong, .lesson-list small { display: block; font-size: 12px; line-height: 1.25; }
  .lesson-list small { margin-top: 3px; color: #6d756f; }
  .step-progress { margin-top: 24px; padding-top: 18px; border-top: 1px solid #ded8ca; }
  .progress-heading { display: flex; justify-content: space-between; font-size: 12px; }
  .progress-bar { height: 4px; margin: 8px 0 12px; background: #e4dfd4; }
  .progress-bar span { display: block; height: 100%; background: #d36c37; transition: width .2s; }
  .step-progress ol { list-style: none; padding: 0; margin: 0; display: grid; gap: 2px; }
  .step-progress a { display: flex; align-items: center; gap: 8px; padding: 6px; text-decoration: none; color: #5b655f; font-size: 12px; }
  .step-progress a span { display: grid; place-items: center; width: 20px; height: 20px; border-radius: 50%; background: #e8e2d6; }
  .step-progress a.complete { color: #173f35; font-weight: 700; }
  .step-progress a.complete span { background: #236b54; color: white; }
  .reset { margin-top: 18px; border: 0; background: transparent; color: #8b4930; text-decoration: underline; font-size: 12px; }
  .lesson-flow { min-width: 0; width: min(100%, 1500px); padding: 52px clamp(22px, 4vw, 64px) 90px; box-sizing: border-box; }
  .lesson-header { max-width: 920px; padding-bottom: 28px; }
  .lesson-header > p:first-child, .section-heading p { color: #9d542e; text-transform: uppercase; letter-spacing: .12em; font-size: 11px; font-weight: 700; }
  .lesson-header h1 { font-family: var(--font-display); font-size: clamp(42px, 6vw, 76px); line-height: .96; margin: 10px 0 16px; }
  .lesson-header > p:nth-child(3) { color: #5e6862; font-size: 18px; }
  .lesson-orientation { display: flex; gap: 12px; align-items: baseline; margin-top: 24px; padding: 14px 16px; border-left: 4px solid #d36c37; background: #f4e9dd; }
  .lesson-orientation span { color: #5d6661; }
  .lesson-section { scroll-margin-top: 24px; margin: 18px 0; padding: clamp(24px, 4vw, 44px); background: #fffdf8; border: 1px solid #dcd6c9; border-radius: 16px; box-shadow: 0 10px 28px rgba(42, 48, 44, .05); }
  .lesson-section.lens-section { background: #fdfdf9; border-color: #bdcec4; }
  .section-heading { display: flex; justify-content: space-between; gap: 18px; align-items: start; }
  .section-heading p { margin: 0 0 5px; }
  .section-heading h2 { font-family: var(--font-display); font-size: clamp(29px, 3vw, 42px); margin: 0; }
  .section-heading button { padding: 8px 11px; border: 1px solid #8b968f; border-radius: 999px; background: transparent; color: #526059; font-size: 11px; white-space: nowrap; }
  .section-heading button.complete { background: #236b54; border-color: #236b54; color: white; }
  .section-heading button:disabled { opacity: .45; }
  .instruction { max-width: 72ch; margin: 14px 0 25px; line-height: 1.65; color: #4e5a54; font-size: 17px; }
  blockquote { margin: 28px 0 0; padding: 24px 28px; border-left: 4px solid #d36c37; background: #f5ede2; font-family: var(--font-display); font-size: clamp(24px, 3vw, 34px); }
  .shape-flow { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
  .shape-flow span { padding: 11px 15px; border: 1px solid #8ead9d; border-radius: 999px; background: #e7f0e9; font-weight: 700; }
  .shape-flow b { color: #d36c37; }
  .prediction-layout { display: grid; grid-template-columns: minmax(280px, .8fr) minmax(280px, 1.2fr); gap: 18px; align-items: start; }
  .prediction-options, .mutation-picker { display: grid; gap: 8px; }
  .prediction-options button, .mutation-picker button { padding: 12px 14px; border: 1px solid #beb7aa; border-radius: 8px; background: white; text-align: left; }
  .prediction-options button.selected, .mutation-picker button.selected { border-color: #236b54; background: #e4f0e8; }
  .feedback, .prediction-note, .scope-note { margin: 0; padding: 15px; background: #f5e9dd; border-radius: 8px; color: #7f452c; }
  .feedback.correct, .scope-note { background: #e5f0e8; color: #235944; }
  pre { overflow: auto; padding: 18px; border-radius: 9px; background: #19221e; color: #eef4ef; line-height: 1.55; font-size: 13px; }
  .syntax-intro, .observation-grid, .exploration-layout, .production-grid { display: grid; grid-template-columns: minmax(0, 1fr) minmax(280px, .75fr); gap: 24px; }
  .syntax-intro h3, .observation-grid h3, .exploration-layout h3, .production-grid h3 { margin-top: 0; }
  .syntax-intro p, .observation-grid p { line-height: 1.65; color: #526059; }
  .observation-grid ol { line-height: 1.8; }
  .lens-embed { margin-top: 28px; padding: 18px; border: 1px solid #a8c0b3; border-radius: 14px; background: #edf2ed; }
  .lens-embed.explore { border-color: #d3ae94; background: #f5ece4; }
  .lens-embed > header { display: flex; justify-content: space-between; align-items: start; gap: 16px; margin-bottom: 14px; }
  .lens-embed header span { text-transform: uppercase; letter-spacing: .11em; font-size: 10px; color: #5c7065; }
  .lens-embed header h3 { margin: 4px 0 0; font-family: var(--font-display); font-size: 25px; }
  .lens-embed header strong { padding: 6px 9px; border-radius: 999px; background: #dbe9df; color: #235944; font-size: 11px; white-space: nowrap; }
  .explore header strong { background: #eed8c7; color: #87482d; }
  .reveal-gate { padding: 28px; border: 1px dashed #a69e8f; border-radius: 11px; background: #f6f1e8; text-align: center; }
  .reveal-gate strong { font-family: var(--font-display); font-size: 24px; }
  .reveal-gate p { color: #626b66; }
  .reveal-gate a { color: #235944; font-weight: 700; }
  .mutation-source pre { max-height: 330px; }
  .scope-note { margin-top: 14px; }
  .code-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 14px; }
  .code-grid article { min-width: 0; }
  .code-grid h3 { font-size: 15px; }
  .raw-code > span { display: inline-block; padding: 5px 8px; background: #e8e2d6; border-radius: 5px; font-size: 11px; text-transform: uppercase; letter-spacing: .08em; }
  textarea { width: 100%; min-height: 230px; margin-top: 8px; padding: 14px; border: 1px solid #aaa496; border-radius: 8px; font-family: monospace; box-sizing: border-box; }
  .lesson-finish { margin-top: 24px; padding: 32px; border-radius: 14px; background: #173f35; color: white; }
  .lesson-finish h2 { font-family: var(--font-display); font-size: 35px; margin: 6px 0; }
  .lesson-finish p { margin: 5px 0; color: #d9e6df; }
  .lesson-neighbors { display: flex; justify-content: space-between; margin-top: 26px; }
  .lesson-neighbors a { color: #235944; font-weight: 700; }
  @media (max-width: 1050px) {
    .pilot-flow { grid-template-columns: 225px minmax(0, 1fr); }
    .lesson-flow { padding-inline: 24px; }
    .syntax-intro, .observation-grid, .exploration-layout, .production-grid { grid-template-columns: 1fr; }
  }
  @media (max-width: 760px) {
    .pilot-flow { display: block; }
    .lesson-rail { position: static; height: auto; border-right: 0; }
    .lesson-list { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    .step-progress ol { grid-template-columns: repeat(3, minmax(0, 1fr)); }
    .lesson-flow { padding: 28px 14px 60px; }
    .lesson-section { padding: 24px 18px; }
    .prediction-layout, .code-grid { grid-template-columns: 1fr; }
    .section-heading { align-items: center; }
    .lesson-orientation { display: grid; }
    .lens-embed { padding: 10px; margin-inline: -8px; }
  }
</style>
