
import React from "react";
import { cn } from "@/lib/utils";

type SpotlightProps = {
  className?: string;
  fill?: string;
  children?: React.ReactNode;
  spotlightSize?: "sm" | "md" | "lg";
};

export const Spotlight = ({ 
  className, 
  fill = "#68D1CC", 
  children,
  spotlightSize = "md"
}: SpotlightProps) => {
  const sizeClasses = {
    sm: "h-[130%] w-[120%] lg:w-[70%]",
    md: "h-[169%] w-[138%] lg:w-[84%]",
    lg: "h-[200%] w-[180%] lg:w-[100%]"
  };

  return (
    <div className={cn("relative overflow-hidden", className)}>
      <svg
        className={cn(
          "animate-spotlight pointer-events-none absolute z-[1] opacity-0",
          sizeClasses[spotlightSize]
        )}
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 3787 2842"
        fill="none"
        aria-hidden="true"
      >
        <g filter="url(#filter)">
          <ellipse
            cx="1924.71"
            cy="273.501"
            rx="1924.71"
            ry="273.501"
            transform="matrix(-0.822377 -0.568943 -0.568943 0.822377 3631.88 2291.09)"
            fill={fill}
            fillOpacity="0.21"
          ></ellipse>
        </g>
        <defs>
          <filter
            id="filter"
            x="0.860352"
            y="0.838989"
            width="3785.16"
            height="2840.26"
            filterUnits="userSpaceOnUse"
            colorInterpolationFilters="sRGB"
          >
            <feFlood floodOpacity="0" result="BackgroundImageFix"></feFlood>
            <feBlend
              mode="normal"
              in="SourceGraphic"
              in2="BackgroundImageFix"
              result="shape"
            ></feBlend>
            <feGaussianBlur
              stdDeviation="151"
              result="effect1_foregroundBlur_1065_8"
            ></feGaussianBlur>
          </filter>
        </defs>
      </svg>
      {children}
    </div>
  );
};
