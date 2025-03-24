
import React, { ReactNode } from 'react'
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  TooltipProps
} from 'recharts'
import { cn } from '@/lib/utils'

export interface ChartProps {
  className?: string;
  children: React.ReactElement; // This ensures children is a React element, not just any ReactNode
  config?: Record<string, unknown>;
}

export const Chart = ({ className, children }: ChartProps) => {
  return (
    <div className={cn('w-full h-full', className)}>
      <ResponsiveContainer width="100%" height="100%">
        {children}
      </ResponsiveContainer>
    </div>
  )
}

export const ChartContainer = ({ children, className }: { children: React.ReactElement; className?: string }) => {
  return <div className={cn('w-full h-64 md:h-80', className)}>{children}</div>
}

// Add missing chart components
export const ChartTooltip = ({ 
  active, 
  payload, 
  label, 
  formatter, 
  labelFormatter 
}: TooltipProps<any, any> & { 
  formatter?: (value: any, name?: string) => React.ReactNode;
  labelFormatter?: (label: any) => React.ReactNode;
}) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-background border border-border p-3 rounded-lg shadow-md">
        {labelFormatter ? (
          labelFormatter(label)
        ) : (
          <p className="text-sm font-medium mb-1">{label}</p>
        )}
        {payload.map((entry, index) => (
          <div key={`item-${index}`} className="flex items-center gap-2 text-sm">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            <span className="font-medium">{entry.name}: </span>
            {formatter ? formatter(entry.value, entry.name) : entry.value}
          </div>
        ))}
      </div>
    )
  }
  return null
}

export const ChartTooltipContent = ({ 
  children 
}: { 
  children: ReactNode 
}) => {
  return (
    <div className="bg-background border border-border p-3 rounded-lg shadow-md">
      {children}
    </div>
  )
}
