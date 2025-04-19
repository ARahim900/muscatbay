"use client"

interface TabButtonProps {
  label: string
  active: boolean
  onClick: () => void
  theme: any
}

export const TabButton = ({ label, active, onClick, theme }: TabButtonProps) => {
  return (
    <button
      className={`px-5 py-3 font-medium text-sm whitespace-nowrap border-b-2 transition-all duration-200 ${
        active ? `border-opacity-100` : `border-transparent hover:border-gray-300 dark:hover:border-gray-500`
      }`}
      style={active ? { borderColor: theme.primary, color: theme.primary } : { color: theme.textSecondary }}
      onClick={onClick}
      onMouseOver={(e) => {
        if (!active) {
          e.currentTarget.style.color = theme.text
        }
      }}
      onMouseOut={(e) => {
        if (!active) {
          e.currentTarget.style.color = theme.textSecondary
        }
      }}
    >
      {label}
    </button>
  )
}
