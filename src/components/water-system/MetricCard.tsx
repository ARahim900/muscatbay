
import React from 'react';
import { LucideIcon } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string;
  unit?: string;
  icon: React.ReactNode;
  trend?: {
    value: number;
    icon: LucideIcon;
    label: string;
  };
}

export function MetricCard({ title, value, unit, icon, trend }: MetricCardProps) {
  const TrendIcon = trend?.icon;
  const isTrendPositive = trend?.value && trend?.value >= 0;

  return (
    <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
      <div className="flex justify-between items-start mb-2">
        <p className="text-sm text-gray-500">{title}</p>
        <div className="text-primary bg-primary/10 p-2 rounded-full">
          {icon}
        </div>
      </div>
      <div className="flex items-baseline">
        <h3 className="text-2xl font-bold">{value}</h3>
        {unit && <span className="ml-1 text-gray-500">{unit}</span>}
      </div>
      {trend && (
        <div className="flex items-center mt-2">
          {TrendIcon && (
            <TrendIcon
              className={`h-4 w-4 mr-1 ${
                isTrendPositive ? "text-green-500" : "text-red-500"
              }`}
            />
          )}
          <span
            className={`text-xs ${
              isTrendPositive ? "text-green-500" : "text-red-500"
            }`}
          >
            {isTrendPositive ? "+" : ""}
            {trend.value}% {trend.label}
          </span>
        </div>
      )}
    </div>
  );
}
