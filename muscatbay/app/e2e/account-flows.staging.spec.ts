import { expect, test } from '@playwright/test';

import { mutationEnabled, readableSkipReason, signInToStaging } from './helpers';

const resetUrl = process.env.E2E_RESET_URL;
const resetPassword = process.env.E2E_RESET_NEW_PASSWORD;
const resetMutationEnabled = Boolean(
    process.env.E2E_BASE_URL
    && resetUrl
    && resetPassword
    && process.env.E2E_RESET_MUTATION_OK === '1',
);
const notificationTriggerUrl = process.env.E2E_NOTIFICATION_TRIGGER_URL;
const notificationTriggerSecret = process.env.E2E_NOTIFICATION_TRIGGER_SECRET;
const expectedNotificationTitle = process.env.E2E_NOTIFICATION_EXPECTED_TITLE;

test.describe('staging-only account flows', () => {
    test.skip(!mutationEnabled, `${readableSkipReason()} Set E2E_MUTATION_OK=1 for the dedicated dummy account.`);

    test.beforeEach(async ({ page }) => {
        await signInToStaging(page);
    });

    test('profile update and avatar upload complete without a silent failure', async ({ page }) => {
        await page.goto('/settings');
        const fullName = page.getByLabel('Full Name');
        const originalName = await fullName.inputValue();
        const temporaryName = `E2E Dummy ${Date.now()}`;

        await fullName.fill(temporaryName);
        await page.locator('#avatar-upload').setInputFiles({
            name: 'avatar.png',
            mimeType: 'image/png',
            buffer: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Y9Z7L8AAAAASUVORK5CYII=', 'base64'),
        });
        await page.getByRole('button', { name: 'Save Changes' }).click();
        await expect(page.getByText(/Profile updated|success/i)).toBeVisible();

        await fullName.fill(originalName);
        await page.getByRole('button', { name: 'Save Changes' }).click();
        await expect(page.getByText(/Profile updated|success/i)).toBeVisible();
    });

    test('push preference remains visible and keyboard operable', async ({ page }) => {
        await page.goto('/settings');
        await page.getByRole('tab', { name: 'Notifications' }).click();
        const toggle = page.getByRole('switch', { name: 'Browser push notifications' });
        await expect(toggle).toBeVisible();
        const before = await toggle.getAttribute('aria-checked');
        await toggle.press('Space');
        await expect(toggle).not.toHaveAttribute('aria-checked', before ?? 'false');
        await toggle.press('Space');
        await expect(toggle).toHaveAttribute('aria-checked', before ?? 'false');
    });

    test('a staging notification trigger reaches the live alert feed', async ({ page, request, context }) => {
        test.skip(
            !notificationTriggerUrl || !notificationTriggerSecret || !expectedNotificationTitle,
            'Real delivery requires E2E_NOTIFICATION_TRIGGER_URL, E2E_NOTIFICATION_TRIGGER_SECRET and E2E_NOTIFICATION_EXPECTED_TITLE for a dedicated staging alert fixture.',
        );

        await context.grantPermissions(['notifications']);
        await page.goto('/settings');
        await page.getByRole('tab', { name: 'Notifications' }).click();
        await expect(page.getByText('Browser permission granted — push is active.')).toBeVisible();

        const response = await request.post(notificationTriggerUrl!, {
            headers: { authorization: `Bearer ${notificationTriggerSecret}` },
        });
        expect(response.ok(), await response.text()).toBe(true);

        await page.getByRole('button', { name: /notifications/i }).first().click();
        await expect(page.getByText(expectedNotificationTitle!, { exact: false })).toBeVisible({ timeout: 20_000 });
    });
});

test.describe('staging-only password reset', () => {
    test.skip(
        !resetMutationEnabled,
        'Successful reset requires a single-use E2E_RESET_URL, E2E_RESET_NEW_PASSWORD and E2E_RESET_MUTATION_OK=1 for a dedicated staging account.',
    );

    test('a valid recovery session updates the dedicated staging password', async ({ page }) => {
        const baseUrl = new URL(process.env.E2E_BASE_URL!);
        const recoveryUrl = new URL(resetUrl!);
        expect(recoveryUrl.origin, 'Recovery URL must use the configured staging origin.').toBe(baseUrl.origin);

        await page.goto(recoveryUrl.toString());
        await expect(page.getByRole('heading', { name: 'Set new password' })).toBeVisible();
        await page.getByLabel('New Password').fill(resetPassword!);
        await page.getByLabel('Confirm Password').fill(resetPassword!);
        await page.getByRole('button', { name: 'Reset password' }).click();
        await expect(page.getByRole('heading', { name: 'Password Updated' })).toBeVisible();
        await expect(page.getByText('Your password has been successfully reset.')).toBeVisible();
    });
});
