import { expect, test, type Page, type TestInfo } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const artifactRoot = path.resolve('artifacts/module-execution');
const screenshotDir = path.join(artifactRoot, 'screenshots');
const responseDir = path.join(artifactRoot, 'api-responses');
mkdirSync(screenshotDir, { recursive: true });
mkdirSync(responseDir, { recursive: true });

const supportedCases = [
  { id: 'MOD-ASSIGN-001', source: 'price = 100', final: { price: '100' } },
  {
    id: 'MOD-ASSIGN-002',
    source: 'price = 100\ntax = price * 0.16\ntotal = price + tax',
    final: { price: '100', tax: '16.0', total: '116.0' },
  },
  { id: 'MOD-ASSIGN-003', source: 'score = 10\nscore = score + 5', final: { score: '15' } },
  { id: 'MOD-EXPR-001', source: 'result = (10 + 5) * 2', final: { result: '30' } },
  {
    id: 'MOD-IF-001',
    source: "age = 20\nif age >= 18:\n    status = 'adult'\nelse:\n    status = 'minor'",
    final: { age: '20', status: "'adult'" },
  },
  {
    id: 'MOD-FOR-001',
    source: 'total = 0\nfor number in [1, 2, 3]:\n    total = total + number',
    final: { total: '6', number: '3' },
  },
  {
    id: 'MOD-WHILE-001',
    source: 'count = 0\nwhile count < 3:\n    count = count + 1',
    final: { count: '3' },
  },
  {
    id: 'MOD-LIST-001',
    source: 'numbers = [10, 20, 30]\nfirst = numbers[0]',
    final: { numbers: '[10, 20, 30]', first: '10' },
  },
  {
    id: 'MOD-LIST-002',
    source: 'numbers = [1, 2]\nnumbers.append(3)',
    final: { numbers: '[1, 2, 3]' },
  },
  {
    id: 'MOD-LIST-003',
    source: 'numbers = [1, 2, 3]\nnumbers[1] = 9',
    final: { numbers: '[1, 9, 3]' },
  },
] as const;

async function waitForHydration(page: Page) {
  await page.locator('html[data-hydrated="true"]').waitFor();
}

async function submitModule(page: Page, source: string, evidenceId: string) {
  await page.goto('/decode');
  await waitForHydration(page);
  const editor = page.getByTestId('code-editor').locator('.cm-content');
  await editor.click();
  await page.keyboard.press('ControlOrMeta+A');
  await page.keyboard.insertText(source);
  await page.keyboard.press('Escape');
  await expect(page.getByTestId('decode-sample-input')).toHaveCount(0);
  await expect(page.getByTestId('module-input-note')).toContainText('without sample input');
  const responsePromise = page.waitForResponse(
    (response) => response.url().endsWith('/analyze') && response.request().method() === 'POST',
  );
  await page.getByTestId('decode-visualize').click();
  const response = await responsePromise;
  expect(response.ok()).toBe(true);
  const body = await response.json();
  writeFileSync(
    path.join(responseDir, `${evidenceId}.json`),
    JSON.stringify(body, null, 2) + '\n',
  );
  return body;
}

function observeBrowserFailures(page: Page) {
  const consoleErrors: string[] = [];
  const failedRequests: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });
  page.on('requestfailed', (request) => {
    failedRequests.push(`${request.method()} ${request.url()} ${request.failure()?.errorText ?? ''}`);
  });
  return { consoleErrors, failedRequests };
}

async function assertNoPageOverflow(page: Page) {
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= document.documentElement.clientWidth,
    ),
  ).toBe(true);
}

