"use client"

interface FilterButtonProps {
  label: string
  active: boolean
  color: string
  onClick: () => void
  theme: any
}

export const FilterButton = ({ label, active, color, onClick, theme }: FilterButtonProps) => (
  <button
    className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all duration-200 flex items-center gap-1.5 border shadow-sm ${
      active
        ? `shadow border-opacity-70`
        : `bg-transparent hover:bg-opacity-10 border-transparent hover:border-opacity-30`
    }`}
    style={{
      backgroundColor: active ? `${color}20` : "transparent",
      color: active ? color : theme.textSecondary,
      borderColor: active ? color : "transparent",
      borderWidth: "1px",
      boxShadow: active ? `0 1px 4px ${color}30` : "none",
    }}
    onClick={onClick}
    onMouseOver={(e) => {
      if (!active) {
        e.currentTarget.style.backgroundColor = `${color}15`
        e.currentTarget.style.borderColor = `${color}40` // Increased opacity for better visibility
        e.currentTarget.style.boxShadow = `0 1px 4px ${color}30`
      }
    }}
    onMouseOut={(e) => {
      if (!active) {
        e.currentTarget.style.backgroundColor = "transparent"
        e.currentTarget.style.borderColor = "transparent"
        e.currentTarget.style.boxShadow = "none"
      }
    }}
  >
    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }}></div>
    {label}
  </button>
)
