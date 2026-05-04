"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { _registerLoadingController } from "@/lib/loading";

interface OverlayState {
  visible: boolean;
  message?: string;
}

export function LoadingOverlay() {
  const [state, setState] = useState<OverlayState>({ visible: false });
  const [exiting, setExiting] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    _registerLoadingController({
      show(message?: string) {
        if (timerRef.current) clearTimeout(timerRef.current);
        setExiting(false);
        setState({ visible: true, message });
      },
      hide() {
        if (timerRef.current) clearTimeout(timerRef.current);
        setExiting(true);
        timerRef.current = setTimeout(() => {
          setState({ visible: false });
          setExiting(false);
          timerRef.current = null;
        }, 260);
      },
    });

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  if (!state.visible) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy
      aria-label={state.message ?? "Loading"}
      className="fixed inset-0 z-[9998] flex items-center justify-center"
      style={{
        backgroundColor: "color-mix(in srgb, var(--background) 78%, transparent)",
        backdropFilter: "blur(5px)",
        WebkitBackdropFilter: "blur(5px)",
        animation: exiting
          ? "mb-overlay-out 260ms ease-in both"
          : "mb-overlay-in 200ms ease-out both",
      }}
    >
      <div
        className="flex flex-col items-center gap-5 rounded-2xl px-10 py-8"
        style={{
          background: "color-mix(in srgb, var(--card) 92%, transparent)",
          border: "1px solid color-mix(in srgb, var(--secondary) 14%, transparent)",
          boxShadow: "0 32px 72px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,255,255,0.04)",
          animation: exiting
            ? "mb-card-out 260ms ease-in both"
            : "mb-card-in 220ms cubic-bezier(0.34,1.4,0.64,1) both",
        }}
      >
        {/* ── Spinning arc + logo ── */}
        <div className="relative flex items-center justify-center" style={{ width: 80, height: 80 }}>
          {/* Outer track */}
          <div
            className="absolute inset-0 rounded-full"
            style={{ border: "2.5px solid color-mix(in srgb, var(--secondary) 12%, transparent)" }}
          />
          {/* Spinning arc */}
          <div
            aria-hidden
            className="absolute inset-0 rounded-full mb-spin"
            style={{
              border: "2.5px solid transparent",
              borderTopColor: "var(--secondary)",
              borderRightColor: "color-mix(in srgb, var(--secondary) 30%, transparent)",
            }}
          />
          {/* Logo */}
          <Image
            src="/logo.png"
            alt=""
            aria-hidden
            width={52}
            height={52}
            className="rounded-xl relative z-10"
          />
        </div>

        {/* ── Message ── */}
        <p className="text-sm font-medium tracking-wide text-muted-foreground">
          {state.message ?? "Loading…"}
        </p>
      </div>
    </div>
  );
}
