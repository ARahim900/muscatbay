import { defineConfig, devices } from '@playwright/test';

const configuredBaseUrl = process.env.E2E_BASE_URL;
const baseURL = configuredBaseUrl ?? 'http://127.0.0.1:3100';
const target = new URL(baseURL);

if (target.hostname === 'muscatbay.work' || target.hostname.endsWith('.muscatbay.work')) {
    throw new Error('E2E tests refuse to run against the production Muscat Bay host. Set E2E_BASE_URL to staging or omit it for local testing.');
}

export default defineConfig({
    testDir: './e2e',
    fullyParallel: true,
    forbidOnly: true,
    retries: process.env.CI ? 2 : 0,
    reporter: process.env.CI ? [['html', { open: 'never' }], ['list']] : 'list',
    use: {
        baseURL,
        trace: 'retain-on-failure',
        screenshot: 'only-on-failure',
        video: 'retain-on-failure',
    },
    projects: [
        { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
        { name: 'mobile-chromium', use: { ...devices['Pixel 7'] } },
    ],
    webServer: configuredBaseUrl ? undefined : {
        command: 'npm run dev -- --hostname 127.0.0.1 --port 3100',
        url: 'http://127.0.0.1:3100/login',
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
    },
});
