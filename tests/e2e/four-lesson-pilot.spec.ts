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
    '4',
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

test('direct lesson use records no study evidence before consent', async ({ page }) => {
  await openLesson(page, 'values-and-variables');
  await expect(page.getByTestId('participant-code')).toHaveCount(0);
  await expect(page.getByTestId('pilot-controls')).toHaveCount(0);
  expect(await page.evaluate(() => localStorage.getItem('lol:pilot:v2:study'))).toBeNull();
  expect(await page.evaluate(() => localStorage.getItem('lol:pilot:v2:events'))).toBeNull();
});

test('facilitator setup launches a learner-only lesson tab', async ({ page, context }) => {
  await page.goto('/pilot');
  await page.getByLabel(/I understand this local recording/).check();
  await page.getByRole('button', { name: 'Create consented study session' }).click();
  const learnerPromise = context.waitForEvent('page');
  await page.getByTestId('launch-pilot-lesson').click();
  const learner = await learnerPromise;
  await waitForLesson(learner);
  await expect(learner.getByTestId('participant-code')).toHaveCount(0);
  await expect(learner.getByTestId('export-pilot')).toHaveCount(0);
  await expect(learner.getByTestId('delete-pilot')).toHaveCount(0);
  await learner.close();
});

const journeys = [
  {
    slug: 'functions-and-returns',
    title: 'Functions and Return Values',
    predictSection: /Predict the return/,
    predictionFields: { answer: '10' },
    predictionOption: undefined,
    guidedSection: /Follow the call/,
    variationSection: /Change the input/,
    variationOption: 'answer',
    changed: 'Changed 16',
    buildSection: /Build a function/,
    buildSource: 'def scale(value):\n    result = value * 2\n    return result\n\nanswer = scale(5)',
  },
  {
    slug: 'conditions-and-branches',
    title: 'Conditions and Branches',
    predictSection: /Predict the branch/,
    predictionFields: {},
    predictionOption: 'else branch',
    guidedSection: /Follow the selected path/,
    variationSection: /Change the condition input/,
    variationOption: 'status',
    changed: 'Changed true',
    buildSection: /Build a decision/,
    buildSource: 'years = 16\nif years >= 18:\n    label = "adult"\nelse:\n    label = "minor"',
  },
  {
    slug: 'loops-over-lists',
    title: 'Loops over Lists',
    predictSection: /Predict repetition/,
    predictionFields: { iterations: '3', total: '12' },
    predictionOption: undefined,
    guidedSection: /Follow each iteration/,
    variationSection: /Change the list/,
    variationOption: 'total',
    changed: 'Changed 9',
    buildSection: /Build a loop/,
    buildSource: 'values = [2, 4, 6]\nsum_value = 0\nfor item in values:\n    sum_value = sum_value + item',
  },
] as const;

for (const journey of journeys) {
  test(`${journey.slug} completes prediction, variation, and Build in one workspace`, async ({ page }) => {
    await openLesson(page, journey.slug);
    await expect(page.getByRole('heading', { name: journey.title, exact: true })).toBeVisible();
    await expect(page.getByTestId('lesson-section')).toHaveCount(9);
    await expect(page.getByTestId('code-editor')).toHaveCount(1);
    const workspace = page.getByTestId('lesson-lens-region').getByTestId('lens-workspace');
    const sessionId = await workspace.getAttribute('data-session-id');

    await openSection(page, journey.predictSection);
    await expect(page.getByRole('tab', { name: 'State', exact: true })).toHaveCount(0);
    for (const [field, value] of Object.entries(journey.predictionFields)) {
      await page.getByTestId(`prediction-${field}`).fill(value);
    }
    if (journey.predictionOption) {
      await page.getByTestId('branch-prediction').getByLabel(journey.predictionOption).check();
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
    await expect(page.getByTestId('build-feedback')).toHaveClass(/error/);
    const editor = page.getByTestId('code-editor').locator('.cm-content');
    await editor.click();
    await page.keyboard.press('ControlOrMeta+A');
    await page.keyboard.insertText(journey.buildSource);
    await page.getByTestId('check-build').click();
    await expect(page.getByTestId('build-feedback')).toHaveClass(/success/);
    await expect(editor).toContainText(journey.buildSource.split('\n')[0]);
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

test('Conditions rejects a learner program with a broken true branch', async ({ page }) => {
  await openLesson(page, 'conditions-and-branches');
  await openSection(page, /Build a decision/);
  const editor = page.getByTestId('code-editor').locator('.cm-content');
  await editor.click();
  await page.keyboard.press('ControlOrMeta+A');
  await page.keyboard.insertText(
    'age = 16\nif age >= 18:\n    status = ""\nelse:\n    status = "minor"',
  );
  await page.getByTestId('check-build').click();
  await expect(page.getByTestId('build-feedback')).toHaveClass(/error/);
  await expect(page.getByTestId('build-feedback')).toContainText('learner-source scenarios');
});

test('Values Build rejects unchanged work, accepts alternate names, invalidates edits, and exports private events', async ({ page }) => {
  await page.goto('/pilot');
  await expect(page.getByTestId('participant-code')).toHaveCount(0);
  await page.getByLabel(/I understand this local recording/).check();
  await page.getByRole('button', { name: 'Create consented study session' }).click();
  const participantCode = await page.getByTestId('participant-code').textContent();
  expect(participantCode).toMatch(/^P-[A-F0-9]{8}$/);
  await openLesson(page, 'values-and-variables');
  await expect(page.getByTestId('participant-code')).toHaveCount(0);
  await expect(page.getByTestId('pilot-controls')).toHaveCount(0);
  await openSection(page, /Build a calculation/);
  await page.getByTestId('check-build').click();
  await expect(page.getByTestId('build-feedback')).toHaveClass(/error/);

  const editor = page.getByTestId('code-editor').locator('.cm-content');
  const validSource = 'base = 10\nextra = 5\ncombined = base + extra';
  await editor.click();
  await page.keyboard.press('ControlOrMeta+A');
  await page.keyboard.insertText(validSource);
  await page.getByTestId('check-build').click();
  await expect(page.getByTestId('build-feedback')).toHaveClass(/success/);

  await editor.click();
  await page.keyboard.press('End');
  await page.keyboard.insertText(' ');
  await expect(page.getByTestId('build-feedback')).toHaveCount(0);

  const rawEvents = await page.evaluate(() => localStorage.getItem('lol:pilot:v2:events') ?? '');
  expect(rawEvents).not.toContain(validSource);
  expect(rawEvents).toContain('sourceHash');
  expect(rawEvents).toContain('build_submission_completed');

  await page.goto('/pilot');
  await expect(page.getByTestId('participant-code')).toHaveText(participantCode ?? '');
  await page.getByTestId('record-intervention').click();
  const downloadPromise = page.waitForEvent('download');
  await page.getByTestId('export-pilot').click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toMatch(/^lens-pilot-v2-P-[A-F0-9]{8}\.json$/);
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
