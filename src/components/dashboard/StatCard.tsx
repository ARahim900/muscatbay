
import React from 'react';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';
import DashboardCard from './DashboardCard';

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
  const colorMap = {
    primary: 'bg-muscat-primary/10 text-muscat-primary',
    teal: 'bg-muscat-teal/10 text-muscat-teal',
    lavender: 'bg-muscat-lavender/10 text-muscat-lavender',
    gold: 'bg-muscat-gold/10 text-muscat-gold'
  };
  
  return (
    <DashboardCard className={cn("overflow-hidden", className)} delay={delay}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-muscat-primary/60">{title}</p>
          <h3 className="stat-value">{value}</h3>
          {description && (
            <p className="mt-1 text-xs text-muscat-primary/60">{description}</p>
          )}
          
          {trend && (
            <div className="flex items-center mt-2">
              <span 
                className={cn(
                  "text-xs font-medium",
                  trend.isPositive ? "text-green-500" : "text-red-500"
                )}
              >
                {trend.isPositive ? '+' : ''}{trend.value}%
              </span>
              <span className="ml-1 text-xs text-muscat-primary/60">vs last period</span>
            </div>
          )}
        </div>
        
        <div className={cn("p-2 rounded-lg", colorMap[color])}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </DashboardCard>
  );
};

export default StatCard;
