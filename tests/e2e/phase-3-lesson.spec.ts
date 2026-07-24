import { expect, test, type Page } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import {
  expectNoBrowserFailures,
  monitorBrowserFailures,
} from './browser-failures';

const evidenceRoot = path.resolve('output/playwright/phase-3-lesson');

async function waitForLesson(page: Page) {
  await expect(page.getByTestId('phase-2-lesson-player')).toBeVisible();
  await expect(page.getByTestId('lesson-hydrating')).toHaveCount(0, { timeout: 30_000 });
  await expect(page.getByTestId('lesson-lens-region').getByTestId('lens-workspace')).toHaveCount(1);
}

async function openSection(page: Page, heading: RegExp) {
  await page.getByTestId('lesson-progress-rail').getByRole('button', { name: heading }).click();
}

async function returnToLesson(page: Page) {
  if (await page.getByTestId('lesson-layout').getAttribute('data-lens-display-mode') !== 'closed') {
    await page.getByRole('button', { name: 'Close Lens' }).click();
  }
}

async function replaceLessonSource(page: Page, source: string) {
  const editor = page.getByTestId('lesson-lens-region').getByTestId('code-editor').locator('.cm-content');
  await editor.click();
  await page.keyboard.press('ControlOrMeta+A');
  await page.keyboard.insertText(source);
  await page.keyboard.press('Escape');
}

async function revealCanonicalPrediction(page: Page) {
  await openSection(page, /What will Python store/);
  await page.getByTestId('prediction-tax').fill('16');
  await page.getByTestId('prediction-total').fill('116');
  await page.getByTestId('lesson-check-action').click();
  await expect(page.getByTestId('prediction-comparison')).toContainText('Actual 16');
  await expect(page.getByTestId('prediction-comparison')).toContainText('Actual 116');
  await openSection(page, /Follow the calculation/);
  await expect(page.getByTestId('lesson-lens-region')).toHaveAttribute('data-presentation', 'focus');
  await page.getByTestId('open-lesson-lens').click();
}

test.beforeAll(async () => {
  await mkdir(evidenceRoot, { recursive: true });
});

test.setTimeout(90_000);

test.beforeEach(async ({ page }) => {
  monitorBrowserFailures(page);
  await page.goto('/learn/python-foundations/values-and-variables');
  await waitForLesson(page);
});

test.afterEach(async ({ page }) => {
  expectNoBrowserFailures(page);
});

test('renders literal assignment anatomy and one persistent mounted editor', async ({ page }) => {
  await expect(page.getByTestId('lesson-header')).toContainText('Python Foundations');
  await openSection(page, /Read an assignment/);
  await expect(page.getByTestId('lesson-assignment-shape')).toContainText('price = 100');
  await expect(page.getByTestId('lesson-assignment-shape')).toContainText('tax = price * 0.16');
  await expect(page.getByTestId('lesson-assignment-shape')).toContainText('total = price + tax');
  await expect(page.getByText('Mark complete')).toHaveCount(0);
  await expect(page.getByTestId('code-editor')).toHaveCount(1);
  await expect(page.locator('textarea')).toHaveCount(0);
  await page.screenshot({ path: path.join(evidenceRoot, 'desktop-values.png'), fullPage: true });
});

test('keeps one session through quiet prediction and guided reveal', async ({ page }) => {
  const workspace = page.getByTestId('lesson-lens-region').getByTestId('lens-workspace');
  const sessionId = await workspace.getAttribute('data-session-id');
  await openSection(page, /Follow the calculation/);
  await expect(page.getByTestId('lesson-interaction-message')).toContainText('Commit the prediction');
  await expect(page.getByTestId('lesson-lens-region')).toHaveAttribute('data-presentation', 'quiet');
  await revealCanonicalPrediction(page);
  await expect(workspace).toHaveAttribute('data-session-id', sessionId ?? '');
  await expect(page.getByTestId('lesson-lens-region')).toHaveAttribute('data-lens-mode', 'guided');
  await expect(page.getByTestId('guided-trace-view')).toBeVisible();
});

test('applies only the authored price variation and compares State rows', async ({ page }) => {
  await revealCanonicalPrediction(page);
  await openSection(page, /Change one value/);
  await returnToLesson(page);
  const variation = page.getByTestId('variation-prediction');
  for (const name of ['price', 'tax', 'total']) {
    await variation.getByLabel(name, { exact: true }).check();
  }
  await page.getByTestId('lesson-check-action').click();
  await page.getByTestId('apply-variation').click();
  await expect(page.getByTestId('variation-comparison')).toContainText('Changed 200');
  await expect(page.getByTestId('variation-comparison')).toContainText('Changed 32');
  await expect(page.getByTestId('variation-comparison')).toContainText('Changed 232');
  await expect(page.getByTestId('code-editor').locator('.cm-content')).toContainText('price = 200');
  await expect(page.getByTestId('code-editor')).toHaveAttribute('data-readonly', 'true');
});

