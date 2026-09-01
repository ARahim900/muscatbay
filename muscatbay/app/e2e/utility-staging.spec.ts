import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

import { hasStagingCredentials, readableSkipReason, signInToStaging } from './helpers';

test.describe('authenticated utility production checks', () => {
    test.skip(!hasStagingCredentials, readableSkipReason());

    test.beforeEach(async ({ page }) => {
        await signInToStaging(page);
    });

    test('Electricity renders four KPIs and charts without invalid-dimension warnings', async ({ page }) => {
        const chartWarnings: string[] = [];
        page.on('console', (message) => {
            if (/width\(-?1\)|height\(-?1\)|greater than 0|ResponsiveContainer/i.test(message.text())) {
                chartWarnings.push(message.text());
            }
        });

        await page.goto('/electricity');
        for (const label of ['CONSUMPTION', 'ESTIMATED COST', 'TOP CONSUMER', 'FLAGGED METERS']) {
            await expect(page.getByText(label, { exact: true })).toBeVisible();
        }
        await expect(page.locator('[role="img"]').filter({ hasText: '' }).first()).toBeVisible();
        expect(chartWarnings).toEqual([]);
    });

    test('mobile controls meet 44 by 44 and pagination remains available', async ({ page }, testInfo) => {
        test.skip(!testInfo.project.name.startsWith('mobile'), 'This check is specific to the mobile viewport.');
        await page.goto('/electricity');
        await page.getByRole('tab', { name: 'Meters & Data' }).click();

        const undersized = await page.locator('button:visible, a[href]:visible, select:visible, input:visible').evaluateAll((elements) =>
            elements
                .map((element) => {
                    const rect = element.getBoundingClientRect();
                    return { label: element.getAttribute('aria-label') || element.textContent?.trim() || element.tagName, width: rect.width, height: rect.height };
                })
                .filter((target) => target.width > 0 && target.height > 0 && (target.width < 44 || target.height < 44)),
        );
        expect(undersized, JSON.stringify(undersized, null, 2)).toEqual([]);

        const pagination = page.getByLabel('Pagination');
        if (await pagination.count()) {
            await expect(pagination).toBeInViewport();
            await expect(page.getByRole('button', { name: 'Previous page' })).toBeVisible();
            await expect(page.getByRole('button', { name: 'Next page' })).toBeVisible();
        }
    });

    test('representative utility route has no serious or critical axe violations', async ({ page }, testInfo) => {
        test.skip(testInfo.project.name.startsWith('mobile'), 'Axe is run once on the representative desktop utility viewport.');
        await page.goto('/electricity');
        const results = await new AxeBuilder({ page }).analyze();
        const blocking = results.violations.filter((violation) => violation.impact === 'serious' || violation.impact === 'critical');
        expect(blocking, JSON.stringify(blocking, null, 2)).toEqual([]);
    });
});
