"use client";

import { useState } from "react";
import { signInWithGoogle } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

// Google's "G" mark, from their sign-in branding assets. The four hex
// values are Google's own brand colours, not app design tokens — the mark
// must render identically in both themes, so tokenising them would be
// wrong here (same exception as /logo.png).
function GoogleGlyph({ className }: { className?: string }) {
    return (
        <svg className={className} viewBox="0 0 18 18" aria-hidden="true" focusable="false">
            <path
                fill="#4285F4"
                d="M17.64 9.2045c0-.6381-.0573-1.2518-.1636-1.8409H9v3.4814h4.8436c-.2086 1.125-.8427 2.0782-1.7959 2.7164v2.2581h2.9087c1.7018-1.5668 2.6836-3.874 2.6836-6.615z"
            />
            <path
                fill="#34A853"
                d="M9 18c2.43 0 4.4673-.8059 5.9564-2.1805l-2.9087-2.2581c-.8059.54-1.8368.8591-3.0477.8591-2.344 0-4.3282-1.5831-5.036-3.7104H.9574v2.3318C2.4382 15.9832 5.4818 18 9 18z"
            />
            <path
                fill="#FBBC05"
                d="M3.964 10.71c-.18-.54-.2822-1.1168-.2822-1.71s.1023-1.17.2823-1.71V4.9582H.9573A8.9965 8.9965 0 0 0 0 9c0 1.4523.3477 2.8268.9573 4.0418L3.964 10.71z"
            />
            <path
                fill="#EA4335"
                d="M9 3.5795c1.3214 0 2.5077.4541 3.4405 1.346l2.5813-2.5814C13.4632.8918 11.4259 0 9 0 5.4818 0 2.4382 2.0168.9573 4.9582L3.964 7.29C4.6718 5.1627 6.6559 3.5795 9 3.5795z"
            />
        </svg>
    );
}

interface GoogleSignInButtonProps {
    /** CTA text — defaults to "Continue with Google". */
    label?: string;
    /** Surfaces failures in the page's own error slot (alert region). */
    onError: (message: string) => void;
    className?: string;
}

/**
 * "Continue with Google" button shared by /login and /signup.
 *
 * On success the browser navigates away to Google, so the pending state
 * deliberately stays up until the page unloads. Errors thrown before the
 * redirect (Supabase unconfigured, popup/redirect blocked) are reported
 * through onError; errors on the way back land on /auth/callback, which
 * has its own oauth-flow error state.
 */
export function GoogleSignInButton({
    label = "Continue with Google",
    onError,
    className,
}: GoogleSignInButtonProps) {
    const [redirecting, setRedirecting] = useState(false);

    const handleClick = async () => {
        setRedirecting(true);
        try {
            await signInWithGoogle();
        } catch (err: unknown) {
            setRedirecting(false);
            const message = err instanceof Error ? err.message : "";
            onError(
                message === "Supabase not configured"
                    ? "Authentication service is not available. Please try again later."
                    : message || "Google sign-in failed. Please try again."
            );
        }
    };

    return (
        <Button
            type="button"
            variant="outline"
            onClick={handleClick}
            disabled={redirecting}
            className={cn("w-full gap-2 font-semibold", className)}
        >
            {redirecting ? (
                <>
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                    <span>Redirecting to Google…</span>
                </>
            ) : (
                <>
                    <GoogleGlyph className="h-4 w-4 shrink-0" />
                    <span>{label}</span>
                </>
            )}
        </Button>
    );
}
