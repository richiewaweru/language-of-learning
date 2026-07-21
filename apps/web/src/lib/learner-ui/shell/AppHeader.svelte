<script lang="ts">
  import { page } from '$app/stores';

  const navItems = [
    { href: '/learn', label: 'Learn' },
    { href: '/decode', label: 'Decode' },
    { href: '/library', label: 'Library' },
  ];

  function isActive(href: string, pathname: string): boolean {
    if (href === '/learn') return pathname.startsWith('/learn');
    return pathname === href || pathname.startsWith(href + '/');
  }
</script>

<header class="header">
  <div class="header-inner container-wide">
    <a href="/" class="brand" aria-label="Language of Learning home">
      <span class="logo" aria-hidden="true">LL</span>
      <span class="brand-text">Language of Learning</span>
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

    <label class="search">
      <span aria-hidden="true">⌕</span>
      <input type="search" aria-label="Search lessons and concepts" placeholder="Search lessons, concepts, code…" />
    </label>

    <div class="header-end">
      <div class="progress-cluster" aria-label="Learning progress">
        <span class="stat">
          <span class="stat-icon" aria-hidden="true">🔥</span>
          <span class="stat-label">7 day streak</span>
        </span>
        <span class="stat">
          <span class="stat-icon gold" aria-hidden="true">★</span>
          <span class="stat-label">1,250 XP</span>
        </span>
        <button type="button" class="profile" aria-label="Profile menu">
          <span class="avatar">A</span>
          <span class="profile-name">Avery</span>
        </button>
      </div>
      <a href="/learn/python-foundations/loops/accumulate" class="cta btn-primary mobile-cta">
        Continue
      </a>
      <details class="mobile-menu">
        <summary aria-label="Open navigation menu">Menu</summary>
        <nav aria-label="Mobile navigation">
          {#each navItems as item}<a href={item.href}>{item.label}</a>{/each}
        </nav>
      </details>
    </div>
  </div>
</header>

<style>
  .header {
    position: sticky;
    top: 0;
    z-index: 100;
    background: var(--surface-primary);
    border-bottom: 1px solid var(--line-soft);
    box-shadow: var(--shadow-sm);
  }

  .header-inner {
    display: flex;
    align-items: center;
    gap: var(--space-4);
    padding: var(--space-3) var(--space-6);
    min-height: 64px;
  }

  .brand {
    display: flex;
    align-items: center;
    gap: var(--space-3);
    text-decoration: none;
    color: var(--ink-primary);
    margin-right: auto;
  }

  .logo {
    display: grid;
    place-items: center;
    width: 36px;
    height: 36px;
    border-radius: var(--radius-sm);
    background: linear-gradient(135deg, var(--brand-blue), var(--work-purple));
    color: white;
    font-weight: 700;
    font-size: 13px;
  }

  .brand-text {
    font-family: var(--font-display);
    font-weight: 600;
    font-size: var(--text-md);
    white-space: nowrap;
  }

  .nav {
    display: none;
    gap: var(--space-6);
  }

  .nav a {
    color: var(--ink-muted);
    text-decoration: none;
    font-size: var(--text-sm);
    font-weight: 500;
    padding-bottom: 2px;
    border-bottom: 2px solid transparent;
  }

  .nav a:hover,
  .nav a.active {
    color: var(--ink-primary);
  }

  .nav a.active {
    border-bottom-color: var(--brand-blue);
  }

  .header-end {
    display: flex;
    align-items: center;
    gap: var(--space-4);
  }

  .search {
    display: none;
    align-items: center;
    gap: var(--space-2);
    width: min(300px, 22vw);
    padding: var(--space-2) var(--space-3);
    border: 1px solid var(--line-soft);
    border-radius: var(--radius-sm);
    background: var(--surface-soft);
    color: var(--ink-muted);
  }

  .search input {
    width: 100%;
    border: 0;
    outline: 0;
    background: transparent;
    color: var(--ink-primary);
    font: inherit;
    font-size: var(--text-xs);
  }

  .progress-cluster {
    display: none;
    align-items: center;
    gap: var(--space-4);
  }

  .stat {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    font-size: var(--text-xs);
    color: var(--ink-secondary);
  }

  .stat-icon.gold {
    color: var(--state-gold);
  }

  .profile {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    background: none;
    border: none;
    cursor: pointer;
    padding: 0;
  }

  .avatar {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    background: var(--brand-blue-soft);
    color: var(--brand-blue);
    display: grid;
    place-items: center;
    font-weight: 600;
    font-size: var(--text-sm);
  }

  .profile-name {
    font-size: var(--text-sm);
    color: var(--ink-primary);
    display: none;
  }

  .mobile-cta {
    display: none;
    padding: var(--space-2) var(--space-4);
    font-size: var(--text-xs);
  }

  @media (min-width: 480px) and (max-width: 767px) {
    .mobile-cta { display: inline-flex; }
  }

  .mobile-menu {
    position: relative;
  }

  .mobile-menu summary {
    cursor: pointer;
    color: var(--ink-primary);
    font-size: var(--text-sm);
    font-weight: 600;
  }

  .mobile-menu nav {
    position: absolute;
    right: 0;
    top: calc(100% + var(--space-3));
    display: grid;
    min-width: 160px;
    padding: var(--space-2);
    border: 1px solid var(--line-soft);
    border-radius: var(--radius-sm);
    background: var(--surface-primary);
    box-shadow: var(--shadow-md);
  }

  .mobile-menu nav a {
    padding: var(--space-3);
    color: var(--ink-primary);
    text-decoration: none;
  }

  @media (min-width: 768px) {
    .nav {
      display: flex;
    }

    .progress-cluster {
      display: flex;
    }

    .profile-name {
      display: inline;
    }

    .mobile-cta {
      display: none;
    }

    .mobile-menu { display: none; }
  }

  @media (min-width: 1180px) {
    .search { display: flex; }
  }
</style>
