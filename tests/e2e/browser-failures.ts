import { expect, type Page, type Request } from '@playwright/test';

const failures = new WeakMap<Page, string[]>();

export function isOwnedBrowserFailure(request: Request) {
  const abortedExternalFont =
    request.url().startsWith('https://fonts.gstatic.com/')
    && request.failure()?.errorText === 'net::ERR_ABORTED';
  return !abortedExternalFont;
}

export function monitorBrowserFailures(page: Page) {
  const messages: string[] = [];
  failures.set(page, messages);
  page.on('console', (message) => {
    if (message.type() === 'error') messages.push(`console: ${message.text()}`);
  });
  page.on('requestfailed', (request) => {
    if (isOwnedBrowserFailure(request)) {
      messages.push(
        `request: ${request.method()} ${request.url()} ${request.failure()?.errorText ?? ''}`,
      );
    }
  });
}

export function expectNoBrowserFailures(page: Page) {
  expect(failures.get(page) ?? []).toEqual([]);
}