test.describe('module execution in Decode', () => {
  for (const entry of supportedCases) {
    test(`${entry.id} renders all learner views`, async ({ page }) => {
      const failures = observeBrowserFailures(page);
      const body = await submitModule(page, entry.source, entry.id);
      expect(body.violation).toBeNull();
      expect(body.trace.scope.kind).toBe('module');
      expect(body.trace.call).toBeUndefined();
      await expect(page.getByTestId('decode-error')).toHaveCount(0);
      await expect(page.getByTestId('decode-unsupported')).toHaveCount(0);
      await expect(page.getByTestId('decode-playback')).toBeVisible();

      const end = page.getByRole('button', { name: 'End' });
      if (await end.isEnabled()) await end.click();
      await page.getByTestId('view-state').click();
      for (const [name, value] of Object.entries(entry.final)) {
        await expect(page.getByTestId(`state-binding-${name}`)).toContainText(value);
      }
      await page.getByTestId('view-explain').click();
      await expect(page.getByTestId('guided-trace-view')).toBeVisible();
      await page.getByTestId('view-structure').click();
      await expect(page.getByTestId('graph-inspector')).toBeVisible();
      await expect(page.getByTestId('graph-inspector')).toContainText('Program');
      await page.getByTestId('view-flow').click();
      await expect(page.getByTestId('learner-flow-view')).toBeVisible();
      await assertNoPageOverflow(page);
      expect(failures.consoleErrors).toEqual([]);
      expect(failures.failedRequests).toEqual([]);
      await page.screenshot({
        path: path.join(screenshotDir, `${entry.id}-desktop.png`),
        fullPage: true,
        animations: 'disabled',
      });
    });
  }

  test('critical price program synchronizes source and dependencies', async ({ page }) => {
    const body = await submitModule(page, supportedCases[1].source, 'MOD-ASSIGN-002-critical');
    expect(body.trace.steps.map((step: { line: number }) => step.line)).toEqual([1, 2, 3]);
    await expect(page.getByTestId('decode-step-count')).toContainText('Step 1 of 3');
    await page.getByTestId('view-explain').click();
    await expect(page.getByTestId('active-source-line-1')).toBeVisible();
    await page.getByRole('button', { name: 'Next' }).click();
    await expect(page.getByTestId('active-source-line-2')).toBeVisible();
    await page.getByTestId('view-flow').click();
    await expect(page.getByLabel('Operation inputs')).toContainText(/price\s*=\s*100/);
    await expect(page.getByLabel('Operation inputs')).toContainText(/0\.16\s*=\s*0\.16/);
    await page.getByRole('button', { name: 'Next' }).click();
    await page.getByTestId('view-explain').click();
    await expect(page.getByTestId('active-source-line-3')).toBeVisible();
    await page.getByTestId('view-flow').click();
    await expect(page.getByLabel('Operation inputs')).toContainText(/tax\s*=\s*16\.0/);
    await expect(page.getByText('price + tax', { exact: true })).toBeVisible();
  });

  test('comment-only source has a precise empty state', async ({ page }) => {
    const body = await submitModule(page, '# Calculate the final price', 'MOD-EMPTY-001');
    expect(body.trace.scope.kind).toBe('module');
    expect(body.trace.steps).toEqual([]);
    expect(body.violation).toBeNull();
    await expect(page.getByTestId('decode-empty-program')).toContainText(
      'This file contains definitions or comments but nothing to run.',
    );
    await expect(page.getByTestId('decode-error')).toHaveCount(0);
  });

  test('unknown call stops before dependent state', async ({ page }) => {
    const body = await submitModule(
      page,
      'value = unknown_function()\nresult = value + 1',
      'MOD-UNSUPPORTED-001',
    );
    expect(body.violation.construct).toBe('call');
    expect(body.trace.steps).toEqual([]);
    await expect(page.getByTestId('decode-unsupported')).toContainText(
      'This version does not yet visualize call.',
    );
    await expect(page.getByTestId('state-binding-value')).toHaveCount(0);
    await expect(page.getByTestId('state-binding-result')).toHaveCount(0);
  });

  for (const viewport of [
    { name: 'desktop', width: 1440, height: 1000 },
    { name: 'tablet', width: 1024, height: 768 },
    { name: 'mobile', width: 390, height: 844 },
  ] as const) {
    for (const matrixCase of [
      supportedCases[1],
      supportedCases[5],
      {
        id: 'MOD-UNSUPPORTED-001',
        source: 'value = unknown_function()\nresult = value + 1',
        final: {},
      },
    ] as const) {
      test(`${matrixCase.id} ${viewport.name} visual matrix`, async ({ page }, testInfo: TestInfo) => {
        await page.setViewportSize({ width: viewport.width, height: viewport.height });
        const failures = observeBrowserFailures(page);
        await submitModule(page, matrixCase.source, `${matrixCase.id}-${viewport.name}`);
        if (matrixCase.id === 'MOD-UNSUPPORTED-001') {
          await expect(page.getByTestId('decode-unsupported')).toBeVisible();
        } else {
          await expect(page.getByTestId('decode-playback')).toBeVisible();
          await page.getByRole('button', { name: 'End' }).click();
        }
        await assertNoPageOverflow(page);
        expect(failures.consoleErrors, testInfo.title).toEqual([]);
        expect(failures.failedRequests, testInfo.title).toEqual([]);
        await page.screenshot({
          path: path.join(screenshotDir, `${matrixCase.id}-${viewport.name}.png`),
          fullPage: true,
          animations: 'disabled',
        });
      });
    }
  }
});
