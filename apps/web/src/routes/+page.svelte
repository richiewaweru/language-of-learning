<script lang="ts">
  import HeroDemo from '$lib/product/HeroDemo.svelte';
  import StaticSceneFallback from '$lib/product/StaticSceneFallback.svelte';

  let { data } = $props();
</script>

<svelte:head>
  <title>Language of Learning — See what code is doing</title>
  <meta
    name="description"
    content="Language of Learning turns code into a synchronized visual model of values, decisions, state changes, and results."
  />
</svelte:head>

<section class="hero container-wide">
  <div class="hero-copy">
    <h1 class="display-heading">Learn by seeing how ideas move</h1>
    <p class="lead">
      Language of Learning turns code into a synchronized visual model of values, decisions,
      state changes, and results.
    </p>
    <p class="problem">
      Code is often taught as lines of text. But programs run as values, choices, state changes,
      and returns.
    </p>
    <div class="actions">
      <a href="/learn/python-foundations/loops/accumulate" class="btn-primary">Start learning</a>
      <a href="/learn/python-foundations/loops/accumulate" class="btn-secondary">Try the demo</a>
    </div>
    <ul class="proof-points">
      <li>Follow values as they move through code.</li>
      <li>See remembered state change step by step.</li>
      <li>Recognize reusable programming patterns.</li>
      <li>Connect every visual action to the exact line that caused it.</li>
    </ul>
  </div>
  <div class="hero-visual">
    <HeroDemo pack={data.pack} />
  </div>
</section>

<section class="section container">
  <h2 class="section-heading">Code is written in lines. Programs unfold through change.</h2>
  <div class="before-after">
    <div class="ba-col">
      <p class="eyebrow">Before</p>
      <pre class="code-only" aria-label="Code only">{data.pack.source}</pre>
      <p class="ba-caption">You can read every line and still struggle to picture the process.</p>
    </div>
    <div class="ba-col">
      <p class="eyebrow">After</p>
      <StaticSceneFallback scene={data.pack.scene} stepIndex={3} />
      <p class="ba-caption">
        Now each value, update, decision, and result has a visible place.
      </p>
    </div>
  </div>
</section>

<section class="section container">
  <h2 class="section-heading">What the learner sees</h2>
  <div class="concepts">
    <article>
      <h3>Values move</h3>
      <p>The current list item visibly travels from the collection into the operation.</p>
    </article>
    <article>
      <h3>State remembers</h3>
      <p>The running total preserves information from previous loop iterations.</p>
    </article>
    <article>
      <h3>Results exit</h3>
      <p>The completed value leaves through the return path.</p>
    </article>
  </div>
</section>

<section class="section container">
  <h2 class="section-heading">Patterns, not memorization</h2>
  <div class="pattern-cards">
    {#each [
      { slug: 'accumulate', name: 'Accumulate', desc: 'Combine information from many items into one result.', use: 'Sum a list of numbers' },
      { slug: 'count', name: 'Count', desc: 'Add one whenever an item meets a condition.', use: 'Count passing scores' },
      { slug: 'filter', name: 'Filter', desc: 'Keep only the items that pass a condition.', use: 'Keep positive values' },
      { slug: 'transform', name: 'Transform', desc: 'Produce a changed value for every input item.', use: 'Double each number' },
    ] as pattern}
      <a href="/learn/python-foundations/loops/{pattern.slug}" class="pattern-card surface-card">
        <h3>{pattern.name}</h3>
        <p>{pattern.desc}</p>
        <p class="use">{pattern.use}</p>
      </a>
    {/each}
  </div>
</section>

<section class="section container-narrow">
  <h2 class="section-heading">Why this is different</h2>
  <ul class="diff-list">
    <li>The visual follows actual execution — not a guess.</li>
    <li>Code and visuals stay synchronized step by step.</li>
    <li>Patterns transfer across renamed examples.</li>
    <li>Unsupported behavior is shown honestly.</li>
    <li>No AI is used to guess program execution.</li>
  </ul>
</section>

<section class="section container-wide dashboard-row">
  <div class="continue surface-card">
    <p class="eyebrow">Continue learning</p>
    <h2>Python Foundations</h2>
    <p>Build a Total with a Loop — accumulate pattern</p>
    <a href="/learn/python-foundations/loops/accumulate" class="btn-primary">Continue lesson</a>
  </div>
  <div class="progress-panel surface-card">
    <p class="eyebrow">Today's progress</p>
    <p class="progress-ring">80%</p>
    <p class="sub">Daily goal · 4 / 5 lessons</p>
  </div>
</section>

