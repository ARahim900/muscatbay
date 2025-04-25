"use client"

import type React from "react"

interface CircularGaugeProps {
  value: number
  total: number
  color: string
  label: string
  unit?: string
  overrideValue?: number | null
  isPercentage?: boolean
}

export const CircularGauge: React.FC<CircularGaugeProps> = ({
  value,
  total,
  color,
  label,
  unit = "m³",
  overrideValue = null,
  isPercentage = false,
}) => {
  const displayValue = overrideValue !== null ? overrideValue : value

  // Calculate percentage safely to avoid NaN
  const percentage = total > 0 ? Math.min(Math.max((value / total) * 100, 0), 100) : 0

  const radius = 70
  const strokeWidth = 12
  const circumference = 2 * Math.PI * radius

  // Calculate strokeDashoffset and ensure it's a valid number
  const strokeDashoffset = isNaN(percentage) ? circumference : circumference - (percentage / 100) * circumference

  return (
    <div className="flex flex-col items-center">
      <div className="relative mb-4">
        <svg width="180" height="180" viewBox="0 0 180 180" className="transform -rotate-90">
          {/* Background circle */}
          <circle cx="90" cy="90" r={radius} fill="none" stroke="#F0F2F8" strokeWidth={strokeWidth} />

          {/* Foreground circle without gradient to match screenshot */}
          <circle
            cx="90"
            cy="90"
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute top-0 left-0 w-full h-full flex flex-col items-center justify-center">
          <span className="text-3xl font-bold text-gray-800 dark:text-gray-200">
            {isPercentage
              ? isNaN(displayValue)
                ? "0.0"
                : displayValue.toFixed(1)
              : isNaN(displayValue)
                ? "0"
                : displayValue.toLocaleString()}
          </span>
          {isPercentage && <span className="text-sm text-gray-500 dark:text-gray-400">%</span>}
          {!isPercentage && <span className="text-sm text-gray-500 dark:text-gray-400">{unit}</span>}
        </div>
      </div>
      <div className="text-center">
        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{label}</p>
      </div>
    </div>
  )
}
