"use client"

import type React from "react"

interface ConsumptionBarProps {
  value: number
  maxValue: number
}

export const ConsumptionBar: React.FC<ConsumptionBarProps> = ({ value, maxValue }) => {
  const percentage = Math.min((value / maxValue) * 100, 100)

  return (
    <div className="flex items-center">
      <div className="w-32 h-2 bg-gray-200 dark:bg-gray-700 rounded-full mr-3">
        <div
          className="h-full rounded-full"
          style={{
            width: `${percentage}%`,
            background: `linear-gradient(90deg, #4F7ED980 0%, #4F7ED9 100%)`,
          }}
        />
      </div>
      <span className="text-sm text-gray-800 dark:text-gray-200 font-medium">{value} m³</span>
    </div>
  )
}
