import { expect, test } from '@playwright/test';

const lessonUrl = '/learn/python-foundations/loops/accumulate';

async function waitForHydration(page: import('@playwright/test').Page) {
  await page.locator('html[data-hydrated="true"]').waitFor();
}

test.describe('flagship accumulator lesson', () => {
  test('matches the approved learner-facing composition', async ({ page }) => {
    await page.goto(lessonUrl);
    await waitForHydration(page);

    const workspace = page.getByTestId('lesson-workspace');
    await expect(workspace).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Build a Total with a Loop' })).toBeVisible();
    await expect(page.getByTestId('learner-flow-view')).toContainText('2');
    await expect(page.getByTestId('learner-flow-view')).toContainText('6');
    await expect(page.getByTestId('learner-flow-view')).toContainText('12');
    await expect(page.getByTestId('flow-result')).toContainText('Waiting for return');
    await expect(page.getByTestId('current-item-token')).toContainText('6');
    await expect(page.getByTestId('selected-collection-cell')).toContainText('6');
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
    await waitForHydration(page);

    const timeline = page.getByTestId('playback-timeline');
    await expect(timeline).toContainText('Step 8 of 11');
    await page.getByRole('button', { name: 'Next' }).click();
    await expect(timeline).toContainText('Step 9 of 11');
    await expect(page.getByTestId('current-item-value')).toHaveText('8');
    await expect(page.getByTestId('current-state-value')).toHaveText('12');
    await expect(page.getByTestId('flow-result')).toContainText('Waiting for return');
    await expect(page.getByTestId('code-learning-panel').locator('[aria-current="step"]')).toContainText('for number in numbers');

    await page.getByRole('button', { name: 'End' }).click();
    await expect(page.getByTestId('flow-result')).toContainText('20');
    await expect(page.getByTestId('flow-result')).toHaveAttribute('aria-label', 'Returned result 20');
    await expect(page).toHaveScreenshot('flagship-accumulate-completed.png', {
      animations: 'disabled',
      fullPage: false,
      maxDiffPixelRatio: 0.01,
    });
  });

  test('projects one semantic step into State, Guided Trace, and Graph Inspector', async ({ page }) => {
    await page.goto(lessonUrl);
    await waitForHydration(page);

    await page.getByRole('tab', { name: 'State', exact: true }).click();
    await expect(page.getByTestId('semantic-state-view')).toBeVisible();
    await expect(page.getByTestId('semantic-state-view')).toContainText('Previous value');
    await expect(page.getByTestId('semantic-state-view')).toContainText('Current frame');
    const totalRow = page.locator('[data-entity-label="total"]');
    await expect(totalRow.getByTestId('state-current-value')).toHaveText('12');
    await expect(totalRow.getByTestId('state-previous-value')).toHaveText('6');
    await expect(totalRow).toHaveClass(/changed/);

    await page.getByRole('tab', { name: 'Guided Trace' }).click();
    await expect(page.getByTestId('guided-trace-view')).toBeVisible();
    await expect(page.getByTestId('guided-trace-view').locator('mark')).toBeVisible();
    await expect(page.getByTestId('guided-trace-view').locator('mark')).toContainText('total + number');
    await expect(page.getByTestId('guided-trace-view').getByRole('heading', { level: 3 })).toHaveCount(1);

    await page.getByRole('tab', { name: 'Graph Inspector' }).click();
    await expect(page.getByTestId('graph-inspector')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Zoom to fit' })).toBeVisible();
    await expect(page.getByLabel('Graph minimap')).toBeVisible();
    await expect(page.getByLabel('Active neighborhood')).toBeChecked();
    await expect(page.getByLabel('Graph minimap').locator('.active')).not.toHaveCount(0);
    const inactiveNode = page.getByTestId('graph-inspector').locator('[data-focus="false"]').first();
    await expect(inactiveNode).toBeVisible();
    expect(Number(await inactiveNode.evaluate((element) => getComputedStyle(element).opacity))).toBeLessThan(0.5);
    await page.getByRole('button', { name: 'Zoom in' }).click();
    await expect(page.locator('.zoom-layer')).toHaveAttribute('style', /scale\(1\.1\)/);
    await page.getByText('Fallback symbol legend').click();
    await expect(page.getByText('Generic supported behavior')).toBeVisible();
    await expect(page.getByText('Unsupported behavior')).toBeVisible();
    await expect(page).toHaveScreenshot('flagship-graph-inspector-fallbacks.png', {
      animations: 'disabled',
      fullPage: false,
      maxDiffPixelRatio: 0.01,
    });
  });

  test('supports keyboard operation and reduced motion', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto(lessonUrl);
    await waitForHydration(page);

    const stateTab = page.getByRole('tab', { name: 'State', exact: true });
    await stateTab.focus();
    await page.keyboard.press('Enter');
    await expect(stateTab).toHaveAttribute('aria-selected', 'true');
    await expect(page.getByTestId('semantic-state-view')).toBeVisible();

    await page.getByRole('tab', { name: 'Flow', exact: true }).focus();
    await page.keyboard.press('Enter');
    const transitionDuration = await page.getByTestId('current-item-token').evaluate(
      (element) => getComputedStyle(element).transitionDuration,
    );
    expect(transitionDuration).toBe('0s');

    await page.getByRole('button', { name: 'Next' }).focus();
    await page.keyboard.press('Enter');
    await expect(page.getByTestId('playback-timeline')).toContainText('Step 9 of 11');
  });

  test('stays coherent on a mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(lessonUrl);
    await waitForHydration(page);

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
    await waitForHydration(page);
    await expect(page.getByTestId('hero-demo')).toBeVisible();
    await expect(page.getByTestId('hero-demo').getByTestId('current-state-value')).toHaveText('12');
    await expect(page.getByTestId('hero-demo')).not.toContainText('bindings');
  });

  test('Decode opens with a useful engine-backed example', async ({ page }) => {
    await page.goto('/decode');
    await waitForHydration(page);
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
