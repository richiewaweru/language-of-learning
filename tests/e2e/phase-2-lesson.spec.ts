import { expect, test, type Page } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';

const evidenceRoot = path.resolve('output/playwright/phase-2-lesson');
const browserFailures = new WeakMap<Page, string[]>();

async function waitForLesson(page: Page) {
  await expect(page.getByTestId('phase-2-lesson-player')).toBeVisible();
  await expect(page.getByTestId('lesson-hydrating')).toHaveCount(0, { timeout: 20_000 });
  await expect(page.getByTestId('lesson-lens-region').getByTestId('decode-playback')).toBeVisible();
}

async function replaceLessonSource(page: Page, source: string) {
  const editor = page.getByTestId('lesson-lens-region').getByTestId('code-editor').locator('.cm-content');
  await editor.click();
  await page.keyboard.press('ControlOrMeta+A');
  await page.keyboard.insertText(source);
  await page.keyboard.press('Escape');
}

test.beforeAll(async () => {
  await mkdir(evidenceRoot, { recursive: true });
});

test.setTimeout(60_000);

test.beforeEach(async ({ page }) => {
  const failures: string[] = [];
  browserFailures.set(page, failures);
  page.on('console', (message) => {
    if (message.type() === 'error') failures.push(`console: ${message.text()}`);
  });
  page.on('requestfailed', (request) => {
    const abortedExternalFont =
      request.url().startsWith('https://fonts.gstatic.com/') &&
      request.failure()?.errorText === 'net::ERR_ABORTED';
    if (!abortedExternalFont) {
      failures.push(`request: ${request.method()} ${request.url()} ${request.failure()?.errorText ?? ''}`);
    }
  });
  await page.goto('/learn/python-foundations/values-and-variables');
  await waitForLesson(page);
});

test.afterEach(async ({ page }) => {
  expect(browserFailures.get(page) ?? []).toEqual([]);
});

test('renders the validated lesson and one real editable Lens workspace', async ({ page }) => {
  await expect(page.getByRole('heading', { name: 'Values and Variables', exact: true })).toBeVisible();
  await expect(page.getByTestId('lesson-code-shape')).toBeVisible();
  await expect(page.getByTestId('lesson-lens-region').getByTestId('lens-workspace')).toHaveCount(1);
  await expect(page.getByTestId('code-editor')).toHaveAttribute('data-readonly', 'false');
  await expect(page.getByTestId('code-editor').locator('.cm-content')).toContainText('price = 100');
  await page.screenshot({ path: path.join(evidenceRoot, 'desktop-values.png') });
});

test('keeps one workspace mounted while sections and progress change', async ({ page }) => {
  const workspace = page.getByTestId('lesson-lens-region').getByTestId('lens-workspace');
  const sessionId = await workspace.getAttribute('data-session-id');
  await page.getByTestId('lesson-progress-rail').getByRole('button', { name: /Read the shape/ }).click();
  await expect(workspace).toHaveAttribute('data-session-id', sessionId ?? '');
  await page.getByTestId('lesson-section').filter({ hasText: 'Read the shape' }).getByRole('button', { name: 'Mark complete' }).click();
  await expect(page.getByTestId('lesson-progress-rail').getByRole('button', { name: /Read the shape/ })).toHaveClass(/complete/);
});

test('restores progress, source, view, and frame while regenerating artifacts', async ({ page }) => {
  await replaceLessonSource(page, 'price = 200\ntax = price * 0.16\ntotal = price + tax');
  const lens = page.getByTestId('lesson-lens-region');
  await lens.getByTestId('decode-visualize').click();
  await lens.getByTestId('step-next').click();
  await lens.getByRole('tab', { name: 'State', exact: true }).click();
  await page.getByTestId('lesson-section').first().getByRole('button', { name: 'Mark complete' }).click();

  const lensStorage = await page.evaluate(() => {
    const key = Object.keys(localStorage).find((entry) => entry.startsWith('lens:v1:lesson:'));
    return key ? JSON.parse(localStorage.getItem(key) ?? 'null') : null;
  });
  expect(lensStorage.artifacts).toBeUndefined();
  expect(lensStorage.source).toContain('price = 200');

  await page.reload();
  await waitForLesson(page);
  await expect(lens.getByTestId('lens-workspace')).toHaveAttribute('data-hydration-status', 'restored');
  await expect(page.getByTestId('code-editor').locator('.cm-content')).toContainText('price = 200');
  await expect(lens.getByRole('tab', { name: 'State', exact: true })).toHaveAttribute('aria-selected', 'true');
  await expect(lens.getByTestId('current-frame')).toHaveText('1');
  await expect(lens.locator('[data-verified-output="true"]')).toBeVisible();
});

test('restart creates a clean authored attempt', async ({ page }) => {
  const oldAttempt = await page.getByTestId('lesson-attempt-id').textContent();
  await replaceLessonSource(page, 'changed = 999');
  await page.getByTestId('lesson-restart').click();
  await expect(page.getByTestId('lesson-attempt-id')).not.toHaveText(oldAttempt ?? '');
  await expect(page.getByTestId('code-editor').locator('.cm-content')).toContainText('price = 100');
});

test('lesson storage is isolated from Decode no-restore behavior', async ({ page, context }) => {
  await replaceLessonSource(page, 'lesson_only = 41');
  const decodePage = await context.newPage();
  await decodePage.goto('/decode');
  await expect(decodePage.getByTestId('code-editor').locator('.cm-content')).not.toContainText('lesson_only');
  await decodePage.close();
  await expect(page.getByTestId('code-editor').locator('.cm-content')).toContainText('lesson_only');
});

for (const viewport of [
  { width: 1440, height: 1000, name: 'desktop' },
  { width: 1024, height: 768, name: 'tablet-landscape' },
  { width: 768, height: 1024, name: 'tablet-portrait' },
  { width: 390, height: 844, name: 'mobile' },
]) {
  test(`${viewport.name} layout has no horizontal overflow`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.reload();
    await waitForLesson(page);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
    expect(overflow).toBe(false);
    await page.screenshot({
      path: path.join(evidenceRoot, `${viewport.name}.png`),
    });
  });
}
