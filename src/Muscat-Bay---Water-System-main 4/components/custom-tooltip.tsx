import { formatNumber } from "@/lib/utils"

interface CustomTooltipProps {
  active?: boolean
  payload?: any[]
  label?: string
  theme: any
}

export const CustomTooltip = ({ active, payload, label, theme }: CustomTooltipProps) => {
  if (active && payload && payload.length) {
    return (
      <div className={`${theme.cardBg} p-3 border ${theme.border} shadow-lg rounded-md text-sm`}>
        <p className={`font-medium mb-1.5 ${theme.text}`}>{label}</p>
        {payload.map((entry, index) => {
          // Ensure we have a valid color
          const color = entry.color || entry.fill || theme.primary

          return (
            <p key={`item-${index}`} className="text-xs flex items-center gap-2 mb-0.5">
              <span className="w-3 h-3 rounded-full inline-block" style={{ backgroundColor: color }} />
              <span className={`font-medium ${theme.text}`}>
                {entry.name}: {formatNumber(entry.value)} {entry.unit || "m³"}
              </span>
            </p>
          )
        })}
      </div>
    )
  }
  return null
}
