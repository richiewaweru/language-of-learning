<script lang="ts">
</script>

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
        <a href="/learn/python-foundations/loops/accumulate">Flagship lesson</a>
        <a href="/learn/python-foundations">Python Foundations</a>
      </div>
      <div class="col">
        <p class="col-title">Explore</p>
        <a href="/decode">Decode</a>
        <a href="/library">Library</a>
        <a href="/how-it-works">How it works</a>
        <a href="/about">About</a>
      </div>
      <div class="col">
        <p class="col-title">Language of Learning</p>
        <a href="/how-it-works">How the visual model works</a>
        <a href="/about">Our learning approach</a>
        <a href="/library">Saved lessons</a>
      </div>
    </nav>
  </div>
  <p class="copyright container">Deterministic execution truth — no AI guessing.</p>
</footer>

<style>
  .footer {
    margin-top: var(--space-10);
    background: var(--surface-primary);
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
    font-family: var(--font-display);
    font-weight: 600;
    color: var(--ink-primary);
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
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--ink-faint);
    margin: 0 0 var(--space-3);
  }

  .col a {
    display: block;
    color: var(--ink-muted);
    text-decoration: none;
    font-size: var(--text-sm);
    margin-bottom: var(--space-2);
  }

  .col a:hover {
    color: var(--brand-blue);
  }

  .copyright {
    margin-top: var(--space-6);
    padding-top: var(--space-4);
    border-top: 1px solid var(--line-soft);
    font-size: var(--text-xs);
    color: var(--ink-faint);
  }
</style>
