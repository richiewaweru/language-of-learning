import { expect, test, type Page } from '@playwright/test';

const editedSource = 'price = 100\ntax = price * 0.16\ntotal = price + tax';

async function waitForHydration(page: Page) {
  await page.locator('html[data-hydrated="true"]').waitFor();
}

async function replaceSource(page: Page, source: string) {
  const editor = page.getByTestId('code-editor').locator('.cm-content');
  await editor.click();
  await page.keyboard.press('ControlOrMeta+A');
  await page.keyboard.insertText(source);
  await page.keyboard.press('Escape');
}

test.describe('Decode session regression', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/decode');
    await waitForHydration(page);
  });

  test('editing and rerunning replaces every dependent artifact', async ({ page }) => {
    await replaceSource(page, editedSource);
    await page.getByTestId('decode-visualize').click();
    await page.getByTestId('step-end').click();
    await page.getByRole('tab', { name: 'State', exact: true }).click();
    await expect(page.getByTestId('state-binding-total')).toContainText('116.0');

    await replaceSource(page, editedSource.replace('100', '200'));
    await page.getByTestId('decode-visualize').click();
    await page.getByTestId('step-end').click();
    await page.getByRole('tab', { name: 'State', exact: true }).click();
    await expect(page.getByTestId('state-binding-total')).toContainText('232.0');
    await expect(page.getByTestId('state-binding-total')).not.toContainText('116.0');
  });

  test('failed syntax clears prior verified output', async ({ page }) => {
    await replaceSource(page, editedSource);
    await page.getByTestId('decode-visualize').click();
    await expect(page.locator('[data-verified-output="true"]')).toBeVisible();

    await replaceSource(page, 'price =');
    await page.getByTestId('decode-visualize').click();
    await expect(page.getByTestId('decode-error')).toBeVisible();
    await expect(page.locator('[data-verified-output="true"]')).toHaveCount(0);
    await expect(page.getByTestId('decode-playback')).toHaveCount(0);
    await expect(page.getByTestId('state-binding-total')).toHaveCount(0);
  });

  test('refresh and navigation preserve Decode no-restore behavior', async ({ page }) => {
    await replaceSource(page, 'unique_decode_edit = 731');
    await page.reload();
    await waitForHydration(page);
    await expect(page.getByTestId('code-editor').locator('.cm-content')).not.toContainText(
      'unique_decode_edit',
    );

    await replaceSource(page, 'unique_decode_edit = 913');
    await page.goto('/about');
    await page.goto('/decode');
    await waitForHydration(page);
    await expect(page.getByTestId('code-editor').locator('.cm-content')).not.toContainText(
      'unique_decode_edit',
    );
  });
});
