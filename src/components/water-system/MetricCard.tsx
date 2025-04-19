
import React from 'react';
import { LucideIcon } from 'lucide-react';
import { formatNumber } from '@/lib/utils';

interface TrendProps {
  value: number;
  icon: LucideIcon;
  label: string;
}

interface MetricCardProps {
  title: string;
  value: number | string;
  unit?: string;
  icon: React.ReactNode;
  trend?: TrendProps;
}

export function MetricCard({ title, value, unit, icon, trend }: MetricCardProps) {
  // Format the value if it's a number
  const displayValue = typeof value === 'number' ? formatNumber(value) : value;
  
  // Determine if trend is positive or negative
  const isTrendPositive = trend ? trend.value >= 0 : null;
  const trendColor = isTrendPositive === null ? 'text-gray-500' : isTrendPositive ? 'text-green-500' : 'text-red-500';
  
  const TrendIcon = trend?.icon;
  
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-gray-500">{title}</h3>
        <div className="text-primary">
          {icon}
        </div>
      </div>
      
      <div className="flex items-baseline">
        <span className="text-3xl font-bold">{displayValue}</span>
        {unit && <span className="ml-1 text-gray-500 text-sm">{unit}</span>}
      </div>
      
      {trend && (
        <div className={`flex items-center mt-3 text-xs ${trendColor}`}>
          {TrendIcon && <TrendIcon className="h-3 w-3 mr-1" />}
          <span>{trend.value > 0 ? '+' : ''}{formatNumber(trend.value, 1)}% {trend.label}</span>
        </div>
      )}
    </div>
  );
}
