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

async function reachSyntax(page: import('@playwright/test').Page, prediction: string) {
  await page.getByTestId('complete-step').click();
  await page.getByTestId('complete-step').click();
  await page.getByRole('button', { name: prediction, exact: true }).click();
  await page.getByTestId('complete-step').click();
  await expect(page.getByTestId('pilot-active-step')).toHaveAttribute(
    'data-step-type',
    'map-shape-to-syntax',
  );
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
  test(`${item.lesson} binds its own canonical scene`, async ({ page }) => {
    await page.goto(`/learn/python-foundations/${item.lesson}`);
    await waitForPilot(page);
    await expect(page.getByTestId('pilot-lesson-link')).toHaveCount(4);
    await reachSyntax(page, item.prediction);
    const workspace = page.getByTestId('pilot-lens-workspace');
    await expect(workspace).toHaveAttribute('data-mode', 'watch');
    await expect(workspace).toContainText(item.source);
    await expect(workspace).not.toContainText(item.forbidden);
    await expect(workspace).not.toContainText('calculate_total(2, 4, 6, 8)');
    await expect(workspace.getByText('Lens workspace')).toBeVisible();
    await page.screenshot({
      path: path.join(evidenceRoot, item.screenshot),
      fullPage: true,
    });
  });
}

test('prediction precedes syntax and watch/explore are distinct', async ({ page }) => {
  await page.goto('/learn/python-foundations/values-and-variables');
  await waitForPilot(page);
  await page.getByTestId('complete-step').click();
  await page.getByTestId('complete-step').click();
  await expect(page.getByTestId('pilot-active-step')).toHaveAttribute('data-step-type', 'predict');
  await expect(page.getByText('price = 100', { exact: true })).toBeVisible();
  await expect(page.getByTestId('pilot-lens-workspace')).toContainText('Predict before reveal');
  await page.getByRole('button', { name: 'price = 100', exact: true }).click();
  await page.getByTestId('complete-step').click();
  await expect(page.getByTestId('pilot-active-step')).toHaveAttribute(
    'data-step-type',
    'map-shape-to-syntax',
  );
  await expect(page.getByTestId('pilot-lens-workspace')).toContainText('price = 100');
  await page.getByTestId('complete-step').click();
  await expect(page.getByTestId('pilot-lens-workspace')).toHaveAttribute('data-mode', 'watch');
  await page.getByTestId('complete-step').click();
  await expect(page.getByTestId('pilot-lens-workspace')).toHaveAttribute('data-mode', 'explore');
  await page.getByRole('button', { name: 'Change the starting price' }).click();
  await expect(page.getByTestId('pilot-lens-workspace')).toContainText('price = 200');
});

test('progress persists through refresh and reset clears it', async ({ page }) => {
  await page.goto('/learn/python-foundations/functions-and-returns');
  await waitForPilot(page);
  await page.getByTestId('complete-step').click();
  await expect(page.getByText('1/9')).toBeVisible();
  await page.reload();
  await expect(page.getByText('1/9')).toBeVisible();
  await page.getByTestId('reset-progress').click();
  await expect(page.getByText('0/9')).toBeVisible();
  await page.reload();
  await expect(page.getByText('0/9')).toBeVisible();
});

test('mobile layout remains usable', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/learn/python-foundations/loops-over-lists');
  await waitForPilot(page);
  await expect(page.getByTestId('pilot-lesson-link')).toHaveCount(4);
  await reachSyntax(page, '2');
  await expect(page.getByTestId('pilot-lens-workspace')).toContainText('count_passing');
  await page.screenshot({
    path: path.join(evidenceRoot, 'mobile-loops.png'),
    fullPage: true,
  });
});
