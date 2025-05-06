"use client"

import type * as React from "react"
import {
  ResponsiveContainer,
  LineChart as RechartsLineChart,
  BarChart as RechartsBarChart,
  AreaChart as RechartsAreaChart,
  PieChart as RechartsPieChart,
  Line,
  Bar,
  Area,
  Pie,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Cell,
} from "recharts"
import { cn } from "@/lib/utils"

const COLORS = {
  blue: ["#0ea5e9", "#38bdf8", "#7dd3fc"],
  green: ["#22c55e", "#4ade80", "#86efac"],
  amber: ["#f59e0b", "#fbbf24", "#fcd34d"],
  red: ["#ef4444", "#f87171", "#fca5a5"],
  purple: ["#a855f7", "#c084fc", "#d8b4fe"],
  indigo: ["#6366f1", "#818cf8", "#a5b4fc"],
  pink: ["#ec4899", "#f472b6", "#f9a8d4"],
  teal: ["#14b8a6", "#2dd4bf", "#5eead4"],
  orange: ["#f97316", "#fb923c", "#fdba74"],
  cyan: ["#06b6d4", "#22d3ee", "#67e8f9"],
  emerald: ["#10b981", "#34d399", "#6ee7b7"],
}

interface ChartProps extends React.HTMLAttributes<HTMLDivElement> {
  data: any[]
  index: string
  categories: string[]
  colors?: (keyof typeof COLORS)[]
  valueFormatter?: (value: number) => string
  yAxisWidth?: number
  showLegend?: boolean
  showXAxis?: boolean
  showYAxis?: boolean
  showGrid?: boolean
}

