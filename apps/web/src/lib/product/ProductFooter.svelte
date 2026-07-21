<footer class="footer">
  <div class="footer-inner container">
    <div class="footer-brand">
      <p class="name">Language of Learning</p>
      <p class="tagline">See what code is doing, not just what it says.</p>
    </div>
    <nav class="footer-nav" aria-label="Footer">
      <div class="col">
        <p class="col-title">Learn</p>
        <a href="/learn">Pathways</a>
        <a href="/demo">Flagship demo</a>
        <a href="/learn/how-loops-build-results">How loops build results</a>
      </div>
      <div class="col">
        <p class="col-title">Explore</p>
        <a href="/decode">Try your code</a>
        <a href="/how-it-works">How it works</a>
        <a href="/about">About</a>
      </div>
      <div class="col">
        <p class="col-title">Developer tools</p>
        <a href="/debug/graph">Graph inspector</a>
        <a href="/slices/accumulate">Accumulate slice</a>
        <a href="/slices/filter">Filter slice</a>
      </div>
    </nav>
  </div>
  <p class="copyright container">Deterministic execution truth — no AI guessing.</p>
</footer>

<style>
  .footer {
    margin-top: var(--space-10);
    background: var(--surface-paper);
    border-top: 1px solid var(--line-soft);
    padding: var(--space-8) 0 var(--space-6);
  }

  .footer-inner {
    display: grid;
    gap: var(--space-8);
  }

  @media (min-width: 768px) {
    .footer-inner {
      grid-template-columns: 1fr 2fr;
    }
  }

  .name {
    font-weight: 700;
    color: var(--ink-strong);
    margin: 0 0 var(--space-2);
  }

  .tagline {
    color: var(--ink-muted);
    font-size: var(--text-sm);
    margin: 0;
    max-width: 28ch;
  }

  .footer-nav {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
    gap: var(--space-6);
  }

  .col-title {
    font: var(--eyebrow);
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--ink-faint);
    margin: 0 0 var(--space-3);
    font-size: 11px;
  }

  .col a {
    display: block;
    color: var(--ink-muted);
    text-decoration: none;
    font-size: var(--text-sm);
    margin-bottom: var(--space-2);
  }

  .col a:hover {
    color: var(--ink-strong);
  }

  .copyright {
    margin-top: var(--space-6);
    padding-top: var(--space-4);
    border-top: 1px solid var(--line-soft);
    font-size: var(--text-xs);
    color: var(--ink-faint);
  }
</style>
