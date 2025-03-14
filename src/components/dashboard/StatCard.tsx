
import React from 'react';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';
import DashboardCard from './DashboardCard';
import { useIsMobile } from '@/hooks/use-mobile';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  description?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  color?: 'primary' | 'teal' | 'lavender' | 'gold';
  className?: string;
  delay?: number;
}

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon: Icon,
  description,
  trend,
  color = 'primary',
  className,
  delay
}) => {
  const isMobile = useIsMobile();
  
  const colorMap = {
    primary: 'bg-muscat-primary/10 text-muscat-primary',
    teal: 'bg-muscat-teal/10 text-muscat-teal',
    lavender: 'bg-muscat-lavender/10 text-muscat-lavender',
    gold: 'bg-muscat-gold/10 text-muscat-gold'
  };
  
  return (
    <DashboardCard className={cn(
      "overflow-hidden bg-gradient-to-br from-white to-muscat-light/30 dark:from-gray-800 dark:to-gray-900",
      isMobile ? "p-4" : "",
      className
    )} delay={delay}>
      <div className="flex items-start justify-between">
        <div className={cn("mr-2", isMobile ? "max-w-[70%]" : "")}>
          <p className="text-sm font-medium text-muscat-primary/70 dark:text-white/70 text-balance">{title}</p>
          <h3 className={cn(
            "font-bold text-muscat-primary dark:text-white mt-1 stat-value wrap-anywhere",
            isMobile ? "text-xl" : "text-2xl"
          )}>{value}</h3>
          {description && (
            <p className="mt-1 text-xs text-muscat-primary/60 dark:text-white/60 text-balance">{description}</p>
          )}
          
          {trend && (
            <div className="flex items-center mt-2 flex-wrap">
              <span 
                className={cn(
                  "text-xs font-medium flex items-center",
                  trend.isPositive ? "text-amber-600 dark:text-amber-400" : "text-green-600 dark:text-green-400"
                )}
              >
                {trend.isPositive ? '+' : ''}{trend.value}%
                <span className={cn(
                  "inline-block w-1.5 h-1.5 ml-1 rounded-full",
                  trend.isPositive ? "bg-amber-600 dark:bg-amber-400" : "bg-green-600 dark:bg-green-400" 
                )}></span>
              </span>
              <span className="ml-1 text-xs text-muscat-primary/60 dark:text-white/60">vs last period</span>
            </div>
          )}
        </div>
        
        <div className={cn(
          "rounded-xl shadow-sm flex-shrink-0", 
          colorMap[color],
          isMobile ? "p-2" : "p-3"
        )}>
          <Icon className={isMobile ? "w-4 h-4" : "w-5 h-5"} />
        </div>
      </div>
    </DashboardCard>
  );
};

export default StatCard;
