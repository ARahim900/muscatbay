import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { GoogleSignInButton } from '@/components/auth/google-sign-in-button';
import { signInWithGoogle } from '@/lib/auth';

vi.mock('@/lib/auth', () => ({
    signInWithGoogle: vi.fn(),
}));

const signInWithGoogleMock = vi.mocked(signInWithGoogle);

describe('GoogleSignInButton', () => {
    beforeEach(() => {
        signInWithGoogleMock.mockReset();
    });

    it('renders the default label', () => {
        render(<GoogleSignInButton onError={vi.fn()} />);
        expect(screen.getByRole('button', { name: 'Continue with Google' })).toBeEnabled();
    });

    it('renders a custom label', () => {
        render(<GoogleSignInButton label="Sign up with Google" onError={vi.fn()} />);
        expect(screen.getByRole('button', { name: 'Sign up with Google' })).toBeInTheDocument();
    });

    it('starts the OAuth redirect and stays pending on success', async () => {
        // Success = the browser navigates away, so the promise never needs to
        // settle for the UI; the pending state must hold until unload.
        signInWithGoogleMock.mockReturnValue(new Promise(() => { }));
        const onError = vi.fn();
        render(<GoogleSignInButton onError={onError} />);

        fireEvent.click(screen.getByRole('button', { name: 'Continue with Google' }));

        expect(signInWithGoogleMock).toHaveBeenCalledOnce();
        const pending = await screen.findByRole('button', { name: /Redirecting to Google/ });
        expect(pending).toBeDisabled();
        expect(onError).not.toHaveBeenCalled();
    });

    it('reports failures through onError and re-enables the button', async () => {
        signInWithGoogleMock.mockRejectedValue(new Error('redirect blocked'));
        const onError = vi.fn();
        render(<GoogleSignInButton onError={onError} />);

        fireEvent.click(screen.getByRole('button', { name: 'Continue with Google' }));

        await waitFor(() => expect(onError).toHaveBeenCalledWith('redirect blocked'));
        expect(screen.getByRole('button', { name: 'Continue with Google' })).toBeEnabled();
    });

    it('maps the unconfigured-Supabase error to a friendly message', async () => {
        signInWithGoogleMock.mockRejectedValue(new Error('Supabase not configured'));
        const onError = vi.fn();
        render(<GoogleSignInButton onError={onError} />);

        fireEvent.click(screen.getByRole('button', { name: 'Continue with Google' }));

        await waitFor(() =>
            expect(onError).toHaveBeenCalledWith('Authentication service is not available. Please try again later.')
        );
    });
});
