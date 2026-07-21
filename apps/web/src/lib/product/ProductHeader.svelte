<script lang="ts">
  import { page } from '$app/stores';

  const navItems = [
    { href: '/learn', label: 'Learn' },
    { href: '/decode', label: 'Try Your Code' },
    { href: '/how-it-works', label: 'How It Works' },
    { href: '/about', label: 'About' },
  ];

  function isActive(href: string, pathname: string): boolean {
    if (href === '/learn') return pathname.startsWith('/learn');
    return pathname === href || pathname.startsWith(href + '/');
  }
</script>

<header class="header">
  <div class="header-inner container">
    <a href="/" class="brand" aria-label="Language of Learning home">
      Language of Learning
    </a>
    <nav class="nav" aria-label="Primary">
      {#each navItems as item}
        <a
          href={item.href}
          class:active={isActive(item.href, $page.url.pathname)}
          aria-current={isActive(item.href, $page.url.pathname) ? 'page' : undefined}
        >
          {item.label}
        </a>
      {/each}
    </nav>
    <a href="/demo" class="cta btn-primary">Watch demo</a>
  </div>
</header>

<style>
  .header {
    position: sticky;
    top: 0;
    z-index: 100;
    background: var(--surface-paper);
    border-bottom: 1px solid var(--line-soft);
    box-shadow: var(--shadow-xs);
  }

  .header-inner {
    display: flex;
    align-items: center;
    gap: var(--space-4);
    padding: var(--space-3) var(--space-6);
    min-height: 56px;
  }

  .brand {
    font-weight: 700;
    font-size: var(--text-md);
    color: var(--ink-strong);
    text-decoration: none;
    white-space: nowrap;
    margin-right: auto;
  }

  .nav {
    display: none;
    gap: var(--space-5);
  }

  .nav a {
    color: var(--ink-muted);
    text-decoration: none;
    font-size: var(--text-sm);
    font-weight: 500;
  }

  .nav a:hover,
  .nav a.active {
    color: var(--ink-strong);
  }

  .nav a.active {
    text-decoration: underline;
    text-underline-offset: 4px;
  }

  .cta {
    font-size: var(--text-xs);
    padding: var(--space-2) var(--space-4);
  }

  @media (min-width: 768px) {
    .nav {
      display: flex;
    }
  }

  @media (max-width: 767px) {
    .header-inner {
      flex-wrap: wrap;
    }

    .cta {
      margin-left: auto;
    }
  }
</style>
