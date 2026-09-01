import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test.describe('public authentication surface', () => {
    test('login is usable and its heading order starts with H1', async ({ page }) => {
        await page.goto('/login');

        await expect(page.getByLabel('Email Address')).toBeVisible();
        await expect(page.getByLabel(/^Password\b/)).toBeVisible();
        await expect(page.getByRole('button', { name: 'Sign in to Dashboard' })).toBeVisible();

        const headingLevels = await page.locator('h1, h2, h3, h4, h5, h6').evaluateAll((headings) =>
            headings.map((heading) => Number(heading.tagName.slice(1))),
        );
        expect(headingLevels[0]).toBe(1);
        expect(headingLevels.every((level, index) => index === 0 || level <= headingLevels[index - 1] + 1)).toBe(true);
    });

    test('login has no serious or critical axe violations', async ({ page }, testInfo) => {
        test.skip(testInfo.project.name.startsWith('mobile'), 'Axe is run once on the representative desktop viewport.');
        await page.goto('/login');
        const results = await new AxeBuilder({ page }).analyze();
        const blocking = results.violations.filter((violation) => violation.impact === 'serious' || violation.impact === 'critical');
        expect(blocking, JSON.stringify(blocking, null, 2)).toEqual([]);
    });

    test('invalid reset links fail closed with a recovery action', async ({ page }) => {
        await page.goto('/auth/reset-password');
        await expect(page.getByText(/Invalid or expired reset link|System configuration error/)).toBeVisible();
        await expect(page.getByRole('button', { name: 'Request New Link' })).toBeVisible();
    });
});
