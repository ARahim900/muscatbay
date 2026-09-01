import { expect, type Page } from '@playwright/test';

export const stagingEmail = process.env.E2E_STAGING_EMAIL;
export const stagingPassword = process.env.E2E_STAGING_PASSWORD;
export const hasStagingCredentials = Boolean(process.env.E2E_BASE_URL && stagingEmail && stagingPassword);
export const mutationEnabled = hasStagingCredentials && process.env.E2E_MUTATION_OK === '1';

export async function signInToStaging(page: Page): Promise<void> {
    if (!stagingEmail || !stagingPassword) {
        throw new Error('E2E_STAGING_EMAIL and E2E_STAGING_PASSWORD are required for authenticated staging tests.');
    }
    await page.goto('/login');
    await page.getByLabel('Email Address').fill(stagingEmail);
    await page.getByLabel(/^Password\b/).fill(stagingPassword);
    await page.getByRole('button', { name: 'Sign in to Dashboard' }).click();
    await expect(page).not.toHaveURL(/\/login(?:\?|$)/, { timeout: 20_000 });
}

export function readableSkipReason(): string {
    return 'Authenticated E2E is staging-only. Set E2E_BASE_URL, E2E_STAGING_EMAIL and E2E_STAGING_PASSWORD.';
}
