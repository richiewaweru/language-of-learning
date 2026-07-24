import { expect, test } from '@playwright/test';

for (const legacyPath of [
  '/learn/python-foundations/loops/accumulate',
  '/learn/python-foundations/loops/search',
  '/learn/python-foundations/loops/array-update',
] as const) {
  test(`${legacyPath} redirects to the current loops lesson`, async ({ page }) => {
    await page.goto(legacyPath);
    await expect(page).toHaveURL('/learn/python-foundations/loops-over-lists');
    await expect(page.getByRole('heading', { name: 'Loops over Lists', exact: true })).toBeVisible();
    await expect(page.getByTestId('phase-2-lesson-player')).toHaveAttribute(
      'data-schema-version',
      '4',
    );
  });
}
