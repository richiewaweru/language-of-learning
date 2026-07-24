import { expect, test, type Page } from '@playwright/test';
import path from 'node:path';

const screenshotDir = path.resolve('tests/e2e/__screenshots__');
test.setTimeout(90_000);

const supportedCases = [
  {
    id: 'renamed-accumulation',
    source: 'def combine(readings):\n    memory = 0\n    for reading in readings:\n        memory = memory + reading\n    return memory',
    args: '[3, 5, 7]',
    result: '15',
  },
  {
    id: 'count-condition',
    source: 'def tally(entries):\n    matches = 0\n    for entry in entries:\n        if entry > 2:\n            matches = matches + 1\n    return matches',
    args: '[1, 3, 4]',
    result: '2',
  },
  {
    id: 'linear-search',
    source: 'def locate(entries):\n    for entry in entries:\n        if entry == 8:\n            return entry\n    return -1',
    args: '[2, 8, 10]',
    result: '8',
  },
  {
    id: 'early-return',
    source: 'def first_large(samples):\n    for sample in samples:\n        if sample > 10:\n            return sample\n    return -1',
    args: '[4, 12, 30]',
    result: '12',
  },
  {
    id: 'array-update',
    source: 'def revise(values):\n    values[0] = 9\n    return values',
    args: '[1, 2, 3]',
    result: '[9, 2, 3]',
  },
  {
    id: 'swap',
    source: 'def exchange(values):\n    temporary = values[0]\n    values[0] = values[1]\n    values[1] = temporary\n    return values',
    args: '[1, 2]',
    result: '[2, 1]',
  },
  {
    id: 'binary-search',
    source: 'def seek(entries, wanted):\n    start = 0\n    end = len(entries) - 1\n    while start <= end:\n        pivot = (start + end) // 2\n        if entries[pivot] == wanted:\n            return pivot\n        if entries[pivot] < wanted:\n            start = pivot + 1\n        else:\n            end = pivot - 1\n    return -1',
    args: '[1, 3, 5, 7, 9], 7',
    result: '3',
  },
  {
    id: 'generic-double',
    source: 'def double(value):\n    result = value * 2\n    return result',
    args: '6',
    result: '12',
  },
] as const;

async function waitForHydration(page: Page) {
  await page.locator('html[data-hydrated="true"]').waitFor();
}

async function pasteProgram(page: Page, source: string, args: string) {
  await page.goto('/decode');
  await waitForHydration(page);
  const editor = page.getByTestId('code-editor').locator('.cm-content');
  await editor.click();
  await page.keyboard.press('ControlOrMeta+A');
  await page.keyboard.insertText(source);
    await page.keyboard.press('Escape');
    await page.getByLabel('Sample input').fill(args);
    await page.getByRole('button', { name: 'Visualize' }).click();
    await expect(page.getByRole('button', { name: 'Visualize' })).toBeEnabled();
}

