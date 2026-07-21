import { expect, test } from '@playwright/test';

const lessonUrl = '/learn/python-foundations/loops/accumulate';

test.describe('flagship accumulator lesson', () => {
  test('matches the approved learner-facing composition', async ({ page }) => {
    await page.goto(lessonUrl);

    const workspace = page.getByTestId('lesson-workspace');
    await expect(workspace).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Build a Total with a Loop' })).toBeVisible();
    await expect(page.getByTestId('learner-flow-view')).toContainText('2');
    await expect(page.getByTestId('learner-flow-view')).toContainText('6');
    await expect(page.getByTestId('learner-flow-view')).toContainText('12');
    await expect(page.getByTestId('learner-flow-view')).toContainText('20');
    await expect(page.getByTestId('prediction-prompt')).toContainText('next number is 8');
    await expect(page.getByTestId('pattern-summary-band')).toContainText('Pattern: Accumulate');

    const hasHorizontalOverflow = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
    );
    expect(hasHorizontalOverflow).toBe(false);

    await expect(page).toHaveScreenshot('flagship-accumulate.png', {
      animations: 'disabled',
      fullPage: false,
      maxDiffPixelRatio: 0.01,
    });
  });

  test('keeps code, flow, timeline, and explanation synchronized', async ({ page }) => {
    await page.goto(lessonUrl);

    const timeline = page.getByTestId('playback-timeline');
    await expect(timeline).toContainText('Step 8 of 11');
    await page.getByRole('button', { name: 'Next' }).click();
    await expect(timeline).toContainText('Step 9 of 11');
    await expect(page.getByTestId('learner-flow-view')).toContainText('Current item 8');
    await expect(page.getByTestId('learner-flow-view')).toContainText('Running total 12');
    await expect(page.getByTestId('code-learning-panel').locator('[aria-current="step"]')).toContainText('for number in numbers');
  });

  test('stays coherent on a mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(lessonUrl);

    await expect(page.getByRole('tab', { name: 'Visual' })).toBeVisible();
    await expect(page.getByTestId('learner-flow-view')).toBeVisible();
    await expect(page.getByText('Menu')).toBeVisible();
    const hasHorizontalOverflow = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
    );
    expect(hasHorizontalOverflow).toBe(false);

    await expect(page).toHaveScreenshot('flagship-accumulate-mobile.png', {
      animations: 'disabled',
      fullPage: false,
      maxDiffPixelRatio: 0.01,
    });
  });
});

test.describe('learner route integration', () => {
  test('home uses the learner projection instead of the technical graph', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByTestId('hero-demo')).toBeVisible();
    await expect(page.getByTestId('hero-demo').getByTestId('learner-flow-view')).toContainText('Running total 12');
    await expect(page.getByTestId('hero-demo')).not.toContainText('bindings');
  });

  test('Decode opens with a useful engine-backed example', async ({ page }) => {
    await page.goto('/decode');
    await expect(page.getByTestId('view-structure')).toBeVisible();
    await expect(page.getByTestId('pattern-hit')).toContainText('Accumulate');
    await expect(page.getByLabel('Sample input')).toHaveValue('[2, 4, 6, 8]');
  });

  test('pathway communicates position, next action, and lesson detail', async ({ page }) => {
    await page.goto('/learn/python-foundations');
    await expect(page.getByRole('navigation', { name: 'Learning navigation' })).toBeVisible();
    await expect(page.getByText('Current lesson')).toBeVisible();
    await expect(page.getByRole('link', { name: 'Continue lesson' })).toBeVisible();
  });
});
