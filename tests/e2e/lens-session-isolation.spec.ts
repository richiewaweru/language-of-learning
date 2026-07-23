import { expect, test, type Locator, type Page } from '@playwright/test';

async function waitForHydration(page: Page) {
  await page.locator('html[data-hydrated="true"]').waitFor();
}

async function replaceEditor(workspace: Locator, page: Page, source: string) {
  const editor = workspace.getByTestId('code-editor').locator('.cm-content');
  await editor.click();
  await page.keyboard.press('ControlOrMeta+A');
  await page.keyboard.insertText(source);
  await page.keyboard.press('Escape');
}

test.describe('Lens session isolation harness', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/internal/lens-session-harness');
    await waitForHydration(page);
    await expect(page.getByTestId('workspace-a')).toHaveAttribute('data-session-initialized', 'true');
    await expect(page.getByTestId('workspace-b')).toHaveAttribute('data-session-initialized', 'true');
    await expect(page.getByTestId('workspace-a')).toHaveAttribute('data-sessions-ready', 'true');
  });

  test('keeps code, artifacts, frames, views, and reset instance-local', async ({ page }) => {
    const left = page.getByTestId('workspace-a');
    const right = page.getByTestId('workspace-b');

    await replaceEditor(left, page, 'first = 5\nsecond = first + 2');
    await left.getByTestId('decode-visualize').click();
    await right.getByTestId('decode-visualize').click();
    await expect(left.getByTestId('decode-playback')).toBeVisible();
    await expect(right.getByTestId('decode-playback')).toBeVisible();

    await left.getByTestId('step-next').click();
    await expect(left.getByTestId('current-frame')).toHaveText('1');
    await expect(right.getByTestId('current-frame')).toHaveText('0');

    await left.getByRole('tab', { name: 'State', exact: true }).click();
    await expect(left.getByRole('tab', { name: 'State', exact: true })).toHaveAttribute('aria-selected', 'true');
    await expect(right.getByRole('tab', { name: 'Flow', exact: true })).toHaveAttribute('aria-selected', 'true');

    await right.getByTestId('lens-reset').click();
    await expect(left.getByTestId('current-frame')).toHaveText('1');
    await expect(left.getByTestId('code-editor').locator('.cm-content')).toContainText('first = 5');
    await expect(right.getByTestId('code-editor').locator('.cm-content')).toContainText('first = 99');
  });

  test('keeps capabilities and persistence namespaces instance-local', async ({ page }) => {
    const left = page.getByTestId('workspace-a');
    const right = page.getByTestId('workspace-b');
    const leftEditor = left.getByTestId('code-editor');
    const rightEditor = right.getByTestId('code-editor');

    await expect(leftEditor).toHaveAttribute('data-readonly', 'false');
    await expect(rightEditor).toHaveAttribute('data-readonly', 'true');
    await expect(leftEditor.locator('.cm-content')).toHaveAttribute('contenteditable', 'true');
    await expect(rightEditor.locator('.cm-content')).toHaveAttribute('contenteditable', 'false');
    await left.getByTestId('decode-visualize').click();
    await right.getByTestId('decode-visualize').click();
    await expect(left.getByRole('tab', { name: 'Graph Inspector' })).toBeVisible();
    await expect(right.getByRole('tab', { name: 'Graph Inspector' })).toHaveCount(0);
    await expect(right.getByRole('tab', { name: 'Guided Trace' })).toHaveCount(0);

    const leftKey = await left.getByTestId('persistence-key').textContent();
    const rightKey = await right.getByTestId('persistence-key').textContent();
    expect(leftKey).toBe('lens:v1:harness:isolation:a');
    expect(rightKey).toBe('lens:v1:harness:isolation:b');
    expect(leftKey).not.toBe(rightKey);
  });

  test('restores durable state, regenerates artifacts, and keeps owner loading privileged', async ({ page }) => {
    const left = page.getByTestId('workspace-a');
    const right = page.getByTestId('workspace-b');

    await replaceEditor(left, page, 'saved_value = 17\nresult = saved_value + 3');
    await left.getByTestId('decode-visualize').click();
    await left.getByTestId('step-next').click();
    await left.getByRole('tab', { name: 'State', exact: true }).click();

    const stored = await page.evaluate(() => {
      const raw = localStorage.getItem('lens:v1:harness:isolation:a');
      return raw ? JSON.parse(raw) : null;
    });
    expect(stored.source).toContain('saved_value = 17');
    expect(stored.activeView).toBe('state');
    expect(stored.artifacts).toBeUndefined();

    await page.reload();
    await expect(page.getByTestId('workspace-a')).toHaveAttribute('data-sessions-ready', 'true');
    await expect(left.getByTestId('code-editor').locator('.cm-content')).toContainText('saved_value = 17');
    await expect(left.getByRole('tab', { name: 'State', exact: true })).toHaveAttribute('aria-selected', 'true');
    await expect(left.getByTestId('decode-playback')).toBeVisible();

    await expect(right.getByTestId('code-editor').locator('.cm-content')).toContainText('first = 99');
    await right.getByTestId('owner-load-program').click();
    await expect(right.getByTestId('code-editor').locator('.cm-content')).toContainText('owner_loaded = 42');
    await expect(right.getByTestId('code-editor')).toHaveAttribute('data-readonly', 'true');
  });
});
