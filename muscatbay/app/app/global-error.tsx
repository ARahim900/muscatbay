"use client";

/**
 * Global error boundary — the last line of defence. It replaces the root layout
 * (so it must render its own <html>/<body>), catching errors thrown by the root
 * layout itself, the providers, or the shell (sidebar/topbar) that the
 * route-level error.tsx cannot reach. Styling is inline because the app's CSS
 * lives in the layout this component is replacing, so Tailwind classes may not
 * apply here. Colours mirror the dark brand splash surface.
 */

import { useEffect } from "react";

export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error("Global error boundary caught:", error);
    }, [error]);

    return (
        <html lang="en">
            <body
                style={{
                    margin: 0,
                    minHeight: "100vh",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: "#0A090C",
                    color: "#ffffff",
                    fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, sans-serif",
                    textAlign: "center",
                    padding: "24px",
                }}
            >
                <div style={{ maxWidth: 440 }}>
                    <h2 style={{ fontSize: 18, fontWeight: 600, margin: "0 0 8px" }}>Something went wrong</h2>
                    <p style={{ fontSize: 14, lineHeight: 1.5, opacity: 0.72, margin: "0 auto 20px" }}>
                        Muscat Bay Operations hit an unexpected error. Reloading almost always fixes it.
                    </p>
                    <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
                        <button
                            onClick={reset}
                            style={{
                                padding: "9px 18px", borderRadius: 8, border: "none",
                                background: "#A1D1D5", color: "#0A090C", fontSize: 14, fontWeight: 600, cursor: "pointer",
                            }}
                        >
                            Try again
                        </button>
                        <button
                            onClick={() => window.location.reload()}
                            style={{
                                padding: "9px 18px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.22)",
                                background: "transparent", color: "#ffffff", fontSize: 14, cursor: "pointer",
                            }}
                        >
                            Reload
                        </button>
                    </div>
                    {error?.digest && (
                        <p style={{ fontSize: 11, opacity: 0.5, marginTop: 16 }}>Ref: {error.digest}</p>
                    )}
                </div>
            </body>
        </html>
    );
}
