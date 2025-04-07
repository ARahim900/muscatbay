
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { LucideIcon } from 'lucide-react';
import { waterColors } from './WaterTheme';
import { cn } from '@/lib/utils';

export interface EnhancedKpiCardProps {
  title: string;
  value: string | number;
  subValue?: string | number;
  valueUnit?: string;
  subValueUnit?: string;
  description?: string;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'neutral';
  className?: string;
  onClick?: () => void;
  isActive?: boolean;
}

const EnhancedKpiCard: React.FC<EnhancedKpiCardProps> = ({
  title,
  value,
  subValue,
  valueUnit = '',
  subValueUnit = '',
  description,
  icon: Icon,
  trend,
  variant = 'primary',
  className,
  onClick,
  isActive = false,
}) => {
  const variantStyles = {
    primary: {
      bg: 'bg-blue-50 dark:bg-blue-950/30',
      iconBg: 'bg-blue-100 dark:bg-blue-900/50',
      iconColor: 'text-blue-600 dark:text-blue-400',
      borderColor: isActive ? 'border-blue-500' : 'border-transparent',
      hoverBg: 'hover:bg-blue-50/80',
    },
    secondary: {
      bg: 'bg-sky-50 dark:bg-sky-950/30',
      iconBg: 'bg-sky-100 dark:bg-sky-900/50',
      iconColor: 'text-sky-600 dark:text-sky-400',
      borderColor: isActive ? 'border-sky-500' : 'border-transparent',
      hoverBg: 'hover:bg-sky-50/80',
    },
    success: {
      bg: 'bg-green-50 dark:bg-green-950/30',
      iconBg: 'bg-green-100 dark:bg-green-900/50',
      iconColor: 'text-green-600 dark:text-green-400',
      borderColor: isActive ? 'border-green-500' : 'border-transparent',
      hoverBg: 'hover:bg-green-50/80',
    },
    warning: {
      bg: 'bg-amber-50 dark:bg-amber-950/30',
      iconBg: 'bg-amber-100 dark:bg-amber-900/50',
      iconColor: 'text-amber-600 dark:text-amber-400',
      borderColor: isActive ? 'border-amber-500' : 'border-transparent',
      hoverBg: 'hover:bg-amber-50/80',
    },
    danger: {
      bg: 'bg-red-50 dark:bg-red-950/30',
      iconBg: 'bg-red-100 dark:bg-red-900/50',
      iconColor: 'text-red-600 dark:text-red-400',
      borderColor: isActive ? 'border-red-500' : 'border-transparent',
      hoverBg: 'hover:bg-red-50/80',
    },
    neutral: {
      bg: 'bg-gray-50 dark:bg-gray-900/30',
      iconBg: 'bg-gray-100 dark:bg-gray-800/50',
      iconColor: 'text-gray-600 dark:text-gray-400',
      borderColor: isActive ? 'border-gray-500' : 'border-transparent',
      hoverBg: 'hover:bg-gray-50/80',
    },
  };

  const styles = variantStyles[variant];

  return (
    <Card 
      className={cn(
        'transition-all duration-300 border-2',
        styles.bg,
        styles.borderColor,
        onClick ? `cursor-pointer ${styles.hoverBg}` : '',
        className
      )}
      onClick={onClick}
    >
      <CardContent className="p-6">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">{title}</p>
            <div className="flex items-baseline">
              <h3 className="text-2xl font-bold">{value}</h3>
              {valueUnit && <span className="ml-1 text-sm text-gray-500">{valueUnit}</span>}
            </div>
            {subValue !== undefined && (
              <div className="flex items-baseline mt-1">
                <span className="text-base font-medium">{subValue}</span>
                {subValueUnit && <span className="ml-1 text-xs text-gray-500">{subValueUnit}</span>}
              </div>
            )}
            {description && (
              <p className="text-xs text-gray-500 mt-1">{description}</p>
            )}
            {trend && (
              <div className={`flex items-center mt-1 text-xs ${
                trend.isPositive ? 'text-green-600' : 'text-red-600'
              }`}>
                <span>{trend.isPositive ? '↑' : '↓'} {trend.value}%</span>
              </div>
            )}
          </div>
          <div className={`p-2 rounded-lg ${styles.iconBg}`}>
            <Icon className={`h-5 w-5 ${styles.iconColor}`} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default EnhancedKpiCard;
