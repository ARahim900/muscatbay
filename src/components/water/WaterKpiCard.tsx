
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LucideIcon } from 'lucide-react';

interface WaterKpiCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  color?: 'primary' | 'success' | 'warning' | 'danger';
}

const WaterKpiCard: React.FC<WaterKpiCardProps> = ({
  title,
  value,
  description,
  icon: Icon,
  trend,
  color = 'primary'
}) => {
  const colorClasses = {
    primary: 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-100',
    success: 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-100',
    warning: 'bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-100',
    danger: 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-100'
  };
  
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <div className={`p-1.5 rounded-full ${colorClasses[color]}`}>
            <Icon className="h-4 w-4" />
          </div>
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {description && (
          <p className="text-xs text-muted-foreground">{description}</p>
        )}
        {trend && (
          <div className={`flex items-center mt-1 text-xs ${
            trend.isPositive ? 'text-green-600' : 'text-red-600'
          }`}>
            <span>{trend.isPositive ? '↑' : '↓'} {trend.value}%</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default WaterKpiCard;
