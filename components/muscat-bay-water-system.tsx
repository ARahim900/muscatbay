"use client"

import { useState } from "react"
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts"
import {
  ArrowDownRight,
  Download,
  RefreshCw,
  Droplet,
  Activity,
  Layers,
  Percent,
  MapPin,
  Type,
  Settings,
} from "lucide-react"

// Main Dashboard Component
const MuscatBayWaterSystem = () => {
  // Theme Colors
  const THEME = {
    primary: "#4E4456", // Dark purple-grey
    secondary: "#A5A0AB", // Lighter grey
    accent: "#9AD0D2", // Light teal/cyan
    light: "#E4E2E7", // Very light grey
    white: "#FFFFFF", // White
    darkText: "#383339", // Dark text
    lightText: "#7A737F", // Light text
    success: "#7CBBA7", // Green (good)
    warning: "#D8BC74", // Yellow (warning)
    error: "#C48B9F", // Red (error)
    chartColors: ["#9AD0D2", "#A5A0AB", "#C48B9F", "#D8BC74", "#7CBBA7", "#B8A9C6"],
  }

  // State
  const [activeTab, setActiveTab] = useState("dashboard")
  const [selectedPeriod, setSelectedPeriod] = useState("Mar-25")
  const [selectedZone, setSelectedZone] = useState("Zone_03_(A)")
  const [selectedType, setSelectedType] = useState("All Types")
  const [isLoading, setIsLoading] = useState(false)

  // Real data from the database for 2025 (Jan-Mar)
  const waterData = {
    meters: [
      {
        meterLabel: "Z5-17",
        acctNum: "4300001",
        zone: "Zone_05",
        type: "Residential (Villa)",
        parentMeter: "ZONE 5 (Bulk Zone 5)",
        label: "L3",
        "Jan-25": 112,
        "Feb-25": 80,
        "Mar-25": 81,
      },
      {
        meterLabel: "Z3-42 (Villa)",
        acctNum: "4300002",
        zone: "Zone_03_(A)",
        type: "Residential (Villa)",
        parentMeter: "ZONE 3A (BULK ZONE 3A)",
        label: "L3",
        "Jan-25": 32,
        "Feb-25": 46,
        "Mar-25": 19,
      },
      {
        meterLabel: "Z3-46(5) (Building)",
        acctNum: "4300003",
        zone: "Zone_03_(A)",
        type: "Residential (Apart)",
        parentMeter: "D-46 Building Bulk Meter",
        label: "L3",
        "Jan-25": 5,
        "Feb-25": 0,
        "Mar-25": 0,
      },
      {
        meterLabel: "Z3-49(3) (Building)",
        acctNum: "4300004",
        zone: "Zone_03_(A)",
        type: "Residential (Apart)",
        parentMeter: "D-49 Building Bulk Meter",
        label: "L3",
        "Jan-25": 10,
        "Feb-25": 15,
        "Mar-25": 11,
      },
      // ... more meters would be here in a real implementation
      {
        meterLabel: "ZONE 8 (Bulk Zone 8)",
        acctNum: "4300342",
        zone: "Zone_08",
        type: "Zone Bulk",
        parentMeter: "Main Bulk (NAMA)",
        label: "L2",
        "Jan-25": 1547,
        "Feb-25": 1498,
        "Mar-25": 2605,
      },
      {
        meterLabel: "ZONE 3A (Bulk Zone 3A)",
        acctNum: "4300343",
        zone: "Zone_03_(A)",
        type: "Zone Bulk",
        parentMeter: "Main Bulk (NAMA)",
        label: "L2",
        "Jan-25": 4235,
        "Feb-25": 4273,
        "Mar-25": 3591,
      },
      {
        meterLabel: "ZONE 3B (Bulk Zone 3B)",
        acctNum: "4300344",
        zone: "Zone_03_(B)",
        type: "Zone Bulk",
        parentMeter: "Main Bulk (NAMA)",
        label: "L2",
        "Jan-25": 3256,
        "Feb-25": 2962,
        "Mar-25": 3331,
      },
      {
        meterLabel: "ZONE 5 (Bulk Zone 5)",
        acctNum: "4300345",
        zone: "Zone_05",
        type: "Zone Bulk",
        parentMeter: "Main Bulk (NAMA)",
        label: "L2",
        "Jan-25": 4267,
        "Feb-25": 4231,
        "Mar-25": 3862,
      },
      {
        meterLabel: "ZONE FM ( BULK ZONE FM )",
        acctNum: "4300346",
        zone: "Zone_01_(FM)",
        type: "Zone Bulk",
        parentMeter: "Main Bulk (NAMA)",
        label: "L2",
        "Jan-25": 2008,
        "Feb-25": 1740,
        "Mar-25": 1880,
      },
      {
        meterLabel: "Al Adrak Construction",
        acctNum: "4300347",
        zone: "Direct Connection",
        type: "Retail",
        parentMeter: "Main Bulk (NAMA)",
        label: "DC",
        "Jan-25": 597,
        "Feb-25": 520,
        "Mar-25": 580,
      },
      {
        meterLabel: "Al Adrak Camp",
        acctNum: "4300348",
        zone: "Direct Connection",
        type: "Retail",
        parentMeter: "Main Bulk (NAMA)",
        label: "DC",
        "Jan-25": 1038,
        "Feb-25": 702,
        "Mar-25": 1161,
      },
      {
        meterLabel: "Main Bulk (NAMA)",
        acctNum: "C43659",
        zone: "Main Bulk",
        type: "Main BULK",
        parentMeter: "NAMA",
        label: "L1",
        "Jan-25": 32580,
        "Feb-25": 44043,
        "Mar-25": 34915,
      },
      {
        meterLabel: "Hotel Main Building",
        acctNum: "4300334",
        zone: "Direct Connection",
        type: "Retail",
        parentMeter: "Main Bulk (NAMA)",
        label: "DC",
        "Jan-25": 18048,
        "Feb-25": 19482,
        "Mar-25": 22151,
      },
      {
        meterLabel: "Community Mgmt - Technical Zone, STP",
        acctNum: "4300336",
        zone: "Direct Connection",
        type: "MB_Common",
        parentMeter: "Main Bulk (NAMA)",
        label: "DC",
        "Jan-25": 29,
        "Feb-25": 37,
        "Mar-25": 25,
      },
      {
        meterLabel: "PHASE 02, MAIN ENTRANCE (Infrastructure)",
        acctNum: "4300338",
        zone: "Direct Connection",
        type: "MB_Common",
        parentMeter: "Main Bulk (NAMA)",
        label: "DC",
        "Jan-25": 11,
        "Feb-25": 8,
        "Mar-25": 6,
      },
      {
        meterLabel: "Irrigation- Controller DOWN",
        acctNum: "4300341",
        zone: "Direct Connection",
        type: "IRR_Servies",
        parentMeter: "Main Bulk (NAMA)",
        label: "DC",
        "Jan-25": 159,
        "Feb-25": 239,
        "Mar-25": 283,
      },
    ],
  }

  // Process data for the selected period
  const processData = () => {
    const period = selectedPeriod

    // Find L1 meter (main bulk)
    const l1Meter = waterData.meters.find((m) => m.label === "L1")
    const l1Supply = l1Meter ? l1Meter[period] : 0

    // Get all L2 meters (zone bulk meters)
    const l2Meters = waterData.meters.filter((m) => m.label === "L2")
    const l2Volume = l2Meters.reduce((sum, meter) => sum + (meter[period] || 0), 0)

    // Get all DC meters connected directly to L1
    const dcMeters = waterData.meters.filter((m) => m.label === "DC")
    const dcVolume = dcMeters.reduce((sum, meter) => sum + (meter[period] || 0), 0)

    // Get all L3 meters (end user meters)
    const l3Meters = waterData.meters.filter((m) => m.label === "L3")
    const l3Volume = l3Meters.reduce((sum, meter) => sum + (meter[period] || 0), 0)

    // Calculate losses
    const stage1Loss = l1Supply - (l2Volume + dcVolume)
    const stage2Loss = l2Volume - l3Volume
    const totalLoss = l1Supply - (l3Volume + dcVolume)

    // Calculate loss percentages
    const stage1LossPercentage = l1Supply > 0 ? (stage1Loss / l1Supply) * 100 : 0
    const stage2LossPercentage = l2Volume > 0 ? (stage2Loss / l2Volume) * 100 : 0
    const totalLossPercentage = l1Supply > 0 ? (totalLoss / l1Supply) * 100 : 0

    // Process zone data
    const zoneMetrics = {}
    l2Meters.forEach((zoneMeter) => {
      const zoneName = zoneMeter.zone
      const l2Reading = zoneMeter[period] || 0

      // Get L3 meters for this zone
      const zoneL3Meters = l3Meters.filter((m) => m.zone === zoneName)
      const l3Sum = zoneL3Meters.reduce((sum, meter) => sum + (meter[period] || 0), 0)

      // Calculate loss
      const loss = l2Reading - l3Sum
      const lossPercentage = l2Reading > 0 ? (loss / l2Reading) * 100 : 0

      zoneMetrics[zoneName] = {
        l2Bulk: l2Reading,
        l3Sum,
        loss,
        lossPercentage,
      }
    })

    // Process consumption by type
    const consumptionByType = {}
    l3Meters.forEach((meter) => {
      const type = meter.type
      if (!consumptionByType[type]) {
        consumptionByType[type] = 0
      }
      consumptionByType[type] += meter[period] || 0
    })

    // Add DC meters to consumption by type
    dcMeters.forEach((meter) => {
      const type = meter.type
      if (!consumptionByType[type]) {
        consumptionByType[type] = 0
      }
      consumptionByType[type] += meter[period] || 0
    })

    // Create top losing zones data
    const topLosingZones = Object.entries(zoneMetrics)
      .map(([name, data]) => ({
        name: name.replace("Zone_", "").replace(/_/g, " "),
        lossPercentage: data.lossPercentage,
      }))
      .sort((a, b) => b.lossPercentage - a.lossPercentage)
      .slice(0, 5)

    return {
      totalL1Supply: l1Supply,
      totalL2Volume: l2Volume,
      totalL3Volume: l3Volume + dcVolume, // Include DC meters in L3 volume for consumption
      stage1Loss,
      stage1LossPercentage,
      stage2Loss,
      stage2LossPercentage,
      totalLoss,
      totalLossPercentage,
      consumptionByType,
      zoneMetrics,
      topLosingZones,
    }
  }

  // Get metrics for the selected period
  const metrics = processData()

  // Helper functions
  const formatNumber = (num) => (isNaN(num) ? "0" : Math.round(num).toLocaleString())
  const formatPercentage = (value, decimals = 1) => {
    if (isNaN(value)) return "0.0%"
    const factor = Math.pow(10, decimals)
    const roundedValue = Math.round(value * factor) / factor
    return `${roundedValue.toFixed(decimals)}%`
  }
  const getLossStatusColor = (lossPercentage) => {
    if (isNaN(lossPercentage)) return THEME.secondary
    if (lossPercentage > 20) return THEME.error
    if (lossPercentage > 10) return THEME.warning
    if (lossPercentage >= 0) return THEME.success
    return THEME.accent
  }

  // Fixed description text getter - using proper JSX escaping
  const getLossStatusText = (lossPercentage) => {
    if (isNaN(lossPercentage)) return "Unknown"
    if (lossPercentage > 20) return "High Loss"
    if (lossPercentage > 10) return "Medium Loss"
    if (lossPercentage >= 0) return "Good"
    return "Gain"
  }

  // Mock data for consumption by zone
  const getConsumptionByZoneData = () => {
    return Object.entries(metrics.zoneMetrics).map(([zone, data]) => ({
      name: zone.replace("Zone_", "").replace(/_/g, " "),
      value: data.l3Sum,
    }))
  }

  // Get zone meters for the selected zone
  const getZoneMeters = () => {
    return waterData.meters
      .filter((meter) => meter.zone === selectedZone && meter.label === "L3" && meter[selectedPeriod] > 0)
      .slice(0, 10) // Limit to 10 meters for display
  }

  // Prepare consumption by type data
  const prepareConsumptionByTypeData = () => {
    return Object.entries(metrics.consumptionByType)
      .map(([name, value]) => ({ name, value }))
      .filter((item) => item.value > 0)
      .sort((a, b) => b.value - a.value)
  }

  // Create loss trend data for the last 3 months
  const trendData = [
    {
      period: "Jan",
      stage1LossPct: processData().stage1LossPercentage,
      stage2LossPct: processData().stage2LossPercentage,
      totalLossPct: processData().totalLossPercentage,
    },
    {
      period: "Feb",
      stage1LossPct: processData().stage1LossPercentage,
      stage2LossPct: processData().stage2LossPercentage,
      totalLossPct: processData().totalLossPercentage,
    },
    {
      period: "Mar",
      stage1LossPct: processData().stage1LossPercentage,
      stage2LossPct: processData().stage2LossPercentage,
      totalLossPct: processData().totalLossPercentage,
    },
  ]

  // Event handlers
  const handleTabChange = (tab) => setActiveTab(tab)
  const handlePeriodChange = (period) => {
    setSelectedPeriod(period)
    setIsLoading(true)
    setTimeout(() => setIsLoading(false), 800)
  }
  const handleRefresh = () => {
    setIsLoading(true)
    setTimeout(() => setIsLoading(false), 800)
  }

  return (
    <div className="min-h-screen font-sans" style={{ backgroundColor: THEME.light }}>
      {/* Header */}
      <header className="shadow sticky top-0 z-20" style={{ background: THEME.primary }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center">
            <Droplet className="h-6 w-6 mr-2" style={{ color: THEME.accent }} />
            <h1 className="text-xl md:text-2xl font-bold" style={{ color: THEME.white }}>
              Muscat Bay Water System
            </h1>
          </div>
          <div className="flex items-center space-x-3 flex-wrap gap-2">
            <select
              className="border rounded-md px-3 py-1.5 text-sm focus:outline-none"
              style={{ background: `${THEME.primary}90`, color: THEME.white, borderColor: `${THEME.accent}60` }}
              defaultValue="2025"
            >
              <option value="2025">2025</option>
              <option value="2024">2024</option>
            </select>
            <select
              className="border rounded-md px-3 py-1.5 text-sm focus:outline-none"
              style={{ background: `${THEME.primary}90`, color: THEME.white, borderColor: `${THEME.accent}60` }}
              value={selectedPeriod.split("-")[0]}
              onChange={(e) => handlePeriodChange(`${e.target.value}-25`)}
            >
              <option value="Jan">January</option>
              <option value="Feb">February</option>
              <option value="Mar">March</option>
            </select>
            <button
              className="flex items-center border rounded-md px-3 py-1.5 text-sm"
              style={{ background: `${THEME.primary}90`, color: THEME.white, borderColor: `${THEME.accent}60` }}
              onClick={handleRefresh}
            >
              <RefreshCw className={`h-4 w-4 mr-1.5 ${isLoading ? "animate-spin" : ""}`} />
              Refresh
            </button>
            <button
              className="flex items-center border rounded-md px-3 py-1.5 text-sm"
              style={{ background: `${THEME.primary}90`, color: THEME.white, borderColor: `${THEME.accent}60` }}
            >
              <Download className="h-4 w-4 mr-1.5" />
              Export
            </button>
          </div>
        </div>
      </header>

      {/* Tab Navigation */}
      <nav className="bg-white shadow sticky top-[72px] z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-6 md:space-x-8 overflow-x-auto">
            {[
              { id: "dashboard", label: "Dashboard", icon: Activity },
              { id: "zone_details", label: "Zone Details", icon: MapPin },
              { id: "type_details", label: "Type Details", icon: Type },
              { id: "loss_details", label: "Loss Details", icon: Percent },
              { id: "settings", label: "Settings", icon: Settings },
            ].map((tab) => (
              <button
                key={tab.id}
                className={`flex items-center gap-2 py-3 md:py-4 px-1 whitespace-nowrap text-sm font-medium border-b-2 transition-colors duration-150`}
                style={{
                  borderColor: activeTab === tab.id ? THEME.accent : "transparent",
                  color: activeTab === tab.id ? THEME.primary : THEME.lightText,
                }}
                onClick={() => handleTabChange(tab.id)}
              >
                <tab.icon className="h-4 w-4" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Dashboard Tab */}
        {activeTab === "dashboard" && (
          <div className="space-y-6">
            <h2 className="text-2xl font-semibold" style={{ color: THEME.darkText }}>
              Dashboard Overview - {selectedPeriod}
            </h2>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-5">
              <KPICard
                title="Total L1 Supply"
                value={`${formatNumber(metrics.totalL1Supply)} m³`}
                description="Main Source Input"
                icon={Layers}
                theme={THEME}
                bgColor={THEME.primary}
              />
              <KPICard
                title="Total L3 Consumption"
                value={`${formatNumber(metrics.totalL3Volume)} m³`}
                description="End User + DC"
                icon={Droplet}
                theme={THEME}
                bgColor={THEME.secondary}
              />
              <KPICard
                title="Total Loss (NRW)"
                value={`${formatPercentage(metrics.totalLossPercentage)}`}
                description={`${formatNumber(metrics.totalLoss)} m³ of L1`}
                icon={Percent}
                theme={THEME}
                bgColor={getLossStatusColor(metrics.totalLossPercentage)}
              />
              <KPICard
                title="Stage 1 Loss"
                value={`${formatPercentage(metrics.stage1LossPercentage)}`}
                description={`${formatNumber(metrics.stage1Loss)} m³ (Trunk)`}
                icon={ArrowDownRight}
                theme={THEME}
                bgColor={getLossStatusColor(metrics.stage1LossPercentage)}
              />
              <KPICard
                title="Stage 2 Loss"
                value={`${formatPercentage(metrics.stage2LossPercentage)}`}
                description={`${formatNumber(metrics.stage2Loss)} m³ (Distrib.)`}
                icon={ArrowDownRight}
                theme={THEME}
                bgColor={getLossStatusColor(metrics.stage2LossPercentage)}
              />
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* L3 Consumption by Type */}
              <div className="bg-white rounded-lg shadow-md p-6 transition-shadow hover:shadow-lg">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2" style={{ color: THEME.darkText }}>
                  <Type className="h-5 w-5" style={{ color: THEME.accent }} />
                  L3 Consumption by Type
                </h3>
                <div style={{ width: "100%", height: 300 }}>
                  <ResponsiveContainer>
                    <PieChart>
                      <Pie
                        data={prepareConsumptionByTypeData()}
                        cx="50%"
                        cy="50%"
                        outerRadius={110}
                        innerRadius={60}
                        dataKey="value"
                        nameKey="name"
                        paddingAngle={2}
                        labelLine={false}
                        label={({ name, percent }) =>
                          percent > 0.05 ? `${name}: ${formatPercentage(percent * 100, 0)}` : ""
                        }
                      >
                        {prepareConsumptionByTypeData().map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={THEME.chartColors[index % THEME.chartColors.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value, name) => [
                          `${formatNumber(value)} m³ (${formatPercentage((value / metrics.totalL3Volume) * 100)})`,
                          name,
                        ]}
                      />
                      <Legend iconSize={10} wrapperStyle={{ fontSize: "12px", paddingTop: "15px" }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Top 5 Losing Zones */}
              <div className="bg-white rounded-lg shadow-md p-6 transition-shadow hover:shadow-lg">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2" style={{ color: THEME.darkText }}>
                  <MapPin className="h-5 w-5" style={{ color: THEME.error }} />
                  Top 5 Losing Zones (Internal %)
                </h3>
                <div style={{ width: "100%", height: 300 }}>
                  <ResponsiveContainer>
                    <BarChart
                      data={metrics.topLosingZones}
                      layout="vertical"
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={`${THEME.secondary}30`} />
                      <XAxis
                        type="number"
                        tickFormatter={(value) => `${value.toFixed(1)}%`}
                        tick={{ fill: THEME.lightText, fontSize: 12 }}
                      />
                      <YAxis dataKey="name" type="category" width={80} tick={{ fill: THEME.lightText, fontSize: 12 }} />
                      <Tooltip formatter={(value) => [`${formatPercentage(value)}`, "Internal Loss %"]} />
                      <Bar dataKey="lossPercentage" barSize={20} radius={[0, 4, 4, 0]}>
                        {metrics.topLosingZones.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={getLossStatusColor(entry.lossPercentage)} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Loss Details Tab */}
        {activeTab === "loss_details" && (
          <div className="space-y-6">
            <h2 className="text-2xl font-semibold flex items-center gap-2" style={{ color: THEME.darkText }}>
              <Percent className="h-6 w-6" /> Loss Details - {selectedPeriod}
            </h2>

            {/* Loss KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <KPICard
                title="Stage 1 Loss"
                value={`${formatPercentage(metrics.stage1LossPercentage)}`}
                description={`${formatNumber(metrics.stage1Loss)} m³ (Trunk)`}
                icon={ArrowDownRight}
                theme={THEME}
                bgColor={getLossStatusColor(metrics.stage1LossPercentage)}
              />
              <KPICard
                title="Stage 2 Loss"
                value={`${formatPercentage(metrics.stage2LossPercentage)}`}
                description={`${formatNumber(metrics.stage2Loss)} m³ (Distrib.)`}
                icon={ArrowDownRight}
                theme={THEME}
                bgColor={getLossStatusColor(metrics.stage2LossPercentage)}
              />
              <KPICard
                title="Total Loss (NRW)"
                value={`${formatPercentage(metrics.totalLossPercentage)}`}
                description={`${formatNumber(metrics.totalLoss)} m³ of L1`}
                icon={Percent}
                theme={THEME}
                bgColor={getLossStatusColor(metrics.totalLossPercentage)}
              />
            </div>

            {/* Water Loss Trends */}
            <div className="bg-white rounded-lg shadow-md p-6 transition-shadow hover:shadow-lg">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2" style={{ color: THEME.darkText }}>
                <Activity className="h-5 w-5" style={{ color: THEME.secondary }} />
                Water Loss Trends (2025)
              </h3>
              <div style={{ width: "100%", height: 300 }}>
                <ResponsiveContainer>
                  <LineChart data={trendData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={`${THEME.secondary}30`} />
                    <XAxis dataKey="period" tick={{ fill: THEME.lightText, fontSize: 12 }} />
                    <YAxis
                      tickFormatter={(value) => `${value.toFixed(0)}%`}
                      tick={{ fill: THEME.lightText, fontSize: 12 }}
                    />
                    <Tooltip formatter={(value) => [`${formatPercentage(value)}`, "Loss %"]} />
                    <Legend wrapperStyle={{ fontSize: "12px" }} />
                    <Line
                      type="monotone"
                      dataKey="stage1LossPct"
                      name="Stage 1 %"
                      stroke={THEME.warning}
                      strokeWidth={2}
                      dot={{ r: 3 }}
                      activeDot={{ r: 5 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="stage2LossPct"
                      name="Stage 2 %"
                      stroke={THEME.error}
                      strokeWidth={2}
                      dot={{ r: 3 }}
                      activeDot={{ r: 5 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="totalLossPct"
                      name="Total %"
                      stroke={THEME.primary}
                      strokeWidth={2}
                      dot={{ r: 3 }}
                      activeDot={{ r: 5 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Internal Zone Loss Comparison */}
            <div className="bg-white rounded-lg shadow-md p-6 transition-shadow hover:shadow-lg">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2" style={{ color: THEME.darkText }}>
                <MapPin className="h-5 w-5" style={{ color: THEME.secondary }} />
                Internal Zone Loss Comparison
              </h3>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Zone Loss Table */}
                <div className="overflow-x-auto max-h-96">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="sticky top-0" style={{ backgroundColor: THEME.light }}>
                      <tr>
                        <th
                          scope="col"
                          className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider"
                          style={{ color: THEME.lightText }}
                        >
                          Zone
                        </th>
                        <th
                          scope="col"
                          className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider"
                          style={{ color: THEME.lightText }}
                        >
                          L2 In
                        </th>
                        <th
                          scope="col"
                          className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider"
                          style={{ color: THEME.lightText }}
                        >
                          L3 Sum
                        </th>
                        <th
                          scope="col"
                          className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider"
                          style={{ color: THEME.lightText }}
                        >
                          Loss
                        </th>
                        <th
                          scope="col"
                          className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider"
                          style={{ color: THEME.lightText }}
                        >
                          Loss %
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {Object.entries(metrics.zoneMetrics).map(([zone, data]) => (
                        <tr key={zone} className="hover:bg-gray-50">
                          <td
                            className="px-4 py-3 whitespace-nowrap text-sm font-medium"
                            style={{ color: THEME.darkText }}
                          >
                            {zone.replace("Zone_", "").replace(/_/g, " ")}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm" style={{ color: THEME.lightText }}>
                            {formatNumber(data.l2Bulk)}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm" style={{ color: THEME.lightText }}>
                            {formatNumber(data.l3Sum)}
                          </td>
                          <td
                            className="px-4 py-3 whitespace-nowrap text-sm"
                            style={{ color: getLossStatusColor(data.lossPercentage) }}
                          >
                            {formatNumber(data.loss)}
                          </td>
                          <td
                            className="px-4 py-3 whitespace-nowrap text-sm font-semibold"
                            style={{ color: getLossStatusColor(data.lossPercentage) }}
                          >
                            {formatPercentage(data.lossPercentage)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Zone Loss Chart */}
                <div className="min-h-[300px]">
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart
                      data={Object.entries(metrics.zoneMetrics)
                        .map(([zone, data]) => ({
                          name: zone.replace("Zone_", "").replace(/_/g, " "),
                          lossPercentage: data.lossPercentage,
                        }))
                        .sort((a, b) => b.lossPercentage - a.lossPercentage)}
                      margin={{ top: 5, right: 5, left: -25, bottom: 40 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke={`${THEME.secondary}30`} />
                      <XAxis
                        dataKey="name"
                        angle={-45}
                        textAnchor="end"
                        interval={0}
                        tick={{ fill: THEME.lightText, fontSize: 10 }}
                      />
                      <YAxis
                        tickFormatter={(value) => `${value.toFixed(0)}%`}
                        tick={{ fill: THEME.lightText, fontSize: 12 }}
                      />
                      <Tooltip formatter={(value) => [`${formatPercentage(value)}`, "Internal Loss %"]} />
                      <Bar dataKey="lossPercentage" barSize={20} radius={[4, 4, 0, 0]}>
                        {Object.entries(metrics.zoneMetrics).map(([zone, data]) => (
                          <Cell key={`cell-${zone}`} fill={getLossStatusColor(data.lossPercentage)} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Settings Tab - FIXED for JSX issues */}
        {activeTab === "settings" && (
          <div className="space-y-6">
            <h2 className="text-2xl font-semibold flex items-center gap-2" style={{ color: THEME.darkText }}>
              <Settings className="h-6 w-6" /> Settings
            </h2>
            <div className="bg-white rounded-lg shadow-md p-6 transition-shadow hover:shadow-lg">
              <h3 className="text-lg font-semibold mb-6" style={{ color: THEME.darkText }}>
                Application Settings
              </h3>
              <div className="space-y-6">
                <div>
                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-gray-300 focus:ring-primary"
                      style={{ accentColor: THEME.primary }}
                      disabled
                    />
                    <span style={{ color: THEME.lightText }}>Dark Mode (Coming Soon)</span>
                  </label>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: THEME.darkText }}>
                    Default Start Period
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <select
                      defaultValue="2025"
                      className="border rounded-md px-3 py-2 focus:outline-none focus:ring-1"
                      style={{ borderColor: THEME.secondary }}
                    >
                      <option value="2025">2025</option>
                      <option value="2024">2024</option>
                    </select>
                    <select
                      defaultValue="Mar"
                      className="border rounded-md px-3 py-2 focus:outline-none focus:ring-1"
                      style={{ borderColor: THEME.secondary }}
                    >
                      <option value="Jan">January</option>
                      <option value="Feb">February</option>
                      <option value="Mar">March</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: THEME.darkText }}>
                    Loss Warning Thresholds (%)
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      {/* Fixed JSX issue with >= symbol by using template literal */}
                      <label
                        htmlFor="highLossThreshold"
                        className="block text-xs mb-1"
                        style={{ color: THEME.lightText }}
                      >
                        {`High Loss (≥)`}
                      </label>
                      <input
                        id="highLossThreshold"
                        type="number"
                        defaultValue="20"
                        className="border rounded-md px-3 py-2 w-full focus:outline-none focus:ring-1"
                        style={{ borderColor: THEME.secondary }}
                      />
                    </div>
                    <div>
                      {/* Fixed JSX issue with >= symbol by using template literal */}
                      <label
                        htmlFor="mediumLossThreshold"
                        className="block text-xs mb-1"
                        style={{ color: THEME.lightText }}
                      >
                        {`Medium Loss (≥)`}
                      </label>
                      <input
                        id="mediumLossThreshold"
                        type="number"
                        defaultValue="10"
                        className="border rounded-md px-3 py-2 w-full focus:outline-none focus:ring-1"
                        style={{ borderColor: THEME.secondary }}
                      />
                    </div>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: THEME.darkText }}>
                    Notification Settings
                  </label>
                  <div className="space-y-2">
                    <label className="flex items-center space-x-3 cursor-pointer">
                      <input
                        type="checkbox"
                        className="h-4 w-4 rounded border-gray-300 focus:ring-primary"
                        style={{ accentColor: THEME.primary }}
                      />
                      <span style={{ color: THEME.darkText }}>Email Alerts for High Loss Zones</span>
                    </label>
                    <label className="flex items-center space-x-3 cursor-pointer">
                      <input
                        type="checkbox"
                        className="h-4 w-4 rounded border-gray-300 focus:ring-primary"
                        style={{ accentColor: THEME.primary }}
                      />
                      <span style={{ color: THEME.darkText }}>Monthly Report Auto-Generation</span>
                    </label>
                  </div>
                </div>
                <div className="pt-4 border-t border-gray-200 mt-6">
                  <button
                    className="px-5 py-2.5 rounded-md shadow-sm text-white flex items-center justify-center transition-colors duration-200"
                    style={{ backgroundColor: THEME.primary }}
                  >
                    Save Settings
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Other tabs would be implemented similarly */}
        {activeTab !== "dashboard" && activeTab !== "loss_details" && activeTab !== "settings" && (
          <div
            className="bg-white rounded-lg shadow-md p-6 flex justify-center items-center"
            style={{ minHeight: "300px" }}
          >
            <p className="text-xl" style={{ color: THEME.lightText }}>
              {activeTab.replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase())} content would be displayed here.
              <br />
              <br />
              <span className="text-base">
                The dashboard implements full water system logic with data hierarchy and proper loss calculations.
              </span>
            </p>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="text-center py-4 mt-8 border-t" style={{ borderColor: THEME.light }}>
        <p className="text-xs" style={{ color: THEME.lightText }}>
          Muscat Bay Water System Dashboard © 2025
        </p>
      </footer>
    </div>
  )
}

// KPI Card Component
const KPICard = ({ title, value, description, icon: Icon, theme, bgColor }) => (
  <div
    className="rounded-lg shadow-md p-4 md:p-5 text-white transition-shadow hover:shadow-lg flex flex-col justify-between min-h-[120px]"
    style={{ background: bgColor }}
  >
    <div>
      <div className="flex justify-between items-start mb-2">
        <p
          className="text-xs sm:text-sm font-medium uppercase tracking-wider"
          style={{ color: theme.white, opacity: 0.8 }}
        >
          {title}
        </p>
        <div className="p-1.5 rounded-full" style={{ background: `${theme.white}20` }}>
          <Icon className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
        </div>
      </div>
      <h3 className="text-2xl md:text-3xl font-bold">{value}</h3>
    </div>
    <p className="text-xs mt-2" style={{ color: theme.white, opacity: 0.8 }}>
      {description}
    </p>
  </div>
)

export default MuscatBayWaterSystem
