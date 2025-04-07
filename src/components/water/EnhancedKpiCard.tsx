
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { LucideIcon } from 'lucide-react';
import { waterColors } from './WaterTheme';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

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
  // Define elegant variant styles with gradients and better contrast
  const variantStyles = {
    primary: {
      gradient: 'bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30',
      iconBg: 'bg-blue-100/80 dark:bg-blue-800/50',
      iconColor: 'text-blue-600 dark:text-blue-400',
      borderColor: isActive ? 'border-blue-500' : 'border-transparent',
      hoverBg: 'hover:shadow-blue-100 dark:hover:shadow-blue-900/20',
      titleColor: 'text-blue-700 dark:text-blue-300',
      valueColor: 'text-blue-900 dark:text-blue-50',
      descColor: 'text-blue-600/70 dark:text-blue-400/70'
    },
    secondary: {
      gradient: 'bg-gradient-to-br from-sky-50 to-cyan-100 dark:from-sky-900/30 dark:to-cyan-800/30',
      iconBg: 'bg-sky-100/80 dark:bg-sky-800/50',
      iconColor: 'text-sky-600 dark:text-sky-400',
      borderColor: isActive ? 'border-sky-500' : 'border-transparent',
      hoverBg: 'hover:shadow-sky-100 dark:hover:shadow-sky-900/20',
      titleColor: 'text-sky-700 dark:text-sky-300',
      valueColor: 'text-sky-900 dark:text-sky-50',
      descColor: 'text-sky-600/70 dark:text-sky-400/70'
    },
    success: {
      gradient: 'bg-gradient-to-br from-green-50 to-emerald-100 dark:from-green-900/30 dark:to-emerald-800/30',
      iconBg: 'bg-green-100/80 dark:bg-green-800/50',
      iconColor: 'text-green-600 dark:text-green-400',
      borderColor: isActive ? 'border-green-500' : 'border-transparent',
      hoverBg: 'hover:shadow-green-100 dark:hover:shadow-green-900/20',
      titleColor: 'text-green-700 dark:text-green-300',
      valueColor: 'text-green-900 dark:text-green-50',
      descColor: 'text-green-600/70 dark:text-green-400/70'
    },
    warning: {
      gradient: 'bg-gradient-to-br from-amber-50 to-yellow-100 dark:from-amber-900/30 dark:to-yellow-800/30',
      iconBg: 'bg-amber-100/80 dark:bg-amber-800/50',
      iconColor: 'text-amber-600 dark:text-amber-400',
      borderColor: isActive ? 'border-amber-500' : 'border-transparent',
      hoverBg: 'hover:shadow-amber-100 dark:hover:shadow-amber-900/20',
      titleColor: 'text-amber-700 dark:text-amber-300',
      valueColor: 'text-amber-900 dark:text-amber-50',
      descColor: 'text-amber-600/70 dark:text-amber-400/70'
    },
    danger: {
      gradient: 'bg-gradient-to-br from-red-50 to-rose-100 dark:from-red-900/30 dark:to-rose-800/30',
      iconBg: 'bg-red-100/80 dark:bg-red-800/50',
      iconColor: 'text-red-600 dark:text-red-400',
      borderColor: isActive ? 'border-red-500' : 'border-transparent',
      hoverBg: 'hover:shadow-red-100 dark:hover:shadow-red-900/20',
      titleColor: 'text-red-700 dark:text-red-300',
      valueColor: 'text-red-900 dark:text-red-50',
      descColor: 'text-red-600/70 dark:text-red-400/70'
    },
    neutral: {
      gradient: 'bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800/50 dark:to-gray-700/50',
      iconBg: 'bg-gray-100/80 dark:bg-gray-700/50',
      iconColor: 'text-gray-600 dark:text-gray-400',
      borderColor: isActive ? 'border-gray-500' : 'border-transparent',
      hoverBg: 'hover:shadow-gray-100 dark:hover:shadow-gray-900/20',
      titleColor: 'text-gray-700 dark:text-gray-300',
      valueColor: 'text-gray-900 dark:text-gray-50',
      descColor: 'text-gray-600/70 dark:text-gray-400/70'
    },
  };

  const styles = variantStyles[variant];

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      transition={{ type: "spring", stiffness: 400, damping: 10 }}
    >
      <Card 
        className={cn(
          'transition-all duration-300 border-0 shadow-md overflow-hidden rounded-xl',
          styles.gradient,
          styles.borderColor,
          onClick ? `cursor-pointer ${styles.hoverBg}` : '',
          className
        )}
        onClick={onClick}
      >
        <CardContent className="p-0">
          <div className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className={cn("text-sm font-medium mb-1", styles.titleColor)}>{title}</p>
                <div className="flex items-baseline">
                  <h3 className={cn("text-2xl font-bold leading-none", styles.valueColor)}>{value}</h3>
                  {valueUnit && <span className={cn("ml-1 text-sm", styles.descColor)}>{valueUnit}</span>}
                </div>
                {subValue !== undefined && (
                  <div className="flex items-baseline mt-1">
                    <span className={cn("text-base font-medium", styles.valueColor)}>{subValue}</span>
                    {subValueUnit && <span className={cn("ml-1 text-xs", styles.descColor)}>{subValueUnit}</span>}
                  </div>
                )}
                {description && (
                  <p className={cn("text-xs mt-2", styles.descColor)}>{description}</p>
                )}
                {trend && (
                  <div className={`flex items-center mt-2 text-xs ${
                    trend.isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                  }`}>
                    <span>{trend.isPositive ? '↑' : '↓'} {trend.value}%</span>
                  </div>
                )}
              </div>
              <div className={cn("p-2.5 rounded-full", styles.iconBg)}>
                <Icon className={cn("h-5 w-5", styles.iconColor)} />
              </div>
            </div>
          </div>
          {/* Add a colored bottom border accent for visual appeal */}
          <div className={cn(
            "h-1 w-full",
            variant === 'primary' ? 'bg-blue-500' : 
            variant === 'secondary' ? 'bg-sky-500' : 
            variant === 'success' ? 'bg-green-500' : 
            variant === 'warning' ? 'bg-amber-500' : 
            variant === 'danger' ? 'bg-red-500' : 
            'bg-gray-500'
          )} />
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default EnhancedKpiCard;
