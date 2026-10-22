import { defineConfig, devices } from '@playwright/test';

const port = 4317;

export default defineConfig({
  testDir: "tests",
  fullyParallel: true,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: `http://127.0.0.1:${port}`,
    trace: 'retain-on-failure'
  },
  webServer: {
    command: `npx vite --port ${port} --strictPort --host 127.0.0.1`,
    url: `http://127.0.0.1:${port}`,
    reuseExistingServer: !process.env.CI
  },
  projects: [
    { name: 'phone', use: { ...devices['Pixel 7'] }, testIgnore: /desktop\.spec\.js/ },
    { name: 'desktop', use: { ...devices['Desktop Chrome'] }, testMatch: /desktop\.spec\.js/ }
  ]
});
