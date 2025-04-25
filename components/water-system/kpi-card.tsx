import type React from "react"
import type { LucideIcon } from "lucide-react"

interface KPICardProps {
  title: string
  value: string
  description: string
  icon: LucideIcon
  theme: any
  bgColor: string
}

const KPI_Card: React.FC<KPICardProps> = ({ title, value, description, icon: Icon, theme, bgColor }) => {
  return (
    <div className="rounded-lg shadow-md p-6 transition-shadow hover:shadow-lg" style={{ backgroundColor: bgColor }}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium" style={{ color: theme.white }}>
          {title}
        </h3>
        <Icon className="h-5 w-5" style={{ color: theme.white }} />
      </div>
      <p className="text-3xl font-bold mb-1" style={{ color: theme.white }}>
        {value}
      </p>
      <p className="text-xs" style={{ color: `${theme.white}90` }}>
        {description}
      </p>
    </div>
  )
}

export default KPI_Card
