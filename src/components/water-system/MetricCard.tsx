
import { Card, CardContent } from "@/components/ui/card"
import { LucideIcon } from "lucide-react"

interface MetricCardProps {
  title: string
  value: string
  unit?: string
  icon?: React.ReactNode
  trend?: {
    value: number
    icon: LucideIcon
    label: string
  }
}

export function MetricCard({
  title,
  value,
  unit,
  icon,
  trend,
}: MetricCardProps) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between space-y-0 pb-2">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          {icon}
        </div>
        <div className="flex items-baseline gap-2">
          <h3 className="text-2xl font-bold">{value}</h3>
          {unit && <span className="text-sm text-muted-foreground">{unit}</span>}
        </div>
        {trend && (
          <div className="flex items-center gap-1 mt-2">
            <trend.icon
              className={`h-4 w-4 ${
                trend.value >= 0 ? "text-green-500" : "text-red-500"
              }`}
            />
            <p
              className={`text-sm ${
                trend.value >= 0 ? "text-green-500" : "text-red-500"
              }`}
            >
              {Math.abs(trend.value)}%
            </p>
            <p className="text-sm text-muted-foreground">{trend.label}</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