test.describe('Decode pasted-program acceptance', () => {
  for (const program of supportedCases) {
    test(`${program.id} derives synchronized learner views`, async ({ page }) => {
      await pasteProgram(page, program.source, program.args);

      await expect(page.getByTestId('decode-error')).toHaveCount(0);
      await expect(page.getByTestId('decode-unsupported')).toHaveCount(0);
      await expect(page.getByTestId('learner-flow-view')).toBeVisible();
      await expect(page.getByTestId('flow-result')).toContainText('Waiting for return');

      await page.getByRole('button', { name: 'Next' }).click();
      await page.getByRole('tab', { name: 'State', exact: true }).click();
      await expect(page.getByTestId('semantic-state-view')).toBeVisible();
      await page.getByRole('tab', { name: 'Guided Trace' }).click();
      await expect(page.getByTestId('guided-trace-view')).toBeVisible();
      await expect(page.getByLabel('Active source range')).toBeVisible();
      await page.getByRole('tab', { name: 'Graph Inspector' }).click();
      await expect(page.getByTestId('graph-inspector')).toBeVisible();

      await page.getByRole('tab', { name: 'Flow', exact: true }).click();
      const end = page.getByRole('button', { name: 'End' });
      if (await end.isEnabled()) await end.click();
      await expect(page.getByTestId('flow-result')).toContainText(program.result);

      await page.getByRole('button', { name: 'Explain this step' }).click();
      await expect(page.getByTestId('ask-lens-response')).toBeVisible({ timeout: 40_000 });
      await expect(page.getByTestId('ask-lens-response')).toContainText(
        /AI explanation|Verified teaching context received/,
        { timeout: 40_000 },
      );
      if (program.id === 'renamed-accumulation') {
        await page.getByRole('button', { name: 'Explain the whole process' }).click();
        await expect(page.getByTestId('ask-lens-response')).toContainText(
          /AI explanation|Verified teaching context received/,
          { timeout: 40_000 },
        );
        await page.getByLabel('Ask about this execution').fill('Why did the value change?');
        await page.getByRole('button', { name: 'Ask', exact: true }).click();
        await expect(page.getByTestId('ask-lens-response')).toContainText(
          /AI explanation|Verified teaching context received/,
          { timeout: 40_000 },
        );
      }

      const hasHorizontalOverflow = await page.evaluate(
        () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
      );
      expect(hasHorizontalOverflow).toBe(false);
      await page.screenshot({
        path: path.join(screenshotDir, `decode-${program.id}.png`),
        fullPage: true,
        animations: 'disabled',
      });
    });
  }

  test('unsupported dictionary comprehension stays honest', async ({ page }) => {
    await pasteProgram(
      page,
      'def map_values(items):\n    return {item: item * 2 for item in items}',
      '[1, 2]',
    );
    await expect(page.getByTestId('decode-unsupported')).toContainText('Execution not verified');
    await expect(page.getByTestId('unsupported-workspace')).toContainText('Verified visualization unavailable');
    await expect(page.getByTestId('learner-flow-view')).toHaveCount(0);
    await page.getByRole('button', { name: 'Explain this step' }).click();
    await expect(page.getByTestId('ask-lens-response')).toContainText('will not guess', { timeout: 40_000 });
    await page.screenshot({
      path: path.join(screenshotDir, 'decode-unsupported.png'),
      fullPage: true,
      animations: 'disabled',
    });
  });

  const canonicalRejections = [
    {
      id: 'builtin-shadowing',
      source: 'def calculate(max, values):\n    return max(values)',
      args: '[1, 2, 3]',
      message:
        'Lens does not support shadowing built-in function names. Rename the parameter or local variable.',
    },
    {
      id: 'enumerate',
      source:
        'def indexed_total(values):\n    total = 0\n    for index, value in enumerate(values):\n        total = total + index + value\n    return total',
      args: '[1, 2, 3]',
      message:
        'Enumerate is not yet supported in Lens. Use an index-based range(len(values)) loop for now.',
    },
  ] as const;

  for (const rejection of canonicalRejections) {
    test(`${rejection.id} renders its canonical atomic rejection`, async ({ page }) => {
      await pasteProgram(page, rejection.source, rejection.args);

      await expect(page.getByTestId('decode-error')).toHaveCount(0);
      await expect(page.getByTestId('decode-unsupported')).toContainText(rejection.message);
      await expect(page.getByTestId('unsupported-workspace')).toContainText(rejection.message);
      await expect(page.getByTestId('decode-playback')).toHaveCount(0);
      await expect(page.locator('.workspace .view-tabs [role="tab"]')).toHaveCount(0);
      await expect(page.getByTestId('learner-flow-view')).toHaveCount(0);
      await expect(page.getByTestId('flow-result')).toHaveCount(0);
    });
  }

  test('Decode and Ask Lens remain usable on mobile with reduced motion', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await pasteProgram(page, supportedCases[0].source, supportedCases[0].args);
    await expect(page.getByTestId('decode-error')).toHaveCount(0);
    await expect(page.getByTestId('learner-flow-view')).toBeVisible();
    await expect(page.getByTestId('ask-lens')).toBeVisible();
    const hasHorizontalOverflow = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
    );
    expect(hasHorizontalOverflow).toBe(false);
    await page.screenshot({
      path: path.join(screenshotDir, 'decode-mobile.png'),
      fullPage: true,
      animations: 'disabled',
    });
  });
});
