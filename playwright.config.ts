import { defineConfig } from '@playwright/test';

const channel = process.env.PLAYWRIGHT_CHANNEL;
const apiPort = process.env.LOL_API_PORT ?? '8000';
const webPort = process.env.LOL_WEB_PORT ?? '4173';
const apiBase = `http://127.0.0.1:${apiPort}`;
const webBase = `http://127.0.0.1:${webPort}`;

export default defineConfig({
  testDir: './tests/e2e',
  outputDir: '.codex-tmp/playwright-results',
  snapshotPathTemplate: '{testDir}/__screenshots__/{arg}{ext}',
  fullyParallel: false,
  retries: 0,
  reporter: [['list']],
  use: {
    baseURL: webBase,
    viewport: { width: 1680, height: 945 },
    colorScheme: 'light',
    reducedMotion: 'reduce',
    ...(channel ? { channel } : {}),
  },
  webServer: [
    {
      command: `python -m uvicorn apps.api.main:app --host 127.0.0.1 --port ${apiPort}`,
      url: `${apiBase}/health`,
      reuseExistingServer: true,
      timeout: 120_000,
      env: { ...process.env, AI_ENABLED: 'true', AI_PROVIDER: 'mock', AI_MODEL: 'mock-teacher-v1' },
    },
    {
      command: `pnpm --filter web dev --host 127.0.0.1 --port ${webPort}`,
      url: webBase,
      reuseExistingServer: true,
      timeout: 120_000,
      env: { ...process.env, VITE_API_BASE: apiBase },
    },
  ],
});
