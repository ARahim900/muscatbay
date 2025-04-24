
import React from 'react';
import { formatNumber } from "@/lib/utils";

interface CustomTooltipProps {
  active?: boolean;
  payload?: any[];
  label?: string;
}

export function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white dark:bg-gray-800 p-3 border border-gray-200 dark:border-gray-700 shadow-lg rounded-md text-sm">
        <p className="font-medium mb-1.5 text-gray-900 dark:text-gray-100">{label}</p>
        {payload.map((entry, index) => {
          // Ensure we have a valid color
          const color = entry.color || entry.fill || "#4E4456";

          return (
            <p key={`item-${index}`} className="text-xs flex items-center gap-2 mb-0.5">
              <span className="w-3 h-3 rounded-full inline-block" style={{ backgroundColor: color }} />
              <span className="font-medium text-gray-900 dark:text-gray-100">
                {entry.name}: {formatNumber(entry.value)} {entry.unit || "m³"}
              </span>
            </p>
          );
        })}
      </div>
    );
  }
  return null;
}
