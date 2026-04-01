"use client";

import { ReactNode, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";

// ─── Staggered container animation ───────────────────────────────────────────

interface AnimateOnScrollProps {
  children: ReactNode;
  className?: string;
  /** Vertical offset (px). Default: 30 */
  y?: number;
  /** Duration in seconds. Default: 0.5 */
  duration?: number;
  /** Stagger delay between children (s). Default: 0.1 */
  stagger?: number;
  /** IntersectionObserver rootMargin. Default: '0px 0px -15% 0px' */
  rootMargin?: string;
  /** CSS selector for animated children. Default: ':scope > *' */
  selector?: string;
}

/**
 * Wrapper component that applies a staggered CSS fade-in + slide-up
 * animation to its children when they enter the viewport.
 */
export function AnimateOnScroll({
  children,
  className,
  y = 30,
  duration = 0.5,
  stagger = 0.1,
  rootMargin = "0px 0px -15% 0px",
  selector = ":scope > *",
}: AnimateOnScrollProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const targets = el.querySelectorAll(selector);
    if (targets.length === 0) return;

    if (prefersReducedMotion) {
      targets.forEach((target) => {
        const htmlEl = target as HTMLElement;
        htmlEl.style.opacity = "1";
        htmlEl.style.transform = "translateY(0)";
      });
      return;
    }

    targets.forEach((target) => {
      const htmlEl = target as HTMLElement;
      htmlEl.style.willChange = "opacity, transform";
      htmlEl.style.opacity = "0";
      htmlEl.style.transform = `translateY(${y}px)`;
    });

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;

          targets.forEach((target, i) => {
            const htmlEl = target as HTMLElement;
            htmlEl.style.transition = `opacity ${duration}s ease-out ${i * stagger}s, transform ${duration}s ease-out ${i * stagger}s`;
            htmlEl.style.opacity = "1";
            htmlEl.style.transform = "translateY(0)";
          });

          observer.unobserve(entry.target);
        });
      },
      { rootMargin }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [y, duration, stagger, rootMargin, selector]);

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
 * Wraps a single element with a fade-in + slide-up animation on scroll.
 */
export function AnimateOnScrollItem({
  children,
  className,
  y = 30,
  duration = 0.5,
  rootMargin = "0px 0px -15% 0px",
}: AnimateOnScrollItemProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (prefersReducedMotion) {
      el.style.opacity = "1";
      el.style.transform = "translateY(0)";
      return;
    }

    el.style.willChange = "opacity, transform";
    el.style.opacity = "0";
    el.style.transform = `translateY(${y}px)`;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;

          const htmlEl = entry.target as HTMLElement;
          htmlEl.style.transition = `opacity ${duration}s ease-out, transform ${duration}s ease-out`;
          htmlEl.style.opacity = "1";
          htmlEl.style.transform = "translateY(0)";

          observer.unobserve(entry.target);
        });
      },
      { rootMargin }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [y, duration, rootMargin]);

  return (
    <div ref={ref} className={cn(className)}>
      {children}
    </div>
  );
}
