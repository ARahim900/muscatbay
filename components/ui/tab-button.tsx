"use client"

import type React from "react"

interface TabButtonProps {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}

export const TabButton: React.FC<TabButtonProps> = ({ active, onClick, children }) => {
  return (
    <button
      onClick={onClick}
      className={`py-4 px-6 font-medium text-sm border-b-2 transition-colors duration-200 ${
        active
          ? "border-blue-500 text-blue-600 dark:text-blue-400 dark:border-blue-400"
          : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600"
      }`}
    >
      {children}
    </button>
  )
}