test('recognition supports check, feedback, and retry', async ({ page }) => {
  await openSection(page, /Recognize the same structure/);
  await returnToLesson(page);
  const check = page.getByTestId('recognition-check');
  for (const name of ['distance', 'time', 'speed']) {
    const group = check.locator('fieldset').filter({ hasText: name });
    await group.getByLabel(name === 'speed' ? 'starting name' : 'derived name', { exact: true }).check();
  }
  await page.getByTestId('lesson-check-action').click();
  await expect(check).toContainText('Check which lines');
  await page.getByTestId('retry-recognition').click();
  for (const name of ['distance', 'time']) {
    await check.locator('fieldset').filter({ hasText: name }).getByLabel('starting name', { exact: true }).check();
  }
  await check.locator('fieldset').filter({ hasText: 'speed' }).getByLabel('derived name', { exact: true }).check();
  await page.getByTestId('lesson-check-action').click();
  await expect(check).toContainText('Correct: the first two names');
});

test('Build uses the shared editor and grades dependencies deterministically', async ({ page }) => {
  const workspace = page.getByTestId('lesson-lens-region').getByTestId('lens-workspace');
  const sessionId = await workspace.getAttribute('data-session-id');
  await openSection(page, /Build a calculation/);
  await expect(page.getByTestId('lesson-lens-region')).toHaveAttribute('data-lens-mode', 'build');
  await expect(page.getByTestId('code-editor')).toHaveCount(1);
  await expect(page.getByTestId('code-editor')).toHaveAttribute('data-readonly', 'false');
  await expect(page.locator('textarea')).toHaveCount(0);

  await page.getByTestId('open-lesson-lens').click();
  await replaceLessonSource(page, 'first = 10\nsecond = 5\nresult = first * 2');
  await returnToLesson(page);
  await page.getByTestId('lesson-check-action').click();
  await expect(page.getByTestId('build-feedback')).toContainText('both starting bindings');
  await page.getByTestId('open-lesson-lens').click();
  await replaceLessonSource(page, 'first = 10\nsecond = 5\nresult = first + second');
  await returnToLesson(page);
  await page.getByTestId('lesson-check-action').click();
  await expect(page.getByTestId('build-feedback')).toContainText('depends on both starting bindings');
  await expect(workspace).toHaveAttribute('data-session-id', sessionId ?? '');
});

test('refresh restores guided response, source, view, frame, and attempt identity', async ({ page }) => {
  await revealCanonicalPrediction(page);
  const attemptId = await page.getByTestId('lesson-attempt-id').textContent();
  const lens = page.getByTestId('lesson-lens-region');
  await lens.getByTestId('step-next').click();
  await lens.getByRole('tab', { name: 'State', exact: true }).click();
  const frame = await lens.getByTestId('current-frame').textContent();

  const lensStorage = await page.evaluate(() => {
    const key = Object.keys(localStorage).find((entry) => entry.startsWith('lens:v1:lesson:'));
    return key ? JSON.parse(localStorage.getItem(key) ?? 'null') : null;
  });
  expect(lensStorage.artifacts).toBeUndefined();

  await page.reload();
  await waitForLesson(page);
  await expect(page.getByTestId('lesson-attempt-id')).toHaveText(attemptId ?? '');
  await expect(lens.getByTestId('lens-workspace')).toHaveAttribute('data-hydration-status', 'restored');
  await page.getByTestId('open-lesson-lens').click();
  await expect(lens.getByRole('tab', { name: 'State', exact: true })).toHaveAttribute('aria-selected', 'true');
  await expect(lens.getByTestId('current-frame')).toHaveText(frame ?? '');
  await returnToLesson(page);
  await openSection(page, /What will Python store/);
  await expect(page.getByTestId('prediction-comparison')).toBeVisible();
});

test('refresh in Build preserves learner source without restoring artifacts', async ({ page }) => {
  await openSection(page, /Build a calculation/);
  await page.getByTestId('open-lesson-lens').click();
  await replaceLessonSource(page, 'alpha = 4\nbeta = 6\nsum_value = alpha + beta');
  await page.reload();
  await waitForLesson(page);
  await expect(page.getByTestId('lesson-lens-region')).toHaveAttribute('data-lens-mode', 'build');
  await expect(page.getByTestId('code-editor').locator('.cm-content')).toContainText('alpha = 4');
  await page.getByTestId('open-lesson-lens').click();
  await expect(page.getByTestId('lens-empty-workspace')).toBeVisible();
});

test('restart creates a clean authored attempt', async ({ page }) => {
  await openSection(page, /Build a calculation/);
  const oldAttempt = await page.getByTestId('lesson-attempt-id').textContent();
  await page.getByTestId('open-lesson-lens').click();
  await replaceLessonSource(page, 'changed = 999');
  await returnToLesson(page);
  await page.getByTestId('lesson-restart').click();
  await expect(page.getByTestId('lesson-attempt-id')).not.toHaveText(oldAttempt ?? '');
  await expect(page.getByTestId('lesson-lens-region')).toHaveAttribute('data-presentation', 'quiet');
  await expect(page.getByTestId('code-editor').locator('.cm-content')).toContainText('price = 100');
});

test('lesson storage remains isolated from Decode', async ({ page, context }) => {
  await openSection(page, /Build a calculation/);
  await page.getByTestId('open-lesson-lens').click();
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
    expect(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)).toBe(false);
    await page.screenshot({
      path: path.join(evidenceRoot, `${viewport.name}.png`),
      fullPage: true,
    });
  });
}
