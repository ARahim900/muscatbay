"use client";

import { ReactNode, useRef } from "react";
import gsap from "gsap";
import { cn } from "@/lib/utils";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import { MOTION, prefersReducedMotion, useIsomorphicLayoutEffect } from "@/lib/motion";

// ─── Staggered container animation ───────────────────────────────────────────

interface AnimateOnScrollProps {
  children: ReactNode;
  className?: string;
  /** Vertical offset (px). Default: 30 */
  y?: number;
  /** Duration in seconds. Default: 0.6 */
  duration?: number;
  /** Stagger delay between children (s). Default: 0.07 */
  stagger?: number;
  /** IntersectionObserver rootMargin. Default: '0px 0px -15% 0px' */
  rootMargin?: string;
  /** CSS selector for animated children. Default: ':scope > *' */
  selector?: string;
}

/**
 * Wrapper component that applies a GSAP staggered fade-in + lift to its
 * children when they enter the viewport. Same API as before; the
 * choreography now runs on the shared motion tokens.
 */
export function AnimateOnScroll({
  children,
  className,
  y = 30,
  duration = MOTION.dur.md,
  stagger = MOTION.stagger.base,
  rootMargin = "0px 0px -15% 0px",
  selector = ":scope > *",
}: AnimateOnScrollProps) {
  const containerRef = useScrollAnimation<HTMLDivElement>({
    y,
    duration,
    stagger,
    rootMargin,
    childSelector: selector,
  });

  return (
    <div ref={containerRef} className={cn(className)}>
      {children}
    </div>
  );
}

// ─── Single-element animation ────────────────────────────────────────────────

interface AnimateOnScrollItemProps {
  children: ReactNode;
  className?: string;
  y?: number;
  duration?: number;
  rootMargin?: string;
}

/**
 * Wraps a single element with a GSAP fade-in + lift animation on scroll.
 */
export function AnimateOnScrollItem({
  children,
  className,
  y = 30,
  duration = MOTION.dur.md,
  rootMargin = "0px 0px -15% 0px",
}: AnimateOnScrollItemProps) {
  const ref = useRef<HTMLDivElement>(null);

  useIsomorphicLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (prefersReducedMotion()) {
      gsap.set(el, { clearProps: "opacity,visibility,transform" });
      return;
    }

    gsap.set(el, { autoAlpha: 0, y });

    let tween: gsap.core.Tween | null = null;

    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((e) => e.isIntersecting)) return;
        observer.disconnect();

        tween = gsap.to(el, {
          autoAlpha: 1,
          y: 0,
          duration,
          ease: MOTION.ease.out,
          clearProps: "opacity,visibility,transform",
        });
      },
      { rootMargin }
    );
    observer.observe(el);

    return () => {
      observer.disconnect();
      tween?.kill();
      gsap.set(el, { clearProps: "opacity,visibility,transform" });
    };
  }, [y, duration, rootMargin]);

  return (
    <div ref={ref} className={cn(className)}>
      {children}
    </div>
  );
}
