import { expect, test, type Page } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import {
  expectNoBrowserFailures,
  monitorBrowserFailures,
} from './browser-failures';

const evidenceRoot = path.resolve('output/playwright/phase-4');

async function waitForLesson(page: Page) {
  await expect(page.getByTestId('phase-2-lesson-player')).toHaveAttribute(
    'data-schema-version',
    '3',
  );
  await expect(page.getByTestId('lesson-hydrating')).toHaveCount(0, { timeout: 30_000 });
  await expect(page.getByTestId('lesson-lens-region').getByTestId('lens-workspace')).toHaveCount(1);
}

async function openLesson(page: Page, slug: string) {
  await page.goto(`/learn/python-foundations/${slug}`);
  await waitForLesson(page);
}

async function openSection(page: Page, heading: RegExp) {
  await page.getByTestId('lesson-progress-rail').getByRole('button', { name: heading }).click();
}

test.beforeAll(async () => {
  await mkdir(evidenceRoot, { recursive: true });
});

test.beforeEach(async ({ page }) => {
  monitorBrowserFailures(page);
});

test.afterEach(async ({ page }) => {
  expectNoBrowserFailures(page);
});

test('course index exposes exactly four intentional lessons', async ({ page }) => {
  await page.goto('/learn/python-foundations');
  await expect(page.getByTestId('pilot-lesson-index').locator('li')).toHaveCount(4);
  for (const title of [
    'Values and Variables',
    'Functions and Return Values',
    'Conditions and Branches',
    'Loops over Lists',
  ]) {
    await expect(page.getByText(title, { exact: true })).toBeVisible();
  }
});

const journeys = [
  {
    slug: 'functions-and-returns',
    title: 'Functions and Return Values',
    predictSection: /Predict the return/,
    predictionFields: { answer: '10' },
    guidedSection: /Follow the call/,
    variationSection: /Change the input/,
    variationOption: 'answer',
    changed: 'Changed 16',
    buildSection: /Build a function/,
  },
  {
    slug: 'conditions-and-branches',
    title: 'Conditions and Branches',
    predictSection: /Predict the branch/,
    predictionFields: { branch: '0' },
    guidedSection: /Follow the selected path/,
    variationSection: /Change the condition input/,
    variationOption: 'status',
    changed: 'Changed true',
    buildSection: /Build a decision/,
  },
  {
    slug: 'loops-over-lists',
    title: 'Loops over Lists',
    predictSection: /Predict repetition/,
    predictionFields: { iterations: '3', total: '12' },
    guidedSection: /Follow each iteration/,
    variationSection: /Change the list/,
    variationOption: 'total',
    changed: 'Changed 9',
    buildSection: /Build a loop/,
  },
] as const;

for (const journey of journeys) {
  test(`${journey.slug} completes prediction, variation, and Build in one workspace`, async ({ page }) => {
    await openLesson(page, journey.slug);
    await expect(page.getByRole('heading', { name: journey.title, exact: true })).toBeVisible();
    await expect(page.getByTestId('lesson-section')).toHaveCount(7);
    await expect(page.getByTestId('code-editor')).toHaveCount(1);
    const workspace = page.getByTestId('lesson-lens-region').getByTestId('lens-workspace');
    const sessionId = await workspace.getAttribute('data-session-id');

    await openSection(page, journey.predictSection);
    await expect(page.getByRole('tab', { name: 'State', exact: true })).toHaveCount(0);
    for (const [field, value] of Object.entries(journey.predictionFields)) {
      await page.getByTestId(`prediction-${field}`).fill(value);
    }
    await page.getByTestId('commit-prediction').click();
    await page.getByTestId('reveal-prediction').click();
    await expect(page.getByTestId('lesson-lens-region')).toHaveAttribute('data-lens-mode', 'guided');
    await expect(page.getByTestId('guided-trace-view')).toBeVisible();

    await openSection(page, journey.variationSection);
    await page.getByTestId('variation-prediction').getByLabel(journey.variationOption, { exact: true }).check();
    await page.getByTestId('commit-variation-prediction').click();
    await page.getByTestId('apply-variation').click();
    await expect(page.getByTestId('variation-comparison')).toContainText(journey.changed);

    await openSection(page, journey.buildSection);
    await page.getByTestId('check-build').click();
    await expect(page.getByTestId('build-feedback')).toHaveClass(/success/);
    await expect(workspace).toHaveAttribute('data-session-id', sessionId ?? '');
    await page.screenshot({
      path: path.join(evidenceRoot, `${journey.slug}-desktop.png`),
      fullPage: true,
    });
  });
}

test('recognition conceals structure until an answer is checked', async ({ page }) => {
  await openLesson(page, 'functions-and-returns');
  await openSection(page, /Recognize another function/);
  await expect(page.getByRole('tab', { name: 'Graph Inspector', exact: true })).toHaveCount(0);
  const recognition = page.getByTestId('recognition-check');
  await recognition.locator('fieldset').filter({ hasText: 'bill' }).getByLabel('parameter').check();
  await recognition.locator('fieldset').filter({ hasText: 'total' }).getByLabel('local result').check();
  await page.getByTestId('check-recognition').click();
  await expect(page.getByRole('tab', { name: 'Graph Inspector', exact: true })).toBeVisible();
  await expect(recognition).toContainText('Correct');
});

test('refresh, restart, cross-lesson, and Decode storage remain isolated', async ({ page, context }) => {
  await openLesson(page, 'functions-and-returns');
  await openSection(page, /Build a function/);
  const attempt = await page.getByTestId('lesson-attempt-id').textContent();
  const editor = page.getByTestId('code-editor').locator('.cm-content');
  await editor.click();
  await page.keyboard.press('ControlOrMeta+A');
  await page.keyboard.insertText('lesson_a_only = 41');
  await page.reload();
  await waitForLesson(page);
  await expect(page.getByTestId('lesson-attempt-id')).toHaveText(attempt ?? '');
  await expect(editor).toContainText('lesson_a_only');

  const other = await context.newPage();
  monitorBrowserFailures(other);
  await openLesson(other, 'conditions-and-branches');
  await expect(other.getByTestId('code-editor').locator('.cm-content')).not.toContainText('lesson_a_only');
  const decode = await context.newPage();
  await decode.goto('/decode');
  await expect(decode.getByTestId('code-editor').locator('.cm-content')).not.toContainText('lesson_a_only');
  await decode.close();
  await other.close();

  await page.getByTestId('lesson-restart').click();
  await expect(page.getByTestId('lesson-attempt-id')).not.toHaveText(attempt ?? '');
  await expect(page.getByTestId('code-editor').locator('.cm-content')).toContainText('def double');
});

for (const viewport of [
  { width: 1440, height: 1000, name: 'desktop' },
  { width: 1024, height: 768, name: 'tablet-landscape' },
  { width: 768, height: 1024, name: 'tablet-portrait' },
  { width: 390, height: 844, name: 'mobile' },
]) {
  test(`${viewport.name} Phase 4 layout has no horizontal overflow`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await openLesson(page, 'loops-over-lists');
    expect(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)).toBe(false);
    await page.screenshot({
      path: path.join(evidenceRoot, `loops-${viewport.name}.png`),
      fullPage: true,
    });
  });
}
