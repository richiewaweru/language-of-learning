import { defineConfig } from '@playwright/test';

const channel = process.env.PLAYWRIGHT_CHANNEL;

export default defineConfig({
  testDir: './tests/e2e',
  outputDir: '.codex-tmp/playwright-results',
  snapshotPathTemplate: '{testDir}/__screenshots__/{arg}{ext}',
  fullyParallel: false,
  retries: 0,
  reporter: [['list']],
  use: {
    baseURL: 'http://127.0.0.1:4173',
    viewport: { width: 1680, height: 945 },
    colorScheme: 'light',
    reducedMotion: 'reduce',
    ...(channel ? { channel } : {}),
  },
  webServer: [
    {
      command: 'python -m uvicorn apps.api.main:app --host 127.0.0.1 --port 8000',
      url: 'http://127.0.0.1:8000/health',
      reuseExistingServer: false,
      timeout: 120_000,
      env: { ...process.env, AI_ENABLED: 'true', AI_PROVIDER: 'mock', AI_MODEL: 'mock-teacher-v1' },
    },
    {
      command: 'pnpm --filter web dev --host 127.0.0.1 --port 4173',
      url: 'http://127.0.0.1:4173',
      reuseExistingServer: false,
      timeout: 120_000,
    },
  ],
});
