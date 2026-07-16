/**
 * Motion controller — the *only* place timing/easing decisions live at runtime.
 *
 * Per the motion contract (MC3 / SC1) no timing or easing may appear in scenes,
 * lessons, or content; the runtime owns 100% of it. These helpers resolve the
 * design-token timings (design-tokens.css §MOTION) and manage in-flight CSS
 * transitions. They are deliberately free of any semantic facts.
 */

/**
 * Parse a CSS time token (`"0.7s"`, `"350ms"`, `"1600ms"`) into milliseconds.
 * Returns `fallback` for empty / unparseable input. Pure + unit-testable.
 */
export function msFromCssDuration(value: string | null | undefined, fallback = 0): number {
  if (!value) return fallback;
  const trimmed = value.trim();
  const match = /^(-?[\d.]+)\s*(ms|s)?$/.exec(trimmed);
  if (!match) return fallback;
  const amount = Number.parseFloat(match[1]!);
  if (!Number.isFinite(amount)) return fallback;
  return match[2] === 's' ? amount * 1000 : amount;
}

type WindowLike = {
  matchMedia?: (query: string) => { matches: boolean };
};

/**
 * True when the environment requests reduced motion (M10). Accepts an injected
 * window-like object for testing; defaults to the global `window` when present.
 */
export function prefersReducedMotion(win?: WindowLike): boolean {
  const w = win ?? (typeof window !== 'undefined' ? (window as WindowLike) : undefined);
  if (!w?.matchMedia) return false;
  try {
    return w.matchMedia('(prefers-reduced-motion: reduce)').matches;
  } catch {
    return false;
  }
}

/**
 * Resolve a duration CSS custom property (e.g. `--t-autoplay`) to milliseconds.
 * Reads from `el` when given, otherwise `:root`. Falls back to `fallbackMs`.
 */
export function applyDuration(
  varName: string,
  fallbackMs: number,
  el?: Element | null,
): number {
  if (typeof getComputedStyle === 'undefined') return fallbackMs;
  const target =
    el ?? (typeof document !== 'undefined' ? document.documentElement : null);
  if (!target) return fallbackMs;
  const raw = getComputedStyle(target).getPropertyValue(varName);
  return msFromCssDuration(raw, fallbackMs);
}

/**
 * Cancel any in-flight CSS transition on `el` by freezing it at its current
 * computed transform for one frame, then releasing it. This is temporary,
 * render-only state — it never mutates the canonical `Selection`/`MotionState`
 * (MC2). Safe to call with `null`.
 */
export function cancelTransition(el: HTMLElement | null | undefined): void {
  if (!el || typeof getComputedStyle === 'undefined') return;
  const computed = getComputedStyle(el).transform;
  const prevTransition = el.style.transition;
  el.style.transition = 'none';
  if (computed && computed !== 'none') {
    el.style.transform = computed;
  }
  // Force a reflow so the "none" transition takes effect before we release it.
  void el.offsetWidth;
  el.style.transition = prevTransition;
}

/** Cancel transitions on every element under `root` carrying `[data-token]`. */
export function cancelAllTransitions(root: HTMLElement | null | undefined): void {
  if (!root) return;
  const nodes = root.querySelectorAll<HTMLElement>('[data-token]');
  nodes.forEach((n) => cancelTransition(n));
}