const LineChart = ({
  data,
  index,
  categories,
  colors = ["blue"],
  valueFormatter = (value: number) => `${value}`,
  yAxisWidth = 40,
  showLegend = true,
  showXAxis = true,
  showYAxis = true,
  showGrid = true,
  className,
  ...props
}: ChartProps) => {
  return (
    <div className={cn("w-full h-full", className)} {...props}>
      <ResponsiveContainer width="100%" height="100%">
        <RechartsLineChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
          {showGrid && <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.3} vertical={false} />}
          {showXAxis && <XAxis dataKey={index} fontSize={12} tickLine={false} axisLine={false} />}
          {showYAxis && (
            <YAxis width={yAxisWidth} fontSize={12} tickLine={false} axisLine={false} tickFormatter={valueFormatter} />
          )}
          <Tooltip
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                return (
                  <div className="rounded-lg border bg-background p-2 shadow-sm">
                    <div className="grid grid-cols-2 gap-2">
                      {payload.map((entry, index) => (
                        <div key={`item-${index}`} className="flex flex-col">
                          <span className="text-[0.70rem] uppercase text-muted-foreground">{entry.name}</span>
                          <span className="font-bold text-muted-foreground">
                            {valueFormatter(entry.value as number)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              }
              return null
            }}
          />
          {showLegend && <Legend />}
          {categories.map((category, i) => {
            // Get color safely with fallback to blue
            const colorKey = colors[i % colors.length] || "blue"
            const colorValue = COLORS[colorKey] ? COLORS[colorKey][0] : "#0ea5e9" // Default to blue if color not found

            return (
              <Line
                key={category}
                type="monotone"
                dataKey={category}
                stroke={colorValue}
                strokeWidth={2}
                dot={{ r: 4, fill: colorValue }}
                activeDot={{ r: 6 }}
              />
            )
          })}
        </RechartsLineChart>
      </ResponsiveContainer>
    </div>
  )
}

const BarChart = ({
  data,
  index,
  categories,
  colors = ["blue"],
  valueFormatter = (value: number) => `${value}`,
  yAxisWidth = 40,
  showLegend = true,
  showXAxis = true,
  showYAxis = true,
  showGrid = true,
  className,
  ...props
}: ChartProps) => {
  return (
    <div className={cn("w-full h-full", className)} {...props}>
      <ResponsiveContainer width="100%" height="100%">
        <RechartsBarChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
          {showGrid && <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.3} vertical={false} />}
          {showXAxis && <XAxis dataKey={index} fontSize={12} tickLine={false} axisLine={false} />}
          {showYAxis && (
            <YAxis width={yAxisWidth} fontSize={12} tickLine={false} axisLine={false} tickFormatter={valueFormatter} />
          )}
          <Tooltip
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                return (
                  <div className="rounded-lg border bg-background p-2 shadow-sm">
                    <div className="grid grid-cols-2 gap-2">
                      {payload.map((entry, index) => (
                        <div key={`item-${index}`} className="flex flex-col">
                          <span className="text-[0.70rem] uppercase text-muted-foreground">{entry.name}</span>
                          <span className="font-bold text-muted-foreground">
                            {valueFormatter(entry.value as number)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              }
              return null
            }}
          />
          {showLegend && <Legend />}
          {categories.map((category, i) => {
            // Get color safely with fallback to blue
            const colorKey = colors[i % colors.length] || "blue"
            const colorValue = COLORS[colorKey] ? COLORS[colorKey][0] : "#0ea5e9" // Default to blue if color not found

            return <Bar key={category} dataKey={category} fill={colorValue} radius={[4, 4, 0, 0]} barSize={20} />
          })}
        </RechartsBarChart>
      </ResponsiveContainer>
    </div>
  )
}

const AreaChart = ({
  data,
  index,
  categories,
  colors = ["blue"],
  valueFormatter = (value: number) => `${value}`,
  yAxisWidth = 40,
  showLegend = true,
  showXAxis = true,
  showYAxis = true,
  showGrid = true,
  className,
  ...props
}: ChartProps) => {
  return (
    <div className={cn("w-full h-full", className)} {...props}>
      <ResponsiveContainer width="100%" height="100%">
        <RechartsAreaChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
          {categories.map((category, i) => {
            // Get color safely with fallback to blue
            const colorKey = colors[i % colors.length] || "blue"
            const colorValue = COLORS[colorKey] ? COLORS[colorKey][0] : "#0ea5e9" // Default to blue if color not found

            return (
              <defs key={`gradient-${category}`}>
                <linearGradient id={`gradient-${category}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={colorValue} stopOpacity={0.8} />
                  <stop offset="95%" stopColor={colorValue} stopOpacity={0.1} />
                </linearGradient>
              </defs>
            )
          })}
          {showGrid && <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.3} vertical={false} />}
          {showXAxis && <XAxis dataKey={index} fontSize={12} tickLine={false} axisLine={false} />}
          {showYAxis && (
            <YAxis width={yAxisWidth} fontSize={12} tickLine={false} axisLine={false} tickFormatter={valueFormatter} />
          )}
          <Tooltip
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                return (
                  <div className="rounded-lg border bg-background p-2 shadow-sm">
                    <div className="grid grid-cols-2 gap-2">
                      {payload.map((entry, index) => (
                        <div key={`item-${index}`} className="flex flex-col">
                          <span className="text-[0.70rem] uppercase text-muted-foreground">{entry.name}</span>
                          <span className="font-bold text-muted-foreground">
                            {valueFormatter(entry.value as number)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              }
              return null
            }}
          />
          {showLegend && <Legend />}
          {categories.map((category, i) => {
            // Get color safely with fallback to blue
            const colorKey = colors[i % colors.length] || "blue"
            const colorValue = COLORS[colorKey] ? COLORS[colorKey][0] : "#0ea5e9" // Default to blue if color not found

            return (
              <Area
                key={category}
                type="monotone"
                dataKey={category}
                stroke={colorValue}
                strokeWidth={2}
                fillOpacity={1}
                fill={`url(#gradient-${category})`}
              />
            )
          })}
        </RechartsAreaChart>
      </ResponsiveContainer>
    </div>
  )
}

interface PieChartProps extends React.HTMLAttributes<HTMLDivElement> {
  data: any[]
  category: string
  index: string
  colors?: (keyof typeof COLORS)[]
  valueFormatter?: (value: number) => string
  showLabel?: boolean
  showLegend?: boolean
}

const PieChart = ({
  data,
  category,
  index,
  colors = ["blue", "green", "amber", "purple", "indigo"],
  valueFormatter = (value: number) => `${value}`,
  showLabel = true,
  showLegend = true,
  className,
  ...props
}: PieChartProps) => {
  return (
    <div className={cn("w-full h-full", className)} {...props}>
      <ResponsiveContainer width="100%" height="100%">
        <RechartsPieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={showLabel}
            outerRadius="80%"
            innerRadius="40%"
            fill="#8884d8"
            dataKey={category}
            nameKey={index}
            label={showLabel ? ({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%` : undefined}
          >
            {data.map((entry, index) => {
              // Get color safely with fallback to blue
              const colorKey = colors[index % colors.length] || "blue"
              const colorValue = COLORS[colorKey] ? COLORS[colorKey][0] : "#0ea5e9" // Default to blue if color not found

              return (
                <Cell
                  key={`cell-${index}`}
                  fill={colorValue}
                  className="focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                />
              )
            })}
          </Pie>
          <Tooltip
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                return (
                  <div className="rounded-lg border bg-background p-2 shadow-sm">
                    <div className="flex flex-col">
                      <span className="text-[0.70rem] uppercase text-muted-foreground">{payload[0].name}</span>
                      <span className="font-bold text-muted-foreground">
                        {valueFormatter(payload[0].value as number)}
                      </span>
                    </div>
                  </div>
                )
              }
              return null
            }}
          />
          {showLegend && <Legend />}
        </RechartsPieChart>
      </ResponsiveContainer>
    </div>
  )
}

export { LineChart, BarChart, AreaChart, PieChart }
