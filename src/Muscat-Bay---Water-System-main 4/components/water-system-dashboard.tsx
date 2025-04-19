"use client"

import { useState, useEffect } from "react"
import {
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
  Area,
  ComposedChart,
  Sector,
} from "recharts"
import {
  Droplet,
  BarChart2,
  Activity,
  Calendar,
  FileText,
  Filter,
  Download,
  RefreshCw,
  Search,
  Moon,
  Sun,
} from "lucide-react"
import { MetricCard } from "./metric-card"
import { CustomTooltip } from "./custom-tooltip"
import { FilterButton } from "./filter-button"
import { DataTable } from "./data-table"
import { TabButton } from "./tab-button"
import { waterData } from "@/data/water-data"
import { themes } from "@/lib/theme-config"
import { formatNumber } from "@/lib/utils"

// Custom Label for Donut Chart
const RADIAN = Math.PI / 180
const renderCustomizedLabel = ({
  cx,
  cy,
  midAngle,
  innerRadius,
  outerRadius,
  percent,
  index,
  name,
  theme,
  fill,
}: any) => {
  // For small slices (less than 5%), don't render a label
  if (percent * 100 < 5) {
    return null
  }

  const radius = outerRadius * 1.2
  const x = cx + radius * Math.cos(-midAngle * RADIAN)
  const y = cy + radius * Math.sin(-midAngle * RADIAN)

  return (
    <g>
      <text
        x={x}
        y={y}
        fill={theme.text}
        textAnchor={x > cx ? "start" : "end"}
        dominantBaseline="central"
        fontSize="11"
        fontWeight="500"
      >
        {`${name} (${(percent * 100).toFixed(0)}%)`}
      </text>
    </g>
  )
}

// Active shape for interactive pie chart
const renderActiveShape = (props: any) => {
  const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill, payload, percent, value, theme } = props

  return (
    <g>
      <text x={cx} y={cy} dy={-20} textAnchor="middle" fill={theme.text} fontSize="16" fontWeight="bold">
        {payload.name}
      </text>
      <text x={cx} y={cy} dy={10} textAnchor="middle" fill={theme.textSecondary} fontSize="14">
        {`${formatNumber(value)} m³`}
      </text>
      <text x={cx} y={cy} dy={30} textAnchor="middle" fill={theme.textSecondary} fontSize="14">
        {`(${(percent * 100).toFixed(1)}%)`}
      </text>
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius}
        outerRadius={outerRadius + 8}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
      />
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius - 6}
        outerRadius={innerRadius - 2}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
      />
    </g>
  )
}

