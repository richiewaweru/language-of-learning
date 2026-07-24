import { expect, test, type Page } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import {
  expectNoBrowserFailures,
  monitorBrowserFailures,
} from './browser-failures';

const evidenceRoot = path.resolve('output/playwright/lesson-integrated-lens');

test.beforeAll(async () => {
  await mkdir(evidenceRoot, { recursive: true });
});

async function openLesson(page: Page) {
  await page.goto('/learn/python-foundations/values-and-variables');
  await expect(page.getByTestId('phase-2-lesson-player')).toBeVisible();
  await expect(page.getByTestId('lesson-hydrating')).toHaveCount(0, { timeout: 30_000 });
}

async function selectSection(page: Page, name: RegExp) {
  await page.getByTestId('lesson-progress-rail').getByRole('button', { name }).click();
}

test.beforeEach(async ({ page }) => {
  monitorBrowserFailures(page);
  await openLesson(page);
});

test.afterEach(async ({ page }) => {
  expectNoBrowserFailures(page);
});

test('authored cues control availability while focus remains learner-controlled', async ({ page }) => {
  const layout = page.getByTestId('lesson-layout');
  const launcher = page.getByTestId('open-lesson-lens');

  await expect(layout).toHaveAttribute('data-lens-display-mode', 'closed');
  await expect(launcher).toBeDisabled();

  await selectSection(page, /Read an assignment/);
  await expect(layout).toHaveAttribute('data-lens-display-mode', 'open');
  await expect(page.getByTestId('lesson-context-panel')).toBeVisible();

  await selectSection(page, /Build a calculation/);
  await expect(page.getByTestId('lesson-lens-region')).toHaveAttribute('data-presentation', 'focus');
  await expect(layout).toHaveAttribute('data-lens-display-mode', 'open');

  await page.getByRole('button', { name: 'Focus Lens' }).click();
  await expect(layout).toHaveAttribute('data-lens-display-mode', 'focus');
  await page.keyboard.press('Escape');
  await expect(layout).toHaveAttribute('data-lens-display-mode', 'open');
  await page.keyboard.press('Escape');
  await expect(layout).toHaveAttribute('data-lens-display-mode', 'closed');
  await expect(launcher).toBeFocused();

  await launcher.click();
  await expect(layout).toHaveAttribute('data-lens-display-mode', 'open');
});

test('closing and reopening preserves Lens state and lesson scroll position', async ({ page }) => {
  await selectSection(page, /Read an assignment/);
  const layout = page.getByTestId('lesson-layout');
  const lens = page.getByTestId('lesson-lens-region');

  await lens.getByTestId('step-next').click();
  await lens.getByRole('tab', { name: 'State', exact: true }).click();
  const frame = await lens.getByTestId('current-frame').textContent();

  await page.getByRole('button', { name: 'Close Lens' }).click();
  await page.evaluate(() => window.scrollTo(0, 420));
  const beforeOpen = await page.evaluate(() => window.scrollY);
  await page.getByTestId('open-lesson-lens').evaluate((button: HTMLButtonElement) => button.click());
  await page.getByRole('button', { name: 'Close Lens' }).click();
  const afterClose = await page.evaluate(() => window.scrollY);

  expect(Math.abs(afterClose - beforeOpen)).toBeLessThanOrEqual(2);
  await page.getByTestId('open-lesson-lens').click();
  await expect(layout).toHaveAttribute('data-lens-display-mode', 'open');
  await expect(lens.getByRole('tab', { name: 'State', exact: true })).toHaveAttribute('aria-selected', 'true');
  await expect(lens.getByTestId('current-frame')).toHaveText(frame ?? '');
});

test('desktop open and focus modes give Lens the promised workspace share', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await selectSection(page, /Read an assignment/);

  const layout = page.getByTestId('lesson-layout');
  const rail = page.getByTestId('lesson-progress-rail');
  const lens = page.getByTestId('lesson-lens-region');
  const [layoutBox, railBox, openLensBox] = await Promise.all([
    layout.boundingBox(),
    rail.boundingBox(),
    lens.boundingBox(),
  ]);
  expect(layoutBox && railBox && openLensBox).toBeTruthy();
  expect(openLensBox!.width / (layoutBox!.width - railBox!.width)).toBeGreaterThanOrEqual(.65);
  await page.screenshot({
    path: path.join(evidenceRoot, 'desktop-open.png'),
    animations: 'disabled',
  });

  await page.getByRole('button', { name: 'Focus Lens' }).click();
  const focusedLensBox = await lens.boundingBox();
  expect(focusedLensBox!.width / (layoutBox!.width - railBox!.width)).toBeGreaterThanOrEqual(.95);
  expect(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)).toBe(false);
  await page.screenshot({
    path: path.join(evidenceRoot, 'desktop-focus.png'),
    animations: 'disabled',
  });
});

test('lesson Lens code toggle and graph controls remain contained', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await selectSection(page, /Read an assignment/);
  const lens = page.getByTestId('lesson-lens-region');
  await lens.getByRole('tab', { name: 'Graph Inspector', exact: true }).click();

  const viewport = lens.getByLabel('Pannable semantic graph');
  await expect(viewport).toBeVisible();
  await lens.getByRole('button', { name: 'Fit graph to view' }).click();
  expect(Number(await viewport.getAttribute('data-zoom'))).toBeLessThanOrEqual(1);

  const before = await viewport.boundingBox();
  await lens.getByTestId('toggle-lens-code').click();
  await expect(lens.getByTestId('toggle-lens-code')).toHaveText('Show code');
  const after = await viewport.boundingBox();
  expect(after!.width).toBeGreaterThan(before!.width);

  await viewport.focus();
  await page.keyboard.press('+');
  const zoomed = Number(await viewport.getAttribute('data-zoom'));
  await page.keyboard.press('0');
  expect(Number(await viewport.getAttribute('data-zoom'))).toBeLessThanOrEqual(zoomed);
  expect(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)).toBe(false);
});

test('tablet and mobile use overlay workspaces without page overflow', async ({ page }) => {
  for (const viewport of [
    { width: 768, height: 1024 },
    { width: 390, height: 844 },
  ]) {
    await page.setViewportSize(viewport);
    await page.reload();
    await expect(page.getByTestId('lesson-hydrating')).toHaveCount(0, { timeout: 30_000 });
    if (await page.getByTestId('lesson-layout').getAttribute('data-lens-display-mode') === 'closed') {
      await selectSection(page, /Read an assignment/);
    }
    await expect(page.getByTestId('lesson-layout')).toHaveAttribute('data-lens-display-mode', 'open');
    await expect(page.getByRole('button', { name: 'Lesson context', exact: true })).toBeVisible();
    await page.screenshot({
      path: path.join(evidenceRoot, `responsive-${viewport.width}.png`),
      animations: 'disabled',
    });
    await page.locator('.lens-host').evaluate((host) => {
      const focusable = Array.from(host.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])',
      )).filter((element) => element.getClientRects().length > 0);
      focusable.at(-1)?.focus();
    });
    await page.keyboard.press('Tab');
    expect(await page.locator('.lens-host').evaluate((host) => host.contains(document.activeElement))).toBe(true);
    expect(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)).toBe(false);
  }
});
