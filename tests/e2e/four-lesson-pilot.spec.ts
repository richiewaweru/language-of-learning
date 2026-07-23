import { expect, test } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';

const evidenceRoot = path.resolve('output/playwright/four-lesson-pilot');

async function waitForPilot(page: import('@playwright/test').Page) {
  await expect(page.getByTestId('four-lesson-pilot')).toHaveAttribute(
    'data-hydrated',
    'true',
    { timeout: 20_000 },
  );
}

async function revealLens(page: import('@playwright/test').Page, prediction: string) {
  await page.getByRole('button', { name: prediction, exact: true }).click();
  await expect(page.getByTestId('pilot-lens-embed')).toHaveCount(3);
}

test.beforeAll(async () => {
  await mkdir(evidenceRoot, { recursive: true });
});

test('pilot index exposes exactly four intentional lessons', async ({ page }) => {
  await page.goto('/learn/python-foundations');
  await expect(page.getByTestId('pilot-lesson-index').locator('li')).toHaveCount(4);
  await expect(page.getByText('Values and Variables')).toBeVisible();
  await expect(page.getByText('Functions and Return Values')).toBeVisible();
  await expect(page.getByText('Conditions and Branches')).toBeVisible();
  await expect(page.getByText('Loops over Lists')).toBeVisible();
  await expect(page.getByText('Accumulate', { exact: true })).toHaveCount(0);
});

const canonical = [
  {
    lesson: 'values-and-variables',
    source: 'price = 100',
    forbidden: 'def calculate_tax',
    prediction: 'price = 100',
    screenshot: 'lesson-1-values.png',
  },
  {
    lesson: 'functions-and-returns',
    source: 'def calculate_tax(price, rate):',
    forbidden: 'classify_temperature',
    prediction: '16.0',
    screenshot: 'lesson-2-functions.png',
  },
  {
    lesson: 'conditions-and-branches',
    source: 'def classify_temperature(temp):',
    forbidden: 'count_passing',
    prediction: 'return "hot"',
    screenshot: 'lesson-3-conditions.png',
  },
  {
    lesson: 'loops-over-lists',
    source: 'def count_passing(scores):',
    forbidden: 'calculate_tax',
    prediction: '2',
    screenshot: 'lesson-4-loops.png',
  },
];

for (const item of canonical) {
  test(`${item.lesson} is one flowing lesson with its own embedded Lens scenes`, async ({
    page,
  }) => {
    await page.goto(`/learn/python-foundations/${item.lesson}`);
    await waitForPilot(page);

    await expect(page.getByTestId('pilot-lesson-link')).toHaveCount(4);
    await expect(page.getByTestId('pilot-step-section')).toHaveCount(9);
    await expect(page.getByTestId('pilot-lens-embed')).toHaveCount(0);

    await revealLens(page, item.prediction);

    const syntaxLens = page.locator('[data-lens-mode="syntax"]');
    const watchLens = page.locator('[data-lens-mode="watch"]');
    const exploreLens = page.locator('[data-lens-mode="explore"]');
    await expect(syntaxLens).toHaveCount(1);
    await expect(watchLens).toHaveCount(1);
    await expect(exploreLens).toHaveCount(1);
    await expect(syntaxLens).toContainText(item.source);
    await expect(watchLens).toContainText(item.source);
    await expect(syntaxLens).not.toContainText(item.forbidden);
    await expect(syntaxLens).not.toContainText('calculate_total(2, 4, 6, 8)');

    await syntaxLens.scrollIntoViewIfNeeded();
    await page.screenshot({
      path: path.join(evidenceRoot, item.screenshot),
    });
  });
}

test('prediction unlocks the inline syntax, watch, and exploration sequence', async ({ page }) => {
  await page.goto('/learn/python-foundations/values-and-variables');
  await waitForPilot(page);

  await expect(page.getByTestId('pilot-step-section')).toHaveCount(9);
  await expect(page.getByTestId('pilot-lens-embed')).toHaveCount(0);
  await expect(page.getByText('Prediction comes first')).toBeVisible();

  await page.getByRole('button', { name: '100 = price', exact: true }).click();
  await expect(page.getByTestId('pilot-lens-embed')).toHaveCount(0);

  await revealLens(page, 'price = 100');
  await expect(page.locator('[data-lens-mode="syntax"]')).toContainText('Structure beside syntax');
  await expect(page.locator('[data-lens-mode="watch"]')).toContainText('Watch the canonical run');
  await expect(page.locator('[data-lens-mode="explore"]')).toContainText('Explore mode');

  await page.getByRole('button', { name: 'Change the starting price' }).click();
  await expect(page.locator('[data-lens-mode="explore"]')).toContainText('price = 200');
});

test('progress persists through refresh and reset clears it', async ({ page }) => {
  await page.goto('/learn/python-foundations/functions-and-returns');
  await waitForPilot(page);

  await page.getByRole('button', { name: 'Mark Name it complete' }).click();
  await expect(page.getByText('1/9')).toBeVisible();
  await page.reload();
  await waitForPilot(page);
  await expect(page.getByText('1/9')).toBeVisible();

  await page.getByTestId('reset-progress').click();
  await expect(page.getByText('0/9')).toBeVisible();
  await page.reload();
  await waitForPilot(page);
  await expect(page.getByText('0/9')).toBeVisible();
});

test('mobile layout keeps the complete lesson and embedded Lens usable', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/learn/python-foundations/loops-over-lists');
  await waitForPilot(page);

  await expect(page.getByTestId('pilot-lesson-link')).toHaveCount(4);
  await expect(page.getByTestId('pilot-step-section')).toHaveCount(9);
  await revealLens(page, '2');

  const syntaxLens = page.locator('[data-lens-mode="syntax"]');
  await expect(syntaxLens).toContainText('count_passing');
  await syntaxLens.scrollIntoViewIfNeeded();
  await page.screenshot({
    path: path.join(evidenceRoot, 'mobile-loops.png'),
  });
});
