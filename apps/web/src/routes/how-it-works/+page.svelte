<svelte:head>
  <title>How it works — Language of Learning</title>
</svelte:head>

<article class="page container-narrow">
  <h1>How it works</h1>
  <p class="lead">
    Language of Learning converts supported Python functions into a deterministic visual model.
    Every value, branch, and state change you see comes from real execution — not animation guesswork.
  </p>

  <h2>The pipeline</h2>
  <pre class="pipeline">SOURCE
  → SEMANTIC GRAPH
  → EXECUTION TRACE
  → PATTERN
  → SCENE ACTIONS
  → MOTION STATE
  → RENDERER</pre>

  <h2>What is supported today</h2>
  <ul>
    <li>Single functions with simple loops over collections</li>
    <li>Accumulate, count, filter, and transform patterns</li>
    <li>Literal arguments only (no user input at runtime)</li>
    <li>Deterministic captions derived from trace values</li>
  </ul>

  <h2>What is not supported yet</h2>
  <ul>
    <li>Trees, graphs, linked lists, recursion, dynamic programming</li>
    <li>Whole-repository analysis</li>
    <li>AI-generated execution explanations</li>
  </ul>

  <h2>Developer tools</h2>
  <p>For technical inspection:</p>
  <ul>
    <li><a href="/debug/graph">Graph inspector</a> — view semantic graph JSON</li>
    <li><a href="/slices/accumulate">Accumulate slice</a> — pattern variation playground</li>
    <li><a href="/slices/filter">Filter slice</a> — filter variation playground</li>
    <li><a href="/decode">Decode</a> — paste and analyze supported snippets</li>
  </ul>
</article>

<style>
  .page {
    padding: var(--space-8) var(--space-6) var(--space-10);
  }

  h1 {
    font-family: var(--font-display);
    font-size: var(--text-2xl);
    margin: 0 0 var(--space-4);
  }

  .lead {
    font-size: var(--text-lg);
    color: var(--ink-body);
    line-height: 1.6;
  }

  h2 {
    font-size: var(--text-xl);
    margin: var(--space-8) 0 var(--space-3);
  }

  .pipeline {
    background: var(--surface-code);
    padding: var(--space-4);
    border-radius: var(--radius-sm);
    font-family: var(--font-mono);
    font-size: var(--text-sm);
    overflow-x: auto;
  }

  ul {
    line-height: 1.7;
    color: var(--ink-body);
  }

  a {
    color: var(--ink-strong);
  }
</style>
