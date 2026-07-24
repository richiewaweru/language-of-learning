import { expect, test, type Page } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import {
  expectNoBrowserFailures,
  monitorBrowserFailures,
} from './browser-failures';

const evidenceRoot = path.resolve('output/playwright/guided-lesson');

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

test('Lens stays contextual and always opens attached first', async ({ page }) => {
  const layout = page.getByTestId('lesson-layout');
  await expect(layout).toHaveAttribute('data-lens-display-mode', 'closed');
  await expect(page.getByTestId('lesson-lens-invitation')).toHaveCount(0);

  await selectSection(page, /Read an assignment/);
  await expect(layout).toHaveAttribute('data-lens-display-mode', 'closed');
  await expect(page.getByTestId('lesson-lens-invitation')).toBeVisible();
  await page.screenshot({
    path: path.join(evidenceRoot, 'lesson.png'),
    animations: 'disabled',
  });
  await page.getByTestId('open-lesson-lens').click();
  await expect(layout).toHaveAttribute('data-lens-display-mode', 'open');
  await expect(page.getByTestId('lesson-section')).toContainText('Read an assignment');

  await page.getByRole('button', { name: 'Focus Lens' }).click();
  await expect(layout).toHaveAttribute('data-lens-display-mode', 'focus');
  await expect(
    page.getByTestId('lesson-lens-region').getByRole('button', { name: 'Close Lens' }),
  ).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(layout).toHaveAttribute('data-lens-display-mode', 'closed');
  await expect(page.getByTestId('open-lesson-lens')).toBeFocused();
});

test('quiet navigation closes attached Lens and responses advance only through navigation', async ({ page }) => {
  await selectSection(page, /Read an assignment/);
  await page.getByTestId('open-lesson-lens').click();
  await selectSection(page, /What will Python store/);
  await expect(page.getByTestId('lesson-layout')).toHaveAttribute('data-lens-display-mode', 'closed');

  await page.getByTestId('prediction-tax').fill('16');
  await page.getByTestId('prediction-total').fill('116');
  await page.getByTestId('lesson-check-action').click();
  await expect(page.getByTestId('lesson-section')).toContainText('Your committed prediction matches');
  await expect(page.getByTestId('lesson-section')).toContainText('What will Python store?');

  await page.getByTestId('lesson-navigation').getByRole('button', { name: 'Next' }).click();
  await expect(page.getByTestId('lesson-section')).toContainText('Follow the calculation');
  await page.getByTestId('lesson-navigation').getByRole('button', { name: 'Back' }).click();
  await expect(page.getByTestId('prediction-tax')).toHaveValue('16');
  await expect(page.getByTestId('prediction-total')).toHaveValue('116');
});

test('closing and reopening preserves Lens view, frame, scroll, and launcher focus', async ({ page }) => {
  await selectSection(page, /Read an assignment/);
  await page.getByTestId('open-lesson-lens').click();
  const lens = page.getByTestId('lesson-lens-region');

  await lens.getByTestId('step-next').click();
  await lens.getByRole('tab', { name: 'State', exact: true }).click();
  const frame = await lens.getByTestId('current-frame').textContent();

  await page.getByRole('button', { name: 'Close Lens' }).click();
  await page.evaluate(() => window.scrollTo(0, 240));
  const beforeOpen = await page.evaluate(() => window.scrollY);
  await page.getByTestId('open-lesson-lens').click();
  await page.getByRole('button', { name: 'Close Lens' }).click();
  const afterClose = await page.evaluate(() => window.scrollY);

  expect(Math.abs(afterClose - beforeOpen)).toBeLessThanOrEqual(2);
  await expect(page.getByTestId('open-lesson-lens')).toBeFocused();
  await page.getByTestId('open-lesson-lens').click();
  await expect(lens.getByRole('tab', { name: 'State', exact: true })).toHaveAttribute('aria-selected', 'true');
  await expect(lens.getByTestId('current-frame')).toHaveText(frame ?? '');
});

test('desktop attached and focus modes honor their workspace geometry', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await selectSection(page, /Read an assignment/);
  await page.getByTestId('open-lesson-lens').click();

  const layout = page.getByTestId('lesson-layout');
  const lesson = page.locator('.lesson-column');
  const lens = page.getByTestId('lesson-lens-region');
  const [layoutBox, lessonBox, lensBox] = await Promise.all([
    layout.boundingBox(),
    lesson.boundingBox(),
    lens.boundingBox(),
  ]);
  expect(layoutBox && lessonBox && lensBox).toBeTruthy();
  expect(lensBox!.width / layoutBox!.width).toBeGreaterThanOrEqual(.65);
  expect(lessonBox!.width / layoutBox!.width).toBeGreaterThanOrEqual(.25);
  await page.screenshot({
    path: path.join(evidenceRoot, 'attached.png'),
    animations: 'disabled',
  });

  await page.getByRole('button', { name: 'Focus Lens' }).click();
  const focused = await lens.boundingBox();
  expect(focused!.width).toBeGreaterThan(1000);
  expect(Math.abs((focused!.x + focused!.width / 2) - 720)).toBeLessThan(4);
  await expect(page.locator('.focus-scrim')).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)).toBe(false);
  await page.screenshot({
    path: path.join(evidenceRoot, 'focus.png'),
    animations: 'disabled',
  });
});

test('mobile attached mode exposes the active lesson through a context drawer', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.reload();
  await expect(page.getByTestId('lesson-hydrating')).toHaveCount(0, { timeout: 30_000 });
  await selectSection(page, /Read an assignment/);
  await page.getByTestId('open-lesson-lens').click();

  await expect(page.getByRole('button', { name: 'Lesson context', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Lesson context', exact: true }).click();
  await expect(page.getByTestId('lesson-section')).toBeVisible();
  await expect(page.getByTestId('lesson-section')).toContainText('Read an assignment');
  expect(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)).toBe(false);
  await page.keyboard.press('Escape');
  await expect(page.getByTestId('lesson-layout')).toHaveAttribute('data-lens-display-mode', 'open');
  await page.keyboard.press('Escape');
  await expect(page.getByTestId('lesson-layout')).toHaveAttribute('data-lens-display-mode', 'closed');
});
