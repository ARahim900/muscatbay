import { formatNumber } from "@/lib/utils"
import type { LucideIcon } from "lucide-react"

interface MetricCardProps {
  title: string
  value: number | string
  unit?: string
  subValue?: number | string
  subUnit?: string
  icon: LucideIcon
  color: string
  percentage?: number
  theme: any
}

export const MetricCard = ({
  title,
  value,
  unit,
  subValue,
  subUnit = "",
  icon: Icon,
  color,
  percentage = 0,
  theme,
}: MetricCardProps) => {
  const displayValue =
    typeof value === "number" || (typeof value === "string" && !isNaN(Number(value))) ? formatNumber(value) : value

  return (
    <div
      className={`${theme.cardBg} rounded-lg ${theme.shadow} p-5 flex flex-col min-h-[10rem] h-auto relative overflow-hidden transition-all duration-300 hover:shadow-lg group`}
    >
      <div className="absolute left-0 top-0 h-full w-1.5 bg-opacity-90" style={{ backgroundColor: color }}></div>
      <div className="flex justify-between items-start mb-3">
        <div className={`text-sm font-medium ${theme.textSecondary}`}>{title}</div>
        <div
          className="p-2 rounded-full bg-opacity-20 transition-colors duration-300 group-hover:bg-opacity-30"
          style={{ backgroundColor: `${color}30` }}
        >
          <Icon size={20} style={{ color: color }} />
        </div>
      </div>
      <div className="mt-1 flex items-baseline">
        <div className={`text-3xl font-bold ${theme.text}`}>{displayValue}</div>
        {unit && <div className={`ml-1.5 text-sm ${theme.textSecondary}`}>{unit}</div>}
      </div>
      {subValue !== undefined && subValue !== null && subValue !== "" && (
        <div className={`mt-2 text-sm ${theme.textSecondary}`}>
          {typeof subValue === "number" || (typeof subValue === "string" && !isNaN(Number(subValue)))
            ? formatNumber(subValue, subUnit === "OMR" ? 2 : subUnit === "%" || subUnit.includes("%") ? 1 : 0)
            : subValue}
          {subUnit && <span className="ml-1">{subUnit}</span>}
          {typeof percentage === "number" && !isNaN(percentage) && percentage !== 0 && (
            <span className={`ml-2 ${percentage >= 0 ? "text-green-500" : "text-red-500"}`}>
              {percentage >= 0 ? "+" : ""}
              {formatNumber(percentage, 1)}%
            </span>
          )}
        </div>
      )}
    </div>
  )
}
