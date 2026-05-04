"use client";

import Image from "next/image";

interface SplashScreenProps {
  /** When true, plays the exit animation before the parent unmounts the component. */
  exiting?: boolean;
}

export function SplashScreen({ exiting = false }: SplashScreenProps) {
  return (
    <div
      role="status"
      aria-label="Loading Muscat Bay Operations"
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center overflow-hidden"
      style={{
        // Splash always renders against the dark brand surface regardless of theme.
        backgroundColor: "var(--mb-splash-bg, #0A090C)",
        animation: exiting
          ? "mb-splash-out 600ms cubic-bezier(0.4,0,1,1) both"
          : "mb-splash-in 350ms ease-out both",
      }}
    >
      {/* ── Logo + rings ── */}
      <div className="relative flex items-center justify-center">
        {/* Outer pulse ring */}
        <span
          aria-hidden
          className="absolute rounded-2xl mb-ring-anim"
          style={{ width: 148, height: 148, border: "1.5px solid color-mix(in srgb, var(--secondary) 25%, transparent)", animationDelay: "0s" }}
        />
        {/* Inner pulse ring */}
        <span
          aria-hidden
          className="absolute rounded-2xl mb-ring-anim"
          style={{ width: 120, height: 120, border: "1.5px solid color-mix(in srgb, var(--secondary) 40%, transparent)", animationDelay: "0.6s" }}
        />

        {/* Logo — scale pulse while idle */}
        <div className="mb-pulse relative z-10">
          <Image
            src="/logo.png"
            alt="Muscat Bay"
            width={96}
            height={96}
            priority
            className="rounded-2xl"
            style={{
              boxShadow: "0 0 40px color-mix(in srgb, var(--secondary) 15%, transparent)",
              // Calmer settle (audit P3): replaces overshoot easing
              animation: "mb-logo-enter 400ms cubic-bezier(0.2,0,0,1) both",
            }}
          />
        </div>
      </div>

      {/* ── Brand name ── */}
      <div
        className="mt-8 flex flex-col items-center gap-1"
        style={{ animation: "mb-fade-up 450ms ease-out 200ms both" }}
      >
        <p className="text-base font-semibold tracking-[0.22em] text-white uppercase select-none">
          Muscat Bay
        </p>
        <p
          className="text-[11px] font-medium tracking-[0.30em] uppercase select-none"
          style={{ color: "var(--secondary)" }}
        >
          Operations
        </p>
      </div>

      {/* ── Shimmer progress bar ── */}
      <div
        className="absolute bottom-14 w-40 overflow-hidden rounded-full"
        style={{
          height: 2,
          backgroundColor: "rgba(255,255,255,0.08)",
          animation: "mb-fade-up 450ms ease-out 400ms both",
        }}
      >
        <div
          className="h-full rounded-full mb-shimmer"
          style={{
            width: "38%",
            background: "linear-gradient(90deg, transparent, var(--secondary), transparent)",
          }}
        />
      </div>
    </div>
  );
}
