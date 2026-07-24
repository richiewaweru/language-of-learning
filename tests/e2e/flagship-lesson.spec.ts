import { expect, test } from '@playwright/test';

async function waitForHydration(page: import('@playwright/test').Page) {
  await page.locator('html[data-hydrated="true"]').waitFor();
}

test.describe('learner route integration', () => {
  test('home uses the learner projection and links to the current flagship lesson', async ({ page }) => {
    await page.goto('/');
    await waitForHydration(page);
    await expect(page.getByTestId('hero-demo')).toBeVisible();
    await expect(page.getByTestId('hero-demo').getByTestId('current-state-value')).toHaveText('12');
    await expect(page.getByTestId('hero-demo')).not.toContainText('bindings');
    await expect(page.getByRole('link', { name: 'Start learning' })).toHaveAttribute(
      'href',
      '/learn/python-foundations/values-and-variables',
    );
  });

  test('Decode opens with a useful engine-backed example', async ({ page }) => {
    await page.goto('/decode');
    await waitForHydration(page);
    await expect(page.locator('.workspace-main[data-testid="view-flow"]')).toBeVisible();
    await expect(page.getByRole('tab').allTextContents()).resolves.toEqual([
      'Paste Code',
      'Examples',
      'Flow',
      'State',
      'Guided Trace',
      'Graph Inspector',
    ]);
    await expect(page.getByTestId('pattern-hit')).toContainText('Accumulate');
    await expect(page.getByLabel('Sample input')).toHaveValue('[2, 4, 6, 8]');
  });

  test('pathway exposes the four current lessons and their next actions', async ({ page }) => {
    await page.goto('/learn/python-foundations');
    await expect(page.getByRole('navigation', { name: 'Breadcrumb' })).toBeVisible();
    await expect(page.getByTestId('pilot-lesson-index').getByRole('link')).toHaveCount(4);
    await expect(page.getByRole('link', { name: /Values and Variables/ })).toHaveAttribute(
      'href',
      '/learn/python-foundations/values-and-variables',
    );
    await expect(page.getByRole('link', { name: /Loops over Lists/ })).toHaveAttribute(
      'href',
      '/learn/python-foundations/loops-over-lists',
    );
  });
});
