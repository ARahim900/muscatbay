"use client"

import type React from "react"

import { useState } from "react"
import { Droplet, RefreshCw, Download, ChevronDown } from "lucide-react"

interface MainHeaderProps {
  title: string
  icon?: React.ReactNode
  onRefresh?: () => void
  onExport?: () => void
  showControls?: boolean
}

export function MainHeader({
  title = "Muscat Bay Operations",
  icon,
  onRefresh,
  onExport,
  showControls = true,
}: MainHeaderProps) {
  const [selectedYear, setSelectedYear] = useState("2025")
  const [selectedMonth, setSelectedMonth] = useState("March")

  const handleRefresh = () => {
    if (onRefresh) {
      onRefresh()
    }
  }

  const handleExport = () => {
    if (onExport) {
      onExport()
    }
  }

  return (
    <header className="bg-[#4E4456] shadow sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-wrap items-center justify-between gap-4 relative">
        <div className="flex items-center">
          {icon || <Droplet className="h-6 w-6 mr-2 text-[#9AD0D2]" />}
          <h1 className="text-xl md:text-2xl font-bold text-white">{title}</h1>
        </div>

        {showControls && (
          <div className="flex items-center space-x-3 flex-wrap gap-2">
            {/* Year Selector */}
            <div className="relative">
              <select
                className="appearance-none border rounded-md px-3 py-1.5 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#4E4456] focus:ring-[#9AD0D2]"
                style={{ background: `rgba(78, 68, 86, 0.9)`, color: "white", borderColor: `rgba(154, 208, 210, 0.6)` }}
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
              >
                <option value="2025">2025</option>
                <option value="2024">2024</option>
              </select>
              <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 pointer-events-none text-white opacity-70" />
            </div>

            {/* Month Selector */}
            <div className="relative">
              <select
                className="appearance-none border rounded-md px-3 py-1.5 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#4E4456] focus:ring-[#9AD0D2]"
                style={{ background: `rgba(78, 68, 86, 0.9)`, color: "white", borderColor: `rgba(154, 208, 210, 0.6)` }}
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
              >
                {[
                  "January",
                  "February",
                  "March",
                  "April",
                  "May",
                  "June",
                  "July",
                  "August",
                  "September",
                  "October",
                  "November",
                  "December",
                ].map((month) => (
                  <option key={month} value={month}>
                    {month}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 pointer-events-none text-white opacity-70" />
            </div>

            {/* Refresh Button */}
            <button
              className="flex items-center border rounded-md px-3 py-1.5 text-sm hover:bg-opacity-75 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#4E4456] focus:ring-[#9AD0D2] transition-colors"
              style={{ background: `rgba(78, 68, 86, 0.9)`, color: "white", borderColor: `rgba(154, 208, 210, 0.6)` }}
              onClick={handleRefresh}
            >
              <RefreshCw className="h-4 w-4 mr-1.5" />
              Refresh
            </button>

            {/* Export Button */}
            <button
              className="flex items-center border rounded-md px-3 py-1.5 text-sm hover:bg-opacity-75 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#4E4456] focus:ring-[#9AD0D2] transition-colors"
              style={{ background: `rgba(78, 68, 86, 0.9)`, color: "white", borderColor: `rgba(154, 208, 210, 0.6)` }}
              onClick={handleExport}
            >
              <Download className="h-4 w-4 mr-1.5" />
              Export
            </button>
          </div>
        )}
      </div>
    </header>
  )
}
