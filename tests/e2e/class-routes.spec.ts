import { expect, test } from '@playwright/test';
import path from 'node:path';

const screenshotDir = path.resolve('tests/e2e/__screenshots__');

async function waitForHydration(page: import('@playwright/test').Page) {
  await page.locator('html[data-hydrated="true"]').waitFor();
}

for (const lesson of [
  { slug: 'search', title: 'Linear search — stop at the first match' },
  { slug: 'array-update', title: 'Array mutation — update a value in place' },
] as const) {
  test(`${lesson.slug} class route has a complete learning workspace and anatomy`, async ({ page }) => {
    await page.goto(`/learn/python-foundations/loops/${lesson.slug}`);
    await waitForHydration(page);
    await expect(page.getByRole('heading', { name: lesson.title })).toBeVisible();
    await expect(page.getByTestId('lesson-workspace')).toBeVisible();
    await expect(page.getByTestId('learner-flow-view')).toBeVisible();
    await expect(page.getByTestId('prediction-prompt')).toBeVisible();
    await expect(page.getByText('More lesson activities')).toBeVisible();

    await page.getByText('More lesson activities').click();
    await page.getByRole('link', { name: 'Open full lesson anatomy' }).click();
    await expect(page).toHaveURL(`/learn/python-foundations/${lesson.slug}`);
    await expect(page.getByTestId('lesson-question')).toBeVisible();
    await expect(page.getByTestId('lesson-static-preview')).toBeVisible();
    await expect(page.getByTestId('prediction-prompt')).toBeVisible();
    await expect(page.getByTestId('lesson-execution')).toBeVisible();
    await expect(page.getByTestId('lesson-pattern')).toBeVisible();
    await expect(page.getByTestId('lesson-variation')).toBeVisible();
    await expect(page.getByTestId('comparison-panel')).toBeVisible();
    await expect(page.getByTestId('lesson-transfer')).toBeVisible();
    const hasHorizontalOverflow = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
    );
    expect(hasHorizontalOverflow).toBe(false);
    await page.screenshot({
      path: path.join(screenshotDir, `class-${lesson.slug}.png`),
      fullPage: true,
      animations: 'disabled',
    });
  });
}
