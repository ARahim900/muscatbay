"use client"
import { Moon, Sun } from "lucide-react"

interface ThemeToggleProps {
  darkMode: boolean
  setDarkMode: (darkMode: boolean) => void
}

export const ThemeToggle = ({ darkMode, setDarkMode }: ThemeToggleProps) => (
  <button
    onClick={() => setDarkMode(!darkMode)}
    className={`p-2 rounded-md transition-colors duration-200 border focus:outline-none focus:ring-2 focus:ring-offset-1 ${
      darkMode
        ? `bg-gray-700 text-yellow-300 hover:bg-gray-600 border-gray-600 focus:ring-yellow-400`
        : `bg-gray-200 text-gray-700 hover:bg-gray-300 border-gray-300 focus:ring-gray-500`
    }`}
    aria-label="Toggle theme"
  >
    {darkMode ? <Sun size={18} /> : <Moon size={18} />}
  </button>
)
