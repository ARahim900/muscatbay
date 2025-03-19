
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight } from "lucide-react";

interface MetricCardProps {
  title: string;
  value: string;
  description: string;
  tagText?: string;
  trend?: {
    value: string;
    isPositive: boolean;
  };
  colorClass: string;
  children?: React.ReactNode;
}

const MetricCard: React.FC<MetricCardProps> = ({ 
  title, 
  value, 
  description, 
  tagText, 
  trend, 
  colorClass,
  children 
}) => {
  return (
    <Card className="border-0 bg-white dark:bg-gray-800 shadow-soft hover:shadow-md transition-all duration-300 overflow-hidden transform hover:translate-y-[-3px]">
      <div className={`h-1.5 ${colorClass}`}></div>
      <CardHeader>
        <CardTitle className="text-muscat-primary flex items-center">
          {title}
          {tagText && (
            <span className="ml-2 text-xs px-2 py-0.5 bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 rounded-full">{tagText}</span>
          )}
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        {value && (
          <div className="text-3xl font-bold text-gray-800 dark:text-white bg-gradient-to-r from-muscat-primary to-muscat-lavender bg-clip-text text-transparent font-mono">{value}</div>
        )}
        {trend && (
          <p className="text-muted-foreground flex items-center mt-1">
            Today's usage
            <span className="ml-2 text-xs px-1.5 py-0.5 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 rounded-full flex items-center">
              {trend.value} <ArrowRight className="h-3 w-3 -rotate-90" />
            </span>
          </p>
        )}
        {children}
      </CardContent>
    </Card>
  );
};

export default MetricCard;
