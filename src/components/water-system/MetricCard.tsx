
import React from 'react';
import { formatNumber } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

interface MetricCardProps {
  title: string;
  value: number | string;
  unit?: string;
  trend?: number;
  icon: React.ReactElement;
  className?: string;
  lossPercent?: number;
  secondaryValue?: number | string;
  secondaryUnit?: string;
}

export function MetricCard({
  title,
  value,
  unit,
  trend,
  icon,
  className = "",
  lossPercent = 0,
  secondaryValue,
  secondaryUnit,
}: MetricCardProps) {
  const displayValue = typeof value === "number" ? formatNumber(value) : value;
  const displaySecondaryValue = secondaryValue !== undefined ? 
    (typeof secondaryValue === "number" ? formatNumber(secondaryValue) : secondaryValue) : 
    null;
  
  const trendColor = trend && trend > 0 ? "text-green-500" : "text-red-500";

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-md p-5 ${className}`}>
      <div className="flex justify-between items-start mb-3">
        <div className="text-sm font-medium text-gray-600 dark:text-gray-300">{title}</div>
        <div className="p-2 rounded-full bg-blue-100 dark:bg-blue-900">
          {icon}
        </div>
      </div>
      
      <div className="mt-1 flex flex-col">
        <div className="flex items-baseline">
          <div className="text-3xl font-bold text-gray-900 dark:text-white">{displayValue}</div>
          {unit && <div className="ml-1.5 text-sm text-gray-600 dark:text-gray-300">{unit}</div>}
        </div>

        {displaySecondaryValue !== null && (
          <div className="mt-1 text-sm text-gray-600 dark:text-gray-300">
            {displaySecondaryValue}
            {secondaryUnit && <span className="ml-1">{secondaryUnit}</span>}
          </div>
        )}

        {lossPercent !== undefined && lossPercent > 0 && (
          <div className="mt-1 text-sm text-gray-600 dark:text-gray-300">
            Loss: {formatNumber(lossPercent, 1)}%
          </div>
        )}

        {trend !== undefined && (
          <div className={`mt-1 text-sm ${trendColor}`}>
            {trend >= 0 ? "+" : ""}{formatNumber(trend, 1)}%
          </div>
        )}
      </div>
    </div>
  );
}
