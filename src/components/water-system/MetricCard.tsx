
import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { LucideIcon } from 'lucide-react';

interface TrendInfo {
  value: number;
  icon: LucideIcon;
  label: string;
}

interface MetricCardProps {
  title: string;
  value: string | number;
  unit?: string;
  icon: React.ReactNode;
  trend?: TrendInfo;
}

export function MetricCard({ title, value, unit, icon, trend }: MetricCardProps) {
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-6">
        <div className="flex justify-between items-start mb-3">
          <p className="text-sm text-muted-foreground">{title}</p>
          <div className="bg-muted p-2 rounded-full">
            {icon}
          </div>
        </div>
        <div className="flex items-baseline">
          <div className="text-2xl font-bold mr-1">{value}</div>
          {unit && <div className="text-sm text-muted-foreground">{unit}</div>}
        </div>
        {trend && (
          <div className="flex items-center mt-2 text-xs">
            <trend.icon className={`h-3 w-3 mr-1 ${trend.value >= 0 ? 'text-green-500' : 'text-red-500'}`} />
            <span className={trend.value >= 0 ? 'text-green-500' : 'text-red-500'}>
              {trend.value >= 0 ? '+' : ''}{trend.value}%
            </span>
            <span className="text-muted-foreground ml-1">{trend.label}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