export const WaterSystemDashboard = () => {
  // State Hooks
  const [selectedYear, setSelectedYear] = useState("2025")
  const [selectedTab, setSelectedTab] = useState("overview")
  const [selectedMonth, setSelectedMonth] = useState("All")
  const [darkMode, setDarkMode] = useState(false)
  const [visibleSeries, setVisibleSeries] = useState({ l1: true, l2dc: true, l3dc: true, loss: true })
  const [visibleZones, setVisibleZones] = useState<Record<string, boolean>>({})
  const [activeIndex, setActiveIndex] = useState(0)

  const theme = darkMode ? themes.dark : themes.light

  // Data Filtering Functions
  const getFilteredMonthlyData = () => {
    if (!waterData[selectedYear]?.monthly) return []
    const data =
      selectedMonth === "All"
        ? waterData[selectedYear].monthly
        : waterData[selectedYear].monthly.filter((item) => item.month === selectedMonth)

    return data.map((item) => ({
      ...item,
      l2dc: (item.l2 || 0) + (item.dc || 0),
      l3dc: (item.l3 || 0) + (item.dc || 0),
    }))
  }

  const getFilteredZoneData = () => {
    const yearData = waterData[selectedYear]
    if (!yearData?.zoneBulk || !yearData?.monthly) return []

    if (selectedMonth === "All") return yearData.zoneBulk

    const monthIndex = yearData.monthly.findIndex((m) => m.month === selectedMonth)
    if (monthIndex === -1) return yearData.zoneBulk

    const zoneMonthlyData = yearData.zoneMonthly || {}
    return yearData.zoneBulk.map((zone) => {
      const monthlyConsumption = zoneMonthlyData[zone.zone]?.[monthIndex] || 0
      const monthlyLoss = Math.round(monthlyConsumption * ((zone.lossPercentage || 0) / 100))
      return {
        ...zone,
        consumption: monthlyConsumption,
        loss: monthlyLoss,
      }
    })
  }

  const getFilteredConsumptionByType = () => {
    const yearData = waterData[selectedYear]
    if (!yearData?.consumptionByType || !yearData?.monthly) return []

    if (selectedMonth === "All") return yearData.consumptionByType

    const monthIndex = yearData.monthly.findIndex((m) => m.month === selectedMonth)
    if (monthIndex === -1) return yearData.consumptionByType

    const typeMonthly = yearData.typeMonthly || {}
    const totalMonthlyConsumption = yearData.monthly[monthIndex]?.l1 || 1

    return yearData.consumptionByType.map((type) => {
      const monthlyValue =
        type.type === "Loss" ? yearData.monthly[monthIndex]?.loss || 0 : typeMonthly[type.type]?.[monthIndex] || 0

      const percentage = Number.parseFloat(((monthlyValue / totalMonthlyConsumption) * 100).toFixed(1)) || 0

      return {
        ...type,
        value: monthlyValue,
        percentage: percentage,
      }
    })
  }

  const getCurrentVsPreviousYear = () => {
    if (selectedYear !== "2025" || !waterData["2024"]?.monthly || !waterData["2025"]?.monthly)
      return { currentTotal: 0, prevTotal: 0, percentageChange: 0 }

    const currentYearData = waterData["2025"]
    const prevYearData = waterData["2024"]

    const comparableMonths = currentYearData.monthly
      .map((item) => item.month)
      .filter((month) => prevYearData.monthly.some((m) => m.month === month))

    if (comparableMonths.length === 0) return { currentTotal: 0, prevTotal: 0, percentageChange: 0 }

    let currentTotal = 0
    let prevTotal = 0

    if (selectedMonth !== "All") {
      if (comparableMonths.includes(selectedMonth)) {
        const currentMonthData = currentYearData.monthly.find((m) => m.month === selectedMonth)
        const prevMonthData = prevYearData.monthly.find((m) => m.month === selectedMonth)
        currentTotal = currentMonthData?.l1 || 0
        prevTotal = prevMonthData?.l1 || 0
      } else {
        return { currentTotal: 0, prevTotal: 0, percentageChange: 0 }
      }
    } else {
      currentTotal = currentYearData.monthly
        .filter((item) => comparableMonths.includes(item.month))
        .reduce((sum, item) => sum + (item.l1 || 0), 0)

      prevTotal = prevYearData.monthly
        .filter((item) => comparableMonths.includes(item.month))
        .reduce((sum, item) => sum + (item.l1 || 0), 0)
    }

    let percentageChange = 0
    if (prevTotal !== 0)
      percentageChange = Number.parseFloat((((currentTotal - prevTotal) / prevTotal) * 100).toFixed(1))
    else if (currentTotal > 0) percentageChange = Number.POSITIVE_INFINITY

    return { currentTotal, prevTotal, percentageChange }
  }

  const getSummaryData = () => {
    const yearSummary = waterData[selectedYear]?.summary

    if (!yearSummary)
      return {
        totalConsumption: 0,
        avgDailyConsumption: 0,
        totalLoss: 0,
        lossPercentage: 0,
        highestConsumptionMonth: "-",
        lowestConsumptionMonth: "-",
        payableConsumption: 0,
        payableCost: 0,
        waterRate: 1.32,
      }

    if (selectedMonth === "All" || !waterData[selectedYear]?.monthly) return yearSummary

    const monthData = waterData[selectedYear].monthly.find((m) => m.month === selectedMonth)

    if (!monthData) return yearSummary

    const monthIndex = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"].indexOf(
      selectedMonth,
    )
    const daysInMonth = monthIndex !== -1 ? new Date(Number.parseInt(selectedYear), monthIndex + 1, 0).getDate() : 30

    const totalConsumption = monthData.l1 || 0
    const totalLoss = monthData.loss || 0
    const lossPercentage =
      totalConsumption !== 0 ? Number.parseFloat(((totalLoss / totalConsumption) * 100).toFixed(1)) : 0

    return {
      ...yearSummary,
      totalConsumption: totalConsumption,
      avgDailyConsumption: Math.round(totalConsumption / daysInMonth),
      totalLoss: totalLoss,
      lossPercentage: lossPercentage,
    }
  }

  // Get Derived Data
  const yearComparisonData = getCurrentVsPreviousYear()
  const filteredMonthlyData = getFilteredMonthlyData()
  const filteredZoneData = getFilteredZoneData()
  const filteredConsumptionByType = getFilteredConsumptionByType()
  const summaryData = getSummaryData()

  // Prepare Zone Comparison Data
  const prepareZoneComparisonData = () => {
    const yearData = waterData[selectedYear]

    if (!yearData?.monthly || !yearData?.zoneMonthly) return []

    // Get all zones that are visible
    const activeFilteredZoneNames = Object.keys(visibleZones).filter((zone) => visibleZones[zone])

    if (activeFilteredZoneNames.length === 0) return []

    const months = yearData.monthly.map((m) => m.month)

    // Always return all months data for better visualization
    return months.map((month, index) => {
      const dataPoint = { month }

      activeFilteredZoneNames.forEach((zoneName) => {
        if (yearData.zoneMonthly[zoneName]) {
          dataPoint[zoneName] = yearData.zoneMonthly[zoneName][index] || 0
        }
      })

      return dataPoint
    })
  }

  const zoneComparisonData = prepareZoneComparisonData()

  // Column Definitions
  const zoneColumns = [
    { key: "zone", header: "Zone" },
    {
      key: "consumption",
      header: "Consumption (m³)",
      numeric: true,
      decimals: 0,
    },
    {
      key: "loss",
      header: "Loss (m³)",
      numeric: true,
      decimals: 0,
    },
    {
      key: "lossPercentage",
      header: "Loss %",
      numeric: true,
      decimals: 1,
      render: (value: any, row: any, theme: any) => {
        const numericValue = Number(value)
        if (isNaN(numericValue)) return "-"

        const colorClass =
          numericValue < 0
            ? theme.info
            : numericValue > 50
              ? theme.danger
              : numericValue > 20
                ? theme.warning
                : theme.success

        return <span style={{ color: colorClass }}>{numericValue.toFixed(1)}%</span>
      },
    },
  ]

  // Effects
  useEffect(() => {
    document.title = "Water System | Muscat Bay Asset Manager"
  }, [])

  useEffect(() => {
    setSelectedMonth("All")
    const newYearZones = waterData[selectedYear]?.zoneBulk?.map((z) => z.zone) ?? []
    setVisibleZones(
      newYearZones.reduce((acc: Record<string, boolean>, zone) => {
        acc[zone] = true
        return acc
      }, {}),
    )
  }, [selectedYear])

  // Event Handlers
  const handleExportClick = () => {
    alert("Export functionality not implemented.")
  }

  const handleRefreshClick = () => {
    alert("Refresh functionality not implemented (using static data).")
  }

  const handleSearchClick = () => {
    alert("Search functionality not implemented.")
  }

  const handleZoneVisibilityToggle = (zoneName: string) => {
    setVisibleZones((prev) => ({ ...prev, [zoneName]: !prev[zoneName] }))
  }

  const handleSeriesVisibilityToggle = (seriesKey: string) => {
    setVisibleSeries((prev) => ({ ...prev, [seriesKey]: !prev[seriesKey] }))
  }

  const onPieEnter = (_: any, index: number) => {
    setActiveIndex(index)
  }

  return (
    <div className={`min-h-screen ${theme.bg} transition-colors duration-300`}>
      {/* Header Section - Updated with primary color background */}
      <div
        className={`rounded-lg ${theme.shadow} p-5 md:p-6 mb-6 transition-colors duration-300 text-white`}
        style={{ backgroundColor: theme.primary }}
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Title */}
          <div className="flex items-center">
            <div className="p-3 rounded-full mr-3.5 bg-white/20">
              <Droplet size={24} className="text-white" />
            </div>
            <h1 className="text-xl md:text-2xl font-bold text-white">Water System Analysis</h1>
          </div>
          {/* Controls */}
          <div className="flex flex-wrap items-center justify-end gap-2.5">
            {/* Selectors */}
            <select
              className="px-3 py-2 border border-white/30 rounded-md text-sm bg-white/10 text-white focus:outline-none focus:ring-2 focus:ring-white/50"
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
            >
              <option value="2024">2024</option>
              <option value="2025">2025</option>
            </select>
            <select
              className="px-3 py-2 border border-white/30 rounded-md text-sm bg-white/10 text-white focus:outline-none focus:ring-2 focus:ring-white/50"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
            >
              <option value="All">All Months</option>
              {waterData[selectedYear]?.monthly?.map((item) => (
                <option key={item.month} value={item.month}>
                  {item.month}
                </option>
              ))}
            </select>
            {/* Action Buttons */}
            <button
              onClick={handleExportClick}
              className="flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-md text-sm font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-white/50 bg-white/20 hover:bg-white/30 text-white"
            >
              <Download size={16} />
              <span>Export</span>
            </button>
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-2 rounded-md transition-colors duration-200 border border-white/30 focus:outline-none focus:ring-2 focus:ring-white/50 bg-white/10 hover:bg-white/20 text-white"
              aria-label="Toggle theme"
            >
              {darkMode ? <Sun size={18} /> : <Moon size={18} />}
            </button>
          </div>
        </div>
      </div>

      {/* Tab Navigation - Enhanced styling */}
      <div
        className={`${darkMode ? "bg-slate-800" : theme.panelBg} rounded-t-lg border-b ${theme.border} mb-0 transition-colors duration-300`}
      >
        <div className="flex overflow-x-auto">
          <TabButton
            label="Overview"
            active={selectedTab === "overview"}
            onClick={() => setSelectedTab("overview")}
            theme={theme}
          />
          <TabButton
            label="Zone Analysis"
            active={selectedTab === "zones"}
            onClick={() => setSelectedTab("zones")}
            theme={theme}
          />
          <TabButton
            label="Consumption Types"
            active={selectedTab === "types"}
            onClick={() => setSelectedTab("types")}
            theme={theme}
          />
          <TabButton
            label="Loss Analysis"
            active={selectedTab === "loss"}
            onClick={() => setSelectedTab("loss")}
            theme={theme}
          />
        </div>
      </div>

      {/* Tab Content Area */}
      <div className={`${theme.cardBg} rounded-b-lg ${theme.shadow} p-5 md:p-6 mb-6 transition-colors duration-300`}>
        <div className={`text-sm ${theme.textSecondary} mb-5 border-b ${theme.border} pb-3`}>
          Showing:{" "}
          <span className="font-medium">
            {selectedTab.charAt(0).toUpperCase() + selectedTab.slice(1).replace(/([A-Z])/g, " $1")}
          </span>
          {selectedMonth !== "All" ? ` for ${selectedMonth} ${selectedYear}` : ` for ${selectedYear}`}
        </div>

        {/* Overview Tab */}
        {selectedTab === "overview" && (
          <div className="space-y-6">
            {/* Metrics Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              <MetricCard
                title="Total Consumption (L1)"
                value={summaryData.totalConsumption}
                unit="m³"
                subValue={summaryData.avgDailyConsumption}
                subUnit="m³/day avg."
                icon={Droplet}
                color={theme.primary}
                percentage={selectedYear === "2025" ? (yearComparisonData?.percentageChange ?? 0) : 0}
                theme={theme}
              />
              <MetricCard
                title="Total System Loss"
                value={summaryData.totalLoss}
                unit="m³"
                subValue={summaryData.lossPercentage}
                subUnit="% of total"
                icon={BarChart2}
                color={theme.chartColors.lossColor}
                theme={theme}
              />
              <MetricCard
                title="Highest Month (L1)"
                value={waterData[selectedYear]?.monthly?.reduce((max, item) => Math.max(max, item.l1 || 0), 0) || 0}
                unit="m³"
                subValue={summaryData.highestConsumptionMonth}
                icon={Calendar}
                color={theme.info}
                theme={theme}
              />
              <MetricCard
                title="Payable Consumption"
                value={summaryData.payableConsumption}
                unit="m³"
                subValue={summaryData.payableCost}
                subUnit="OMR"
                icon={FileText}
                color={theme.warning}
                theme={theme}
              />
            </div>

            {/* Filter buttons - Enhanced styling */}
            <div className="mb-4 flex flex-wrap items-center gap-2.5">
              <div className={`mr-2 ${theme.textSecondary} flex items-center text-sm`}>
                <Filter size={16} className="mr-1" />
                <span>Chart Series:</span>
              </div>
              <FilterButton
                label="L1"
                active={visibleSeries.l1}
                color={theme.primary}
                onClick={() => handleSeriesVisibilityToggle("l1")}
                theme={theme}
              />
              <FilterButton
                label="L2+DC"
                active={visibleSeries.l2dc}
                color={theme.chartColors.l2dcColor}
                onClick={() => handleSeriesVisibilityToggle("l2dc")}
                theme={theme}
              />
              <FilterButton
                label="L3+DC"
                active={visibleSeries.l3dc}
                color={theme.chartColors.l3dcColor}
                onClick={() => handleSeriesVisibilityToggle("l3dc")}
                theme={theme}
              />
              <FilterButton
                label="Loss"
                active={visibleSeries.loss}
                color={theme.chartColors.lossColor}
                onClick={() => handleSeriesVisibilityToggle("loss")}
                theme={theme}
              />
            </div>

            {/* Main Overview Chart - Enhanced styling */}
            <div className={`${theme.panelBg} rounded-lg p-4 border ${theme.border}`}>
              <h3 className={`text-lg font-medium mb-4 ${theme.text}`}>Monthly Water Flow & Loss</h3>
              <div className="h-96">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={filteredMonthlyData} margin={{ top: 10, right: 10, left: 10, bottom: 10 }}>
                    <defs>
                      <linearGradient id="gradientL1" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={theme.primary} stopOpacity={0.7} />
                        <stop offset="95%" stopColor={theme.primary} stopOpacity={0.1} />
                      </linearGradient>
                      <linearGradient id="gradientL2dc" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={theme.chartColors.l2dcColor} stopOpacity={0.7} />
                        <stop offset="95%" stopColor={theme.chartColors.l2dcColor} stopOpacity={0.1} />
                      </linearGradient>
                      <linearGradient id="gradientL3dc" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={theme.chartColors.l3dcColor} stopOpacity={0.7} />
                        <stop offset="95%" stopColor={theme.chartColors.l3dcColor} stopOpacity={0.1} />
                      </linearGradient>
                      <linearGradient id="gradientLoss" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={theme.chartColors.lossColor} stopOpacity={0.7} />
                        <stop offset="95%" stopColor={theme.chartColors.lossColor} stopOpacity={0.3} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke={darkMode ? "#4b5563" : theme.chartColors.bgGrid}
                      strokeOpacity={darkMode ? 0.5 : 0.3}
                    />
                    <XAxis
                      dataKey="month"
                      tick={{
                        fill: darkMode ? "#f1f5f9" : theme.text,
                        fontSize: 12,
                        fontWeight: darkMode ? "500" : "normal",
                      }}
                      axisLine={{ stroke: darkMode ? "#64748b" : theme.border }}
                      tickLine={{ stroke: darkMode ? "#64748b" : theme.border }}
                    />
                    <YAxis
                      tick={{
                        fill: darkMode ? "#f1f5f9" : theme.text,
                        fontSize: 12,
                        fontWeight: darkMode ? "500" : "normal",
                      }}
                      axisLine={{ stroke: darkMode ? "#64748b" : theme.border }}
                      tickLine={{ stroke: darkMode ? "#64748b" : theme.border }}
                    />
                    <Tooltip content={(props) => <CustomTooltip {...props} theme={theme} />} />
                    <Legend
                      wrapperStyle={{
                        color: darkMode ? "#f1f5f9" : theme.text,
                        fontSize: "12px",
                        paddingTop: "10px",
                        fontWeight: darkMode ? "500" : "normal",
                      }}
                      iconSize={10}
                      iconType="circle"
                    />
                    {visibleSeries.l1 && (
                      <Area
                        isAnimationActive={true}
                        type="monotone"
                        dataKey="l1"
                        stroke="none"
                        fill="url(#gradientL1)"
                        name="L1 Area"
                      />
                    )}
                    {visibleSeries.l2dc && (
                      <Area
                        isAnimationActive={true}
                        type="monotone"
                        dataKey="l2dc"
                        stroke="none"
                        fill="url(#gradientL2dc)"
                        name="L2+DC Area"
                      />
                    )}
                    {visibleSeries.l3dc && (
                      <Area
                        isAnimationActive={true}
                        type="monotone"
                        dataKey="l3dc"
                        stroke="none"
                        fill="url(#gradientL3dc)"
                        name="L3+DC Area"
                      />
                    )}
                    {visibleSeries.l1 && (
                      <Line
                        isAnimationActive={true}
                        type="monotone"
                        dataKey="l1"
                        name="Main Bulk (L1)"
                        stroke={theme.primary}
                        strokeWidth={3}
                        dot={{ r: 4, strokeWidth: 2, fill: theme.cardBg }}
                        activeDot={{ r: 6, strokeWidth: 0, fill: theme.primary }}
                      />
                    )}
                    {visibleSeries.l2dc && (
                      <Line
                        isAnimationActive={true}
                        type="monotone"
                        dataKey="l2dc"
                        name="Zone Bulk + DC (L2+DC)"
                        stroke={theme.chartColors.l2dcColor}
                        strokeWidth={3}
                        dot={{ r: 4, strokeWidth: 2, fill: theme.cardBg }}
                        activeDot={{ r: 6, strokeWidth: 0, fill: theme.chartColors.l2dcColor }}
                      />
                    )}
                    {visibleSeries.l3dc && (
                      <Line
                        isAnimationActive={true}
                        type="monotone"
                        dataKey="l3dc"
                        name="Indiv. Meters + DC (L3+DC)"
                        stroke={theme.chartColors.l3dcColor}
                        strokeWidth={3}
                        dot={{ r: 4, strokeWidth: 2, fill: theme.cardBg }}
                        activeDot={{ r: 6, strokeWidth: 0, fill: theme.chartColors.l3dcColor }}
                      />
                    )}
                    {visibleSeries.loss && (
                      <Bar
                        dataKey="loss"
                        name="System Loss"
                        fill="url(#gradientLoss)"
                        barSize={20}
                        radius={[6, 6, 0, 0]}
                      />
                    )}
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Monthly Data Table - Enhanced styling */}
            <div className={`${theme.panelBg} rounded-lg p-0 border ${theme.border} overflow-hidden`}>
              <h3 className={`text-lg font-medium p-4 mb-0 ${theme.text}`}>Monthly Consumption Details</h3>
              <DataTable
                data={filteredMonthlyData}
                columns={[
                  { key: "month", header: "Month" },
                  { key: "l1", header: "L1 (m³)", numeric: true, decimals: 0 },
                  { key: "l2dc", header: "L2+DC (m³)", numeric: true, decimals: 0 },
                  { key: "l3dc", header: "L3+DC (m³)", numeric: true, decimals: 0 },
                  {
                    key: "loss",
                    header: "Loss (m³)",
                    numeric: true,
                    decimals: 0,
                    render: (value: any) => (
                      <span className={Number(value) < 0 ? "text-blue-500 font-medium" : theme.text}>
                        {formatNumber(value)}
                      </span>
                    ),
                  },
                ]}
                theme={theme}
              />
            </div>
          </div>
        )}

        {/* Zone Analysis Tab */}
        {selectedTab === "zones" && (
          <div className="space-y-6">
            {/* Metrics Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {filteredZoneData.length > 0 && (
                <MetricCard
                  title="Highest Consumption Zone"
                  value={
                    filteredZoneData.reduce((p, c) => ((p.consumption || 0) > (c.consumption || 0) ? p : c), {
                      consumption: 0,
                    }).consumption
                  }
                  unit="m³"
                  subValue={
                    filteredZoneData.reduce((p, c) => ((p.consumption || 0) > (c.consumption || 0) ? p : c), {
                      zone: "N/A",
                    }).zone
                  }
                  icon={Droplet}
                  color={theme.success}
                  theme={theme}
                />
              )}
              {filteredZoneData.length > 0 && (
                <MetricCard
                  title="Highest Loss Zone"
                  value={
                    filteredZoneData.reduce((p, c) => ((p.loss || 0) > (c.loss || 0) ? p : c), {
                      loss: Number.NEGATIVE_INFINITY,
                    }).loss
                  }
                  unit="m³"
                  subValue={
                    filteredZoneData.reduce((p, c) => ((p.loss || 0) > (c.loss || 0) ? p : c), { zone: "N/A" }).zone
                  }
                  icon={BarChart2}
                  color={theme.danger}
                  theme={theme}
                />
              )}
              <MetricCard
                title="Zone Bulk Total"
                value={filteredZoneData.reduce((s, i) => s + (i.consumption || 0), 0)}
                unit="m³"
                subValue={
                  summaryData.totalConsumption !== 0
                    ? (
                        (filteredZoneData.reduce((s, i) => s + (i.consumption || 0), 0) /
                          summaryData.totalConsumption) *
                        100
                      ).toFixed(1)
                    : 0
                }
                subUnit="% of L1 Total"
                icon={Activity}
                color={theme.info}
                theme={theme}
              />
              <MetricCard
                title="Zone Distribution Loss"
                value={filteredZoneData.reduce((s, i) => s + (i.loss > 0 ? i.loss : 0), 0)}
                unit="m³"
                subValue={
                  filteredZoneData.reduce((s, i) => s + (i.consumption || 0), 0) !== 0
                    ? (
                        (filteredZoneData.reduce((s, i) => s + (i.loss > 0 ? i.loss : 0), 0) /
                          filteredZoneData.reduce((s, i) => s + (i.consumption || 0), 0)) *
                        100
                      ).toFixed(1)
                    : 0
                }
                subUnit="% of Zone Bulk"
                icon={BarChart2}
                color={theme.warning}
                theme={theme}
              />
            </div>

            {/* Zone Filter Buttons - Enhanced styling */}
            <div className="mb-4 flex flex-wrap items-center gap-2.5">
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-gray-100 dark:bg-gray-800">
                <Filter size={16} className={theme.textSecondary} />
                <span className={`text-sm font-medium ${theme.textSecondary}`}>Zones:</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {(waterData[selectedYear]?.zoneBulk || []).map((zone, index) => (
                  <FilterButton
                    key={zone.zone}
                    label={zone.zone}
                    active={visibleZones[zone.zone] ?? false}
                    color={theme.zoneColors[index % theme.zoneColors.length]}
                    onClick={() => handleZoneVisibilityToggle(zone.zone)}
                    theme={theme}
                  />
                ))}
              </div>
            </div>

            {/* Zone Charts Row - Enhanced styling */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className={`${theme.panelBg} rounded-lg p-4 border ${theme.border} overflow-hidden`}>
                <h3 className={`text-lg font-medium mb-4 ${theme.text}`}>Zone Consumption Distribution</h3>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart margin={{ top: 10, right: 10, left: 10, bottom: 10 }}>
                      <defs>
                        {filteredZoneData
                          .filter((z) => visibleZones[z.zone])
                          .map((entry, index) => {
                            const originalIndex =
                              waterData[selectedYear]?.zoneBulk?.findIndex((z) => z.zone === entry.zone) ?? index
                            return (
                              <linearGradient
                                key={`grad-${entry.zone}`}
                                id={`grad-${entry.zone}`}
                                x1="0"
                                y1="0"
                                x2="0"
                                y2="1"
                              >
                                <stop
                                  offset="0%"
                                  stopColor={theme.zoneColors[originalIndex % theme.zoneColors.length]}
                                  stopOpacity={1}
                                />
                                <stop
                                  offset="100%"
                                  stopColor={theme.zoneColors[originalIndex % theme.zoneColors.length]}
                                  stopOpacity={0.7}
                                />
                              </linearGradient>
                            )
                          })}
                      </defs>
                      <Pie
                        data={filteredZoneData.filter((z) => visibleZones[z.zone])}
                        cx="50%"
                        cy="50%"
                        innerRadius={80}
                        outerRadius={120}
                        paddingAngle={4}
                        dataKey="consumption"
                        nameKey="zone"
                        activeIndex={activeIndex}
                        activeShape={(props) => renderActiveShape({ ...props, theme })}
                        onMouseEnter={onPieEnter}
                      >
                        {filteredZoneData
                          .filter((z) => visibleZones[z.zone])
                          .map((entry, index) => {
                            const originalIndex =
                              waterData[selectedYear]?.zoneBulk?.findIndex((z) => z.zone === entry.zone) ?? index
                            return (
                              <Cell
                                key={`cell-${index}`}
                                fill={theme.zoneColors[originalIndex % theme.zoneColors.length]}
                                stroke={theme.cardBg}
                                strokeWidth={2}
                              />
                            )
                          })}
                      </Pie>
                      <Tooltip content={(props) => <CustomTooltip {...props} theme={theme} />} />
                      <Legend
                        verticalAlign="bottom"
                        height={36}
                        wrapperStyle={{ fontSize: "12px", color: theme.text, paddingTop: "10px" }}
                        iconSize={10}
                        iconType="circle"
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div className={`${theme.panelBg} rounded-lg p-4 border ${theme.border} overflow-hidden`}>
                <h3 className={`text-lg font-medium mb-4 ${theme.text}`}>Zone Consumption Trends</h3>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={zoneComparisonData} margin={{ top: 10, right: 10, left: 10, bottom: 10 }}>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke={darkMode ? "#4b5563" : theme.chartColors.bgGrid}
                        strokeOpacity={0.4}
                      />
                      <XAxis
                        dataKey="month"
                        tick={{
                          fill: darkMode ? "#f1f5f9" : theme.text,
                          fontSize: 12,
                          fontWeight: darkMode ? "500" : "normal",
                        }}
                        axisLine={{ stroke: darkMode ? "#64748b" : theme.border }}
                        tickLine={{ stroke: darkMode ? "#64748b" : theme.border }}
                      />
                      <YAxis
                        tick={{
                          fill: darkMode ? "#f1f5f9" : theme.text,
                          fontSize: 12,
                          fontWeight: darkMode ? "500" : "normal",
                        }}
                        axisLine={{ stroke: darkMode ? "#64748b" : theme.border }}
                        tickLine={{ stroke: darkMode ? "#64748b" : theme.border }}
                      />
                      <Tooltip content={(props) => <CustomTooltip {...props} theme={theme} />} />
                      <Legend
                        wrapperStyle={{ color: theme.text, fontSize: "12px", paddingTop: "10px" }}
                        iconSize={10}
                        iconType="circle"
                      />
                      {Object.keys(visibleZones)
                        .filter((zone) => visibleZones[zone])
                        .map((zone) => {
                          const zoneIndex = waterData[selectedYear]?.zoneBulk?.findIndex((z) => z.zone === zone) ?? 0
                          const color = theme.zoneColors[zoneIndex % theme.zoneColors.length]
                          return (
                            <Line
                              key={zone}
                              isAnimationActive={true}
                              type="monotone"
                              dataKey={zone}
                              name={zone}
                              stroke={color}
                              strokeWidth={3}
                              fill={color}
                              dot={{ r: 4, strokeWidth: 2, fill: theme.cardBg }}
                              activeDot={{ r: 6, strokeWidth: 0, fill: color }}
                            />
                          )
                        })}
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Zone Loss Comparison Charts - Enhanced styling */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className={`${theme.panelBg} rounded-lg p-4 border ${theme.border} overflow-hidden`}>
                <h3 className={`text-lg font-medium mb-4 ${theme.text}`}>Zone Loss Comparison (Volume)</h3>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={filteredZoneData.filter((z) => visibleZones[z.zone])}
                      layout="vertical"
                      margin={{ top: 10, right: 10, left: 80, bottom: 10 }}
                      barCategoryGap="20%"
                    >
                      <defs>
                        <linearGradient id="consumptionGradient" x1="0" y1="0" x2="1" y2="0">
                          <stop offset="0%" stopColor={theme.chartColors.l2Color} stopOpacity={0.7} />
                          <stop offset="100%" stopColor={theme.chartColors.l2Color} stopOpacity={1} />
                        </linearGradient>
                        <linearGradient id="positiveLossGradient" x1="0" y1="0" x2="1" y2="0">
                          <stop offset="0%" stopColor={theme.chartColors.lossColor} stopOpacity={0.7} />
                          <stop offset="100%" stopColor={theme.chartColors.lossColor} stopOpacity={1} />
                        </linearGradient>
                        <linearGradient id="negativeLossGradient" x1="0" y1="0" x2="1" y2="0">
                          <stop offset="0%" stopColor={theme.info} stopOpacity={0.7} />
                          <stop offset="100%" stopColor={theme.info} stopOpacity={1} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke={theme.chartColors.bgGrid} strokeOpacity={0.3} />
                      <XAxis
                        type="number"
                        tick={{ fill: theme.text, fontSize: 12 }}
                        axisLine={{ stroke: theme.border }}
                        tickLine={{ stroke: theme.border }}
                      />
                      <YAxis
                        type="category"
                        dataKey="zone"
                        tick={{ fill: theme.text, fontSize: 12, width: 75 }}
                        width={80}
                        axisLine={{ stroke: theme.border }}
                        tickLine={{ stroke: theme.border }}
                      />
                      <Tooltip content={(props) => <CustomTooltip {...props} theme={theme} />} />
                      <Legend
                        wrapperStyle={{ color: theme.text, fontSize: "12px", paddingTop: "10px" }}
                        iconSize={10}
                        iconType="circle"
                      />
                      <Bar
                        dataKey="consumption"
                        name="Consumption"
                        fill={theme.chartColors.l2Color}
                        stackId="a"
                        radius={[0, 4, 4, 0]}
                        barSize={24}
                      />
                      <Bar
                        dataKey={(row) => (row.loss > 0 ? row.loss : 0)}
                        name="Positive Loss"
                        fill={theme.chartColors.lossColor}
                        stackId="a"
                        radius={[0, 4, 4, 0]}
                        barSize={24}
                      />
                      <Bar
                        dataKey={(row) => (row.loss < 0 ? Math.abs(row.loss) : 0)}
                        name="Negative Loss (Gain)"
                        fill={theme.info}
                        stackId="b"
                        radius={[0, 4, 4, 0]}
                        barSize={24}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div className={`${theme.panelBg} rounded-lg p-4 border ${theme.border} overflow-hidden`}>
                <h3 className={`text-lg font-medium mb-4 ${theme.text}`}>Zone Loss Percentage</h3>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={filteredZoneData.filter((z) => visibleZones[z.zone] && z.lossPercentage > 0)}
                      margin={{ top: 10, right: 10, left: 10, bottom: 10 }}
                    >
                      <defs>
                        {filteredZoneData
                          .filter((z) => visibleZones[z.zone] && z.lossPercentage > 0)
                          .map((entry, index) => {
                            const nv = Number(entry.lossPercentage)
                            const fc = isNaN(nv)
                              ? theme.secondary
                              : nv > 50
                                ? theme.danger
                                : nv > 20
                                  ? theme.warning
                                  : theme.success
                            return (
                              <linearGradient
                                key={`grad-percent-${index}`}
                                id={`grad-percent-${index}`}
                                x1="0"
                                y1="0"
                                x2="0"
                                y2="1"
                              >
                                <stop offset="0%" stopColor={fc} stopOpacity={1} />
                                <stop offset="100%" stopColor={fc} stopOpacity={0.7} />
                              </linearGradient>
                            )
                          })}
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke={theme.chartColors.bgGrid} strokeOpacity={0.3} />
                      <XAxis
                        dataKey="zone"
                        tick={{ fill: theme.text, fontSize: 12 }}
                        axisLine={{ stroke: theme.border }}
                        tickLine={{ stroke: theme.border }}
                      />
                      <YAxis
                        unit="%"
                        tick={{ fill: theme.text, fontSize: 12 }}
                        axisLine={{ stroke: theme.border }}
                        tickLine={{ stroke: theme.border }}
                      />
                      <Tooltip
                        formatter={(value) => `${Number(value).toFixed(1)}%`}
                        content={(props) => <CustomTooltip {...props} theme={theme} />}
                      />
                      <Bar
                        dataKey="lossPercentage"
                        name="Loss %"
                        barSize={30}
                        radius={[4, 4, 0, 0]}
                        animationDuration={1000}
                      >
                        {filteredZoneData
                          .filter((z) => visibleZones[z.zone] && z.lossPercentage > 0)
                          .map((entry, index) => {
                            const nv = Number(entry.lossPercentage)
                            const fc = isNaN(nv)
                              ? theme.secondary
                              : nv > 50
                                ? theme.danger
                                : nv > 20
                                  ? theme.warning
                                  : theme.success
                            return <Cell key={`cell-${index}`} fill={fc} />
                          })}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Zone Details Table - Enhanced styling */}
            <div className={`${theme.panelBg} rounded-lg p-0 border ${theme.border} overflow-hidden`}>
              <h3 className={`text-lg font-medium p-4 mb-0 ${theme.text}`}>Zone Details</h3>
              <DataTable data={filteredZoneData} columns={zoneColumns} theme={theme} />
            </div>
          </div>
        )}

        {/* Consumption Types Tab */}
        {selectedTab === "types" && (
          <div className="space-y-6">
            {/* Metrics Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {["Retail", "Residential (Villas)", "IRR_Services", "Loss"].map((typeName, index) => {
                const typeData = filteredConsumptionByType.find((t) => t.type === typeName)
                const color =
                  typeName === "Loss" ? theme.chartColors.lossColor : theme.typeColors[index % theme.typeColors.length]
                return (
                  <MetricCard
                    key={typeName}
                    title={typeName}
                    value={typeData?.value || 0}
                    unit="m³"
                    subValue={typeData?.percentage || 0}
                    subUnit="% of L1"
                    icon={typeName === "Loss" ? BarChart2 : Activity}
                    color={color}
                    theme={theme}
                  />
                )
              })}
            </div>

            {/* Pricing Info - Enhanced styling */}
            <div className="flex flex-col md:flex-row gap-6">
              <div className={`${theme.panelBg} rounded-lg p-5 border ${theme.border} flex-1 overflow-hidden`}>
                <h3 className={`text-lg font-medium mb-3 ${theme.text}`}>Water Pricing Information</h3>
                <div className={`text-sm ${theme.textSecondary} space-y-2`}>
                  <div className="flex justify-between items-center p-2 rounded bg-gray-50 dark:bg-gray-800">
                    <span>Water rate:</span>
                    <span className="font-semibold">{summaryData.waterRate.toFixed(2)} OMR / m³</span>
                  </div>
                  <div className="flex justify-between items-center p-2 rounded bg-gray-50 dark:bg-gray-800">
                    <span>
                      Total payable consumption ({selectedMonth} {selectedYear}):
                    </span>
                    <span className="font-semibold">{formatNumber(summaryData.payableConsumption)} m³</span>
                  </div>
                  <div className="flex justify-between items-center p-2 rounded bg-gray-50 dark:bg-gray-800">
                    <span>
                      Estimated payable cost ({selectedMonth} {selectedYear}):
                    </span>
                    <span className="font-semibold">{formatNumber(summaryData.payableCost, 2)} OMR</span>
                  </div>
                </div>
              </div>
              <div className={`${theme.panelBg} rounded-lg p-5 border ${theme.border} flex-1 overflow-hidden`}>
                <h3 className={`text-lg font-medium mb-3 ${theme.text}`}>Payable Categories ({selectedYear})</h3>
                <div className="overflow-x-auto text-sm">
                  {waterData[selectedYear]?.payable ? (
                    <table className={`min-w-full ${theme.text}`}>
                      <thead className={`border-b ${theme.border}`}>
                        <tr className="bg-gray-50 dark:bg-gray-800">
                          <th className={`text-left py-2 px-3 font-medium ${theme.textSecondary} rounded-l`}>
                            Category
                          </th>
                          <th className={`text-right py-2 px-3 font-medium ${theme.textSecondary}`}>
                            Consumption (m³)
                          </th>
                          <th className={`text-right py-2 px-3 font-medium ${theme.textSecondary} rounded-r`}>
                            Cost (OMR)
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {Object.entries(waterData[selectedYear].payable).map(([category, data], index) => {
                          if (typeof data === "object" && data !== null && "consumption" in data && "cost" in data) {
                            return (
                              <tr key={category} className={index % 2 === 0 ? "" : "bg-gray-50 dark:bg-gray-800"}>
                                <td className="py-2 px-3">{category}</td>
                                <td className="text-right py-2 px-3">{formatNumber(data.consumption)}</td>
                                <td className="text-right py-2 px-3">{formatNumber(data.cost, 2)}</td>
                              </tr>
                            )
                          }
                          return null
                        })}
                      </tbody>
                    </table>
                  ) : (
                    <p className={theme.textSecondary}>Payable data not available for {selectedYear}.</p>
                  )}
                </div>
              </div>
            </div>

            {/* Donut Chart - Enhanced styling */}
            <div className={`${theme.panelBg} rounded-lg p-4 border ${theme.border} overflow-hidden`}>
              <h3 className={`text-lg font-medium mb-4 ${theme.text}`}>Consumption by Type</h3>
              <div className="h-96">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart margin={{ top: 10, right: 10, left: 10, bottom: 10 }}>
                    <defs>
                      {filteredConsumptionByType.map((entry, index) => {
                        const color =
                          entry.type === "Loss"
                            ? theme.chartColors.lossColor
                            : theme.typeColors[index % theme.typeColors.length]
                        return (
                          <linearGradient
                            key={`grad-type-${index}`}
                            id={`grad-type-${entry.type}`}
                            x1="0"
                            y1="0"
                            x2="0"
                            y2="1"
                          >
                            <stop offset="0%" stopColor={color} stopOpacity={1} />
                            <stop offset="100%" stopColor={color} stopOpacity={0.8} />
                          </linearGradient>
                        )
                      })}
                    </defs>
                    <Pie
                      data={filteredConsumptionByType}
                      cx="50%"
                      cy="50%"
                      innerRadius={80}
                      outerRadius={120}
                      paddingAngle={4}
                      dataKey="value"
                      nameKey="type"
                      activeIndex={activeIndex}
                      activeShape={(props) => renderActiveShape({ ...props, theme })}
                      onMouseEnter={onPieEnter}
                    >
                      {filteredConsumptionByType.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={
                            entry.type === "Loss"
                              ? theme.chartColors.lossColor
                              : theme.typeColors[index % theme.typeColors.length]
                          }
                          stroke={theme.cardBg}
                          strokeWidth={2}
                        />
                      ))}
                    </Pie>
                    <Tooltip content={(props) => <CustomTooltip {...props} theme={theme} />} />
                    <Legend
                      verticalAlign="bottom"
                      height={36}
                      wrapperStyle={{ fontSize: "12px", color: theme.text, paddingTop: "10px" }}
                      iconSize={10}
                      iconType="circle"
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Details Table - Enhanced styling */}
            <div className={`${theme.panelBg} rounded-lg p-0 border ${theme.border} overflow-hidden`}>
              <h3 className={`text-lg font-medium p-4 mb-0 ${theme.text}`}>Consumption Type Details</h3>
              <DataTable
                data={filteredConsumptionByType.sort((a, b) => b.value - a.value)}
                columns={[
                  { key: "type", header: "Type" },
                  { key: "value", header: "Consumption (m³)", numeric: true, decimals: 0 },
                  {
                    key: "percentage",
                    header: "% of L1",
                    numeric: true,
                    decimals: 1,
                    render: (value: any) => `${Number(value).toFixed(1)}%`,
                  },
                ]}
                theme={theme}
              />
            </div>
          </div>
        )}

        {/* Loss Analysis Tab */}
        {selectedTab === "loss" && (
          <div className="space-y-6">
            {/* Metrics Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              <MetricCard
                title="Total System Loss"
                value={summaryData.totalLoss}
                unit="m³"
                subValue={summaryData.lossPercentage}
                subUnit="% of L1"
                icon={BarChart2}
                color={theme.danger}
                theme={theme}
              />
              <MetricCard
                title="Zone Distribution Loss"
                value={filteredZoneData.reduce((s, i) => s + (i.loss > 0 ? i.loss : 0), 0)}
                unit="m³"
                subValue={
                  filteredZoneData.reduce((s, i) => s + (i.consumption || 0), 0) !== 0
                    ? (
                        (filteredZoneData.reduce((s, i) => s + (i.loss > 0 ? i.loss : 0), 0) /
                          filteredZoneData.reduce((s, i) => s + (i.consumption || 0), 0)) *
                        100
                      ).toFixed(1)
                    : 0
                }
                subUnit="% of Zone Bulk"
                icon={Activity}
                color={theme.warning}
                theme={theme}
              />
              {filteredZoneData.length > 0 && (
                <MetricCard
                  title="Highest Loss Zone"
                  value={
                    filteredZoneData.reduce((p, c) => ((p.loss || 0) > (c.loss || 0) ? p : c), {
                      loss: Number.NEGATIVE_INFINITY,
                    }).loss
                  }
                  unit="m³"
                  subValue={
                    filteredZoneData.reduce((p, c) => ((p.loss || 0) > (c.loss || 0) ? p : c), { zone: "N/A" }).zone
                  }
                  icon={BarChart2}
                  color={theme.danger}
                  theme={theme}
                />
              )}
              <MetricCard
                title="Highest Loss Month"
                value={waterData[selectedYear]?.monthly?.reduce((max, item) => Math.max(max, item.loss || 0), 0) || 0}
                unit="m³"
                subValue={
                  waterData[selectedYear]?.monthly?.reduce(
                    (maxMonth, item) => ((item.loss || 0) > (maxMonth.loss || 0) ? item : maxMonth),
                    { month: "-", loss: Number.NEGATIVE_INFINITY },
                  ).month || "-"
                }
                icon={Calendar}
                color={theme.danger}
                theme={theme}
              />
            </div>

            {/* Loss Charts Row - Enhanced styling */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className={`${theme.panelBg} rounded-lg p-4 border ${theme.border} overflow-hidden`}>
                <h3 className={`text-lg font-medium mb-4 ${theme.text}`}>Monthly Loss Trend vs L1 Supply</h3>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={filteredMonthlyData} margin={{ top: 10, right: 10, left: 10, bottom: 10 }}>
                      <defs>
                        <linearGradient id="gradientL1Loss" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={theme.primary} stopOpacity={0.7} />
                          <stop offset="95%" stopColor={theme.primary} stopOpacity={0.1} />
                        </linearGradient>
                        <linearGradient id="gradientLossBar" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor={theme.chartColors.lossColor} stopOpacity={1} />
                          <stop offset="100%" stopColor={theme.chartColors.lossColor} stopOpacity={0.7} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke={theme.chartColors.bgGrid} strokeOpacity={0.3} />
                      <XAxis
                        dataKey="month"
                        tick={{ fill: theme.text, fontSize: 12 }}
                        axisLine={{ stroke: theme.border }}
                        tickLine={{ stroke: theme.border }}
                      />
                      <YAxis
                        yAxisId="left"
                        tick={{ fill: theme.text, fontSize: 12 }}
                        axisLine={{ stroke: theme.border }}
                        tickLine={{ stroke: theme.border }}
                      />
                      <YAxis
                        yAxisId="right"
                        orientation="right"
                        tick={{ fill: theme.chartColors.lossColor, fontSize: 12 }}
                        axisLine={{ stroke: theme.border }}
                        tickLine={{ stroke: theme.border }}
                      />
                      <Tooltip content={(props) => <CustomTooltip {...props} theme={theme} />} />
                      <Legend
                        wrapperStyle={{ color: theme.text, fontSize: "12px", paddingTop: "10px" }}
                        iconSize={10}
                        iconType="circle"
                      />
                      <Area
                        yAxisId="left"
                        isAnimationActive={true}
                        type="monotone"
                        dataKey="l1"
                        stroke="none"
                        fill="url(#gradientL1Loss)"
                        name="L1 Area"
                      />
                      <Line
                        yAxisId="left"
                        isAnimationActive={true}
                        type="monotone"
                        dataKey="l1"
                        name="L1 Supply"
                        stroke={theme.primary}
                        strokeWidth={3}
                        dot={{ r: 4, strokeWidth: 2, fill: theme.cardBg }}
                        activeDot={{ r: 6, strokeWidth: 0, fill: theme.primary }}
                      />
                      <Bar
                        yAxisId="right"
                        dataKey="loss"
                        name="System Loss"
                        fill="url(#gradientLossBar)"
                        barSize={20}
                        radius={[4, 4, 0, 0]}
                        animationDuration={1000}
                      />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div className={`${theme.panelBg} rounded-lg p-4 border ${theme.border} overflow-hidden`}>
                <h3 className={`text-lg font-medium mb-4 ${theme.text}`}>Positive Loss Distribution by Zone</h3>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart margin={{ top: 10, right: 10, left: 10, bottom: 10 }}>
                      <defs>
                        {filteredZoneData
                          .filter((zone) => zone.loss > 0 && visibleZones[zone.zone])
                          .map((entry, index) => {
                            const zoneIndex =
                              waterData[selectedYear]?.zoneBulk?.findIndex((z) => z.zone === entry.zone) ?? index
                            return (
                              <linearGradient
                                key={`loss-grad-${entry.zone}`}
                                id={`loss-grad-${entry.zone}`}
                                x1="0"
                                y1="0"
                                x2="0"
                                y2="1"
                              >
                                <stop
                                  offset="0%"
                                  stopColor={theme.zoneColors[zoneIndex % theme.zoneColors.length]}
                                  stopOpacity={1}
                                />
                                <stop
                                  offset="100%"
                                  stopColor={theme.zoneColors[zoneIndex % theme.zoneColors.length]}
                                  stopOpacity={0.8}
                                />
                              </linearGradient>
                            )
                          })}
                      </defs>
                      <Pie
                        data={filteredZoneData.filter((zone) => zone.loss > 0 && visibleZones[zone.zone])}
                        cx="50%"
                        cy="50%"
                        innerRadius={80}
                        outerRadius={120}
                        paddingAngle={4}
                        dataKey="loss"
                        nameKey="zone"
                        activeIndex={activeIndex}
                        activeShape={(props) => renderActiveShape({ ...props, theme })}
                        onMouseEnter={onPieEnter}
                      >
                        {filteredZoneData
                          .filter((zone) => zone.loss > 0 && visibleZones[zone.zone])
                          .map((entry, index) => {
                            const zoneIndex =
                              waterData[selectedYear]?.zoneBulk?.findIndex((z) => z.zone === entry.zone) ?? index
                            return (
                              <Cell
                                key={`cell-${index}`}
                                fill={theme.zoneColors[zoneIndex % theme.zoneColors.length]}
                                stroke={theme.cardBg}
                                strokeWidth={2}
                              />
                            )
                          })}
                      </Pie>
                      <Tooltip content={(props) => <CustomTooltip {...props} theme={theme} />} />
                      <Legend
                        verticalAlign="bottom"
                        height={36}
                        wrapperStyle={{ fontSize: "12px", color: theme.text, paddingTop: "10px" }}
                        iconSize={10}
                        iconType="circle"
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Financial Impact Section - Enhanced styling */}
            <div className={`${theme.panelBg} rounded-lg p-5 border ${theme.border} overflow-hidden`}>
              <h3 className={`text-lg font-medium mb-4 ${theme.text}`}>Financial Impact of Water Losses</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div
                  className={`p-5 rounded-lg border ${theme.border} ${theme.cardBg} hover:shadow-md transition-shadow duration-300`}
                >
                  <h4 className={`text-md font-medium ${theme.text}`}>Total Loss Value</h4>
                  <p className="text-2xl font-bold text-red-500 mt-2">
                    {formatNumber(Math.abs(summaryData.totalLoss) * summaryData.waterRate, 2)} OMR
                  </p>
                  <p className={`mt-2 text-xs ${theme.textSecondary}`}>
                    Based on {formatNumber(Math.abs(summaryData.totalLoss))} m³ at {summaryData.waterRate.toFixed(2)}{" "}
                    OMR/m³
                  </p>
                </div>
                <div
                  className={`p-5 rounded-lg border ${theme.border} ${theme.cardBg} hover:shadow-md transition-shadow duration-300`}
                >
                  <h4 className={`text-md font-medium ${theme.text}`}>Zone Distribution Loss Value</h4>
                  <p className="text-2xl font-bold text-orange-500 mt-2">
                    {formatNumber(
                      filteredZoneData.reduce((s, i) => s + (i.loss > 0 ? i.loss : 0), 0) * summaryData.waterRate,
                      2,
                    )}{" "}
                    OMR
                  </p>
                  <p className={`mt-2 text-xs ${theme.textSecondary}`}>
                    {formatNumber(filteredZoneData.reduce((s, i) => s + (i.loss > 0 ? i.loss : 0), 0))} m³ at{" "}
                    {summaryData.waterRate.toFixed(2)} OMR/m³
                  </p>
                </div>
                <div
                  className={`p-5 rounded-lg border ${theme.border} ${theme.cardBg} hover:shadow-md transition-shadow duration-300`}
                >
                  <h4 className={`text-md font-medium ${theme.text}`}>Potential Annual Savings</h4>
                  <p className="text-2xl font-bold text-green-500 mt-2">
                    {formatNumber(
                      Math.abs(waterData[selectedYear]?.summary?.totalLoss || 0) * summaryData.waterRate * 0.5,
                      2,
                    )}{" "}
                    OMR
                  </p>
                  <p className={`mt-2 text-xs ${theme.textSecondary}`}>If annual losses reduced by 50%</p>
                </div>
              </div>
            </div>

            {/* Measurement Anomalies Table - Enhanced styling */}
            <div className={`${theme.panelBg} rounded-lg p-0 border ${theme.border} overflow-hidden`}>
              <h3 className={`text-lg font-medium p-4 mb-0 ${theme.text}`}>Measurement Anomalies (Negative Loss)</h3>
              <DataTable
                data={filteredMonthlyData.filter((item) => item.loss < 0)}
                columns={[
                  { key: "month", header: "Month" },
                  { key: "l1", header: "L1 (m³)", numeric: true, decimals: 0 },
                  { key: "l2dc", header: "L2+DC (m³)", numeric: true, decimals: 0 },
                  { key: "l3dc", header: "L3+DC (m³)", numeric: true, decimals: 0 },
                  {
                    key: "loss",
                    header: "Negative Loss (Gain) (m³)",
                    numeric: true,
                    decimals: 0,
                    render: (value: any) => <span className="text-blue-500 font-medium">{formatNumber(value)}</span>,
                  },
                ]}
                theme={theme}
              />
              {filteredMonthlyData.filter((item) => item.loss < 0).length === 0 && (
                <div className={`text-center ${theme.textSecondary} py-4 text-sm`}>
                  No measurement anomalies (negative loss) detected for the selected period.
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Footer Section - Enhanced styling */}
      <div
        className={`rounded-lg ${theme.shadow} p-4 md:p-5 mt-6 transition-colors duration-300`}
        style={{ backgroundColor: theme.primaryDark }}
      >
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="text-xs text-white/80">
            Data source: Muscat Bay Water Management System (Sample Data) | Rate: {summaryData.waterRate.toFixed(2)}{" "}
            OMR/m³
          </div>
          <div className="flex gap-2.5">
            <button
              onClick={handleRefreshClick}
              className="flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-md text-sm font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-white/50 bg-white/10 hover:bg-white/20 text-white"
            >
              <RefreshCw size={16} />
              <span>Refresh Data</span>
            </button>
            <button
              onClick={handleSearchClick}
              className="flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-md text-sm font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-white/50 bg-white/10 hover:bg-white/20 text-white"
            >
              <Search size={16} />
              <span>Advanced Search</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