<section class="section container cta-section">
  <div class="cta-row">
    <a href="/learn/python-foundations" class="btn-primary">Explore Python Foundations</a>
    <a href="/decode" class="btn-secondary">Decode your code</a>
  </div>
</section>

<style>
  .hero {
    display: grid;
    gap: var(--space-8);
    padding: var(--space-9) var(--space-6) var(--space-8);
    align-items: center;
  }

  @media (min-width: 960px) {
    .hero {
      grid-template-columns: 2fr 3fr;
    }
  }

  .hero-copy h1 {
    font-family: var(--font-display);
    font-size: var(--text-3xl);
    line-height: 1.1;
    color: var(--ink-strong);
    margin: 0 0 var(--space-5);
  }

  .lead {
    font-size: var(--text-lg);
    color: var(--ink-body);
    margin: 0 0 var(--space-4);
    max-width: 42ch;
  }

  .problem {
    color: var(--ink-muted);
    margin: 0 0 var(--space-6);
    max-width: 42ch;
  }

  .actions {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-3);
    margin-bottom: var(--space-6);
  }

  .proof-points {
    margin: 0;
    padding-left: var(--space-5);
    color: var(--ink-muted);
    font-size: var(--text-sm);
  }

  .proof-points li {
    margin-bottom: var(--space-2);
  }

  .section {
    padding: var(--space-8) var(--space-6);
  }

  .before-after {
    display: grid;
    gap: var(--space-6);
  }

  @media (min-width: 768px) {
    .before-after {
      grid-template-columns: 1fr 1fr;
    }
  }

  .code-only {
    background: var(--surface-code);
    border: var(--border-w) solid var(--line-default);
    border-radius: var(--radius-panel);
    padding: var(--space-4);
    font-family: var(--font-mono);
    font-size: var(--text-sm);
    overflow-x: auto;
    margin: 0;
  }

  .ba-caption {
    font-size: var(--text-sm);
    color: var(--ink-muted);
    margin: var(--space-3) 0 0;
  }

  .concepts {
    display: grid;
    gap: var(--space-6);
  }

  @media (min-width: 768px) {
    .concepts {
      grid-template-columns: repeat(3, 1fr);
    }
  }

  .concepts h3 {
    font-size: var(--text-lg);
    margin: 0 0 var(--space-2);
    color: var(--ink-strong);
  }

  .concepts p {
    font-size: var(--text-sm);
    color: var(--ink-muted);
    margin: 0;
  }

  .pattern-cards {
    display: grid;
    gap: var(--space-4);
  }

  @media (min-width: 640px) {
    .pattern-cards {
      grid-template-columns: repeat(2, 1fr);
    }
  }

  @media (min-width: 960px) {
    .pattern-cards {
      grid-template-columns: repeat(4, 1fr);
    }
  }

  .pattern-card {
    display: block;
    padding: var(--space-5);
    background: var(--surface-paper);
    border: var(--border-w) solid var(--line-default);
    border-radius: var(--radius-panel);
    text-decoration: none;
    color: inherit;
    box-shadow: var(--shadow-sm);
  }

  .pattern-card:hover {
    border-color: var(--ink-strong);
  }

  .pattern-card h3 {
    margin: 0 0 var(--space-2);
    color: var(--ink-strong);
  }

  .pattern-card p {
    font-size: var(--text-sm);
    color: var(--ink-muted);
    margin: 0;
  }

  .pattern-card .use {
    margin-top: var(--space-3);
    font-size: var(--text-xs);
    color: var(--ink-faint);
  }

  .diff-list {
    color: var(--ink-body);
    line-height: 1.7;
  }

  .cta-section {
    text-align: center;
    padding-bottom: var(--space-10);
  }

  .cta-row {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-4);
    justify-content: center;
  }

  .dashboard-row {
    display: grid;
    gap: var(--space-5);
  }

  @media (min-width: 768px) {
    .dashboard-row {
      grid-template-columns: 2fr 1fr;
    }
  }

  .continue,
  .progress-panel {
    padding: var(--space-6);
  }

  .continue h2 {
    font-family: var(--font-display);
    margin: 0 0 var(--space-2);
    color: var(--ink-primary);
  }

  .continue p {
    color: var(--ink-secondary);
    margin: 0 0 var(--space-5);
    font-size: var(--text-sm);
  }

  .progress-ring {
    font-family: var(--font-display);
    font-size: var(--heading-xl);
    font-weight: 600;
    color: var(--state-gold);
    margin: 0 0 var(--space-2);
  }

  .sub {
    font-size: var(--text-sm);
    color: var(--ink-muted);
    margin: 0;
  }
</style>
