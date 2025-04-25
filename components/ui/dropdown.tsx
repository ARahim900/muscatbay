"use client"

import type React from "react"
import { useState } from "react"
import { ChevronDown } from "lucide-react"

interface DropdownOption {
  value: string
  label: string
}

interface DropdownProps {
  value: string
  options: DropdownOption[]
  onChange: (value: string) => void
  className?: string
}

export const Dropdown: React.FC<DropdownProps> = ({ value, options, onChange, className = "" }) => {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className={`relative inline-block ${className}`}>
      <div
        className="inline-flex items-center justify-between rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-1.5 text-sm shadow-sm cursor-pointer transition-all hover:border-gray-400 dark:hover:border-gray-600"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span>{options.find((opt) => opt.value === value)?.label || value}</span>
        <ChevronDown
          size={16}
          className={`ml-2 text-gray-500 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
        />
      </div>

      {isOpen && (
        <div className="absolute z-10 mt-1 w-full bg-white dark:bg-gray-800 rounded-md shadow-lg border border-gray-200 dark:border-gray-700 py-1 max-h-60 overflow-auto">
          {options.map((option) => (
            <div
              key={option.value}
              className={`px-3 py-1.5 text-sm cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${option.value === value ? "bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400" : ""}`}
              onClick={() => {
                onChange(option.value)
                setIsOpen(false)
              }}
            >
              {option.label}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
