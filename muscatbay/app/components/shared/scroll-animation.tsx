"use client";

import { ReactNode, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { cn } from "@/lib/utils";

gsap.registerPlugin(ScrollTrigger);

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
  /** ScrollTrigger start. Default: 'top 85%' */
  start?: string;
  /** CSS selector for animated children. Default: '> *' */
  selector?: string;
}

/**
 * Wrapper component that applies a staggered GSAP fade-in + slide-up
 * animation to its children when they enter the viewport.
 */
export function AnimateOnScroll({
  children,
  className,
  y = 30,
  duration = 0.5,
  stagger = 0.1,
  start = "top 85%",
  selector = ":scope > *",
}: AnimateOnScrollProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const el = containerRef.current;
      if (!el) return;

      const targets = el.querySelectorAll(selector);
      if (targets.length === 0) return;

      gsap.fromTo(targets, {
        y,
        opacity: 0,
      }, {
        y: 0,
        opacity: 1,
        duration,
        stagger,
        ease: "power2.out",
        scrollTrigger: {
          trigger: el,
          start,
          once: true,
        },
      });
    },
    { scope: containerRef, dependencies: [] }
  );

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
  start?: string;
}

/**
 * Wraps a single element with a fade-in + slide-up animation on scroll.
 * Use this for individual cards, chart containers, etc.
 */
export function AnimateOnScrollItem({
  children,
  className,
  y = 30,
  duration = 0.5,
  start = "top 85%",
}: AnimateOnScrollItemProps) {
  const ref = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const el = ref.current;
      if (!el) return;

      gsap.fromTo(el, {
        y,
        opacity: 0,
      }, {
        y: 0,
        opacity: 1,
        duration,
        ease: "power2.out",
        scrollTrigger: {
          trigger: el,
          start,
          once: true,
        },
      });
    },
    { scope: ref, dependencies: [] }
  );

  return (
    <div ref={ref} className={cn(className)}>
      {children}
    </div>
  );
}
