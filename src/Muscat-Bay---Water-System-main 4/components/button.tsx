"use client"

import type React from "react"
import type { LucideIcon } from "lucide-react"

interface ButtonProps {
  children: React.ReactNode
  icon?: LucideIcon
  onClick: () => void
  theme: any
  primary?: boolean
  className?: string
}

export const Button = ({ children, icon: Icon, onClick, theme, primary = false, className = "" }: ButtonProps) => {
  let baseClasses = `flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-md text-sm font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 ${className}`

  if (primary) {
    baseClasses += ` text-white`
    return (
      <button
        onClick={onClick}
        className={baseClasses}
        style={{ backgroundColor: theme.primary }}
        onMouseOver={(e) => (e.currentTarget.style.opacity = "0.9")}
        onMouseOut={(e) => (e.currentTarget.style.opacity = "1")}
      >
        {Icon && <Icon size={16} />}
        <span>{children}</span>
      </button>
    )
  } else {
    baseClasses += ` ${theme.panelBg} ${theme.text} border ${theme.border} hover:bg-opacity-80 focus:ring-gray-400 dark:focus:ring-gray-500`
    baseClasses += ` hover:bg-gray-200 dark:hover:bg-gray-600`
    return (
      <button onClick={onClick} className={baseClasses}>
        {Icon && <Icon size={16} />}
        <span>{children}</span>
      </button>
    )
  }
}
