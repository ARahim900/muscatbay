"use client"

import { Button } from "@/components/ui/button"

import { Badge } from "@/components/ui/badge"

import { useState, useEffect, useMemo } from "react"
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
import { ArrowDownRight, Droplet, Activity, Layers, Percent, MapPin, Type, Settings } from "lucide-react"

// Import the KPI_Card component
import KPI_Card from "@/components/water-system/kpi-card"

// --- EMBEDDED CSV DATA ---
// Data provided by the user, reformatted into CSV string
const consolidatedCsvData = `Meter Label,Acct #,Zone,Type,Parent Meter,Label,Jan-24,Feb-24,Mar-24,Apr-24,May-24,Jun-24,Jul-24,Aug-24,Sep-24,Oct-24,Nov-24,Dec-24,Jan-25,Feb-25,Mar-25
"Z5-17","4300001","Zone_05","Residential (Villa)","ZONE 5 (Bulk Zone 5)","L3",99,51,53,62,135,140,34,13,26,31,35,41,112,80,81
"Z3-42 (Villa)","4300002","Zone_03_(A)","Residential (Villa)","ZONE 3A (BULK ZONE 3A)","L3",61,33,36,47,39,42,25,20,44,57,51,75,32,46,19
"Z3-46(5) (Building)","4300003","Zone_03_(A)","Residential (Apart)","D-46 Building Bulk Meter","L3",0,0,0,0,0,0,0,0,0,0,0,0,5,0,0
"Z3-49(3) (Building)","4300004","Zone_03_(A)","Residential (Apart)","D-49 Building Bulk Meter","L3",11,22,30,18,6,7,11,7,10,9,5,10,15,1,1
"Z3-38 (Villa)","4300005","Zone_03_(A)","Residential (Villa)","ZONE 3A (BULK ZONE 3A)","L3",0,0,0,0,0,3,0,4,3,0,2,1,2,11,7
"Z3-75(4) (Building)","4300006","Zone_03_(A)","Residential (Apart)","D-75 Building Bulk Meter","L3",0,1,4,3,0,0,0,0,0,0,0,7,6,0,0
"Z3-46(3A) (Building)","4300007","Zone_03_(A)","Residential (Apart)","D-46 Building Bulk Meter","L3",13,7,6,25,27,30,35,41,29,44,32,43,38,35,15
"Z3-52(6) (Building)","4300008","Zone_03_(B)","Residential (Apart)","D-52 Building Bulk Meter","L3",27,22,19,28,27,27,29,8,5,8,14,18,17,8,10
"Z3-21 (Villa)","4300009","Zone_03_(B)","Residential (Villa)","ZONE 3B (BULK ZONE 3B)","L3",37,38,24,20,31,41,9,5,4,26,36,84,54,34,15
"Z3-049(4) (Building)","4300010","Zone_03_(A)","Residential (Apart)","D-49 Building Bulk Meter","L3",11,10,0,0,0,0,0,0,0,0,0,4,8,1,8`

// Main App Component: MuscatBayWaterSystem
const WaterSystemSection = ({ fullView = false }: { fullView?: boolean }) => {
  // --- THEME Definition ---
  const THEME = {
    primary: "#4E4456", // Dark purple header
    secondary: "#A5A0AB", // Light purple-grey
    accent: "#9AD0D2", // Teal/mint accent
    light: "#E4E2E7", // Light grey background
    white: "#FFFFFF", // White
    darkText: "#383339", // Dark text color
    lightText: "#7A737F", // Lighter text color
    success: "#7CBBA7", // Green for success/good status
    warning: "#D8BC74", // Yellow/Orange for warnings
    error: "#C48B9F", // Red/Pink for errors/high loss
    chartColors: ["#9AD0D2", "#A5A0AB", "#C48B9F", "#D8BC74", "#7CBBA7", "#B8A9C6"],
  }

  // --- State Variables ---
  const [rawData, setRawData] = useState([])
  const [processedData, setProcessedData] = useState([])
  const [selectedYear, setSelectedYear] = useState("2025")
  const [selectedMonth, setSelectedMonth] = useState("Mar")
  const [selectedPeriod, setSelectedPeriod] = useState("Mar-25")
  const [activeTab, setActiveTab] = useState("dashboard")
  const [selectedZone, setSelectedZone] = useState("Zone_05")
  const [selectedType, setSelectedType] = useState("All Types")
  const [isLoading, setIsLoading] = useState(true)
  const [isScriptLoading, setIsScriptLoading] = useState(true)
  const [settingsSaved, setSettingsSaved] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")

  // --- Load PapaParse Script from CDN ---
  useEffect(() => {
    const scriptId = "papaparse-cdn-script"
    if (document.getElementById(scriptId) || window.Papa) {
      setIsScriptLoading(false)
      return
    }
    const script = document.createElement("script")
    script.id = scriptId
    script.src = "https://cdnjs.cloudflare.com/ajax/libs/PapaParse/5.3.2/papaparse.min.js"
    script.async = true
    script.onload = () => {
      console.log("PapaParse loaded.")
      setIsScriptLoading(false)
    }
    script.onerror = () => {
      console.error("Failed to load PapaParse.")
      setIsScriptLoading(false)
    }
    document.body.appendChild(script)
  }, [])

  // --- Data Loading and Processing Effect ---
  useEffect(() => {
    setSelectedPeriod(`${selectedMonth}-${selectedYear.substring(2)}`)
  }, [selectedYear, selectedMonth])

  useEffect(() => {
    if (isScriptLoading) return // Wait for PapaParse

    const loadAndProcessData = () => {
      setIsLoading(true)
      try {
        // Check if PapaParse is loaded
        if (!window.Papa) {
          console.error("PapaParse is not available!")
          throw new Error("Parsing library not loaded.")
        }

        // Parse the embedded CSV data string
        const parsedData = window.Papa.parse(consolidatedCsvData, {
          header: true,
          dynamicTyping: true,
          skipEmptyLines: true,
          transformHeader: (header) => header.trim(), // Trim headers
        })

        if (parsedData.errors && parsedData.errors.length > 0) {
          console.error("CSV Parsing Errors:", parsedData.errors)
        }

        setRawData(parsedData.data) // Store raw data
        const dataForProcessing = parsedData.data || []
        const processed = processRawData(dataForProcessing)
        setProcessedData(processed)

        // Auto-select first available zone if default is invalid or not present
        const zones = [...new Set(processed.filter((m) => m.zone && m.zone !== "Unknown").map((m) => m.zone))]
        if (zones.length > 0 && (!selectedZone || !zones.includes(selectedZone))) {
          setSelectedZone(zones[0])
        } else if (zones.length === 0) {
          setSelectedZone("")
        }
      } catch (error) {
        console.error("Error loading or processing embedded data:", error)
        setRawData([])
        setProcessedData([])
      } finally {
        setIsLoading(false)
      }
    }

    loadAndProcessData()
  }, [isScriptLoading, selectedZone])

  // --- Process Raw Data Function ---
  const processRawData = (rawDataArray) => {
    const allMonths = [
      "Jan-24",
      "Feb-24",
      "Mar-24",
      "Apr-24",
      "May-24",
      "Jun-24",
      "Jul-24",
      "Aug-24",
      "Sep-24",
      "Oct-24",
      "Nov-24",
      "Dec-24",
      "Jan-25",
      "Feb-25",
      "Mar-25",
    ]
    return rawDataArray
      .map((row) => {
        const processedRow = {}
        processedRow.meterLabel = String(row["Meter Label"] || "").trim()
        processedRow.acctNum = String(row["Acct #"] || "").trim()
        processedRow.zone = String(row.Zone || "Unknown").trim()
        processedRow.type = String(row.Type || "Unknown").trim()
        processedRow.parentMeterLabel = String(row["Parent Meter"] || "").trim() || null
        const labelValue = row.Label || row["Level "] || "Unknown"
        processedRow.label = String(labelValue).trim()

        // Normalize common variations
        if (processedRow.zone === "Direct Connection") processedRow.zone = "Direct Connection "
        if (processedRow.zone === "Zone_03_(A)") processedRow.zone = "Zone_03_(A)"
        if (processedRow.zone === "Zone_03_(B)") processedRow.zone = "Zone_03_(B)"

        // Ensure all potential month columns are numbers
        allMonths.forEach((key) => {
          processedRow[key] = key in row ? Number(row[key]) || 0 : 0
        })
        return processedRow
      })
      .filter((row) => row.meterLabel && row.meterLabel !== "Unknown" && row.label && row.label !== "Unknown")
  }

  // --- Calculation Logic ---
  const calculatedMetrics = useMemo(() => {
    const defaultMetrics = {
      totalL1Supply: 0,
      totalL2Volume: 0,
      totalL3Volume: 0,
      stage1Loss: 0,
      stage1LossPercentage: 0,
      stage2Loss: 0,
      stage2LossPercentage: 0,
      totalLoss: 0,
      totalLossPercentage: 0,
      consumptionByType: {},
      zoneMetrics: {},
      topLosingZones: [],
      debugInfo: {
        l1Count: 0,
        l2Count: 0,
        dcFromL1Count: 0,
        l3ForTotalCount: 0,
        dcForTotalCount: 0,
        excludedL3Value: 0,
      },
    }

    if (!processedData || processedData.length === 0 || !selectedPeriod || !processedData[0]?.[selectedPeriod]) {
      console.warn(`Calculation skipped: No data or invalid period (${selectedPeriod})`)
      return defaultMetrics
    }

    const dataForPeriod = processedData
    const debugInfo = { ...defaultMetrics.debugInfo }
    const l1Meter = dataForPeriod.find((row) => row.label === "L1")
    const totalL1Supply = l1Meter ? l1Meter[selectedPeriod] || 0 : 0
    debugInfo.l1Count = l1Meter ? 1 : 0

    const l2Meters = dataForPeriod.filter((row) => row.label === "L2")
    const dcMetersFromL1 = dataForPeriod.filter(
      (row) => row.label === "DC" && row.parentMeterLabel === l1Meter?.meterLabel,
    )
    const l2SumFromL2Labels = l2Meters.reduce((sum, m) => sum + (m[selectedPeriod] || 0), 0)
    const l2SumFromDCLabels = dcMetersFromL1.reduce((sum, m) => sum + (m[selectedPeriod] || 0), 0)
    const totalL2Volume = l2SumFromL2Labels + l2SumFromDCLabels
    debugInfo.l2Count = l2Meters.length
    debugInfo.dcFromL1Count = dcMetersFromL1.length

    const l3MetersForTotal = dataForPeriod.filter((row) => row.label === "L3")
    const dcMetersForTotal = dataForPeriod.filter((row) => row.label === "DC")
    const excludedMeter = dataForPeriod.find((row) => String(row.acctNum) === "4300322")
    const excludedValue = excludedMeter ? excludedMeter[selectedPeriod] || 0 : 0
    const l3SumFromL3Labels = l3MetersForTotal.reduce((sum, m) => sum + (m[selectedPeriod] || 0), 0)
    const l3SumFromDCLabels = dcMetersForTotal.reduce((sum, m) => sum + (m[selectedPeriod] || 0), 0)

    // Apply exclusion only if the meter is L3
    const totalL3Volume =
      l3SumFromL3Labels - (excludedMeter && excludedMeter.label === "L3" ? excludedValue : 0) + l3SumFromDCLabels
    debugInfo.l3ForTotalCount = l3MetersForTotal.length
    debugInfo.dcForTotalCount = dcMetersForTotal.length
    debugInfo.excludedL3Value = excludedMeter && excludedMeter.label === "L3" ? excludedValue : 0

    const stage1Loss = totalL1Supply - totalL2Volume
    const stage2Loss = totalL2Volume - totalL3Volume
    const totalLoss = totalL1Supply - totalL3Volume
    const stage1LossPercentage = totalL1Supply > 0 ? (stage1Loss / totalL1Supply) * 100 : 0
    const stage2LossPercentage = totalL2Volume > 0 ? (stage2Loss / totalL2Volume) * 100 : 0
    const totalLossPercentage = totalL1Supply > 0 ? (totalLoss / totalL1Supply) * 100 : 0

    const consumptionByType = dataForPeriod
      .filter((m) => m.label === "L3" || m.label === "DC")
      .reduce((acc, meter) => {
        const value = meter[selectedPeriod] || 0
        const effectiveValue = String(meter.acctNum) === "4300322" && meter.label === "L3" ? 0 : value
        const type = meter.type || "Unknown"
        acc[type] = (acc[type] || 0) + effectiveValue
        return acc
      }, {})

    const zoneMetrics = {}
    const zonesWithL2Meters = [...new Set(l2Meters.map((m) => m.zone).filter((zone) => zone && zone !== "Unknown"))]
    zonesWithL2Meters.forEach((zoneName) => {
      const zoneL2Meters = l2Meters.filter((m) => m.zone === zoneName)
      const l2BulkReading = zoneL2Meters.reduce((sum, m) => sum + (m[selectedPeriod] || 0), 0)
      const l3MetersInZone = dataForPeriod.filter((m) => m.label === "L3" && m.zone === zoneName)
      const l3SumInZone = l3MetersInZone.reduce((sum, m) => {
        let value = m[selectedPeriod] || 0
        if (zoneName === "Zone_03_(A)" && String(m.acctNum) === "4300322") {
          value = 0
        }
        return sum + value
      }, 0)
      const internalLoss = l2BulkReading - l3SumInZone
      const internalLossPercentage =
        l2BulkReading > 0 ? (internalLoss / l2BulkReading) * 100 : l3SumInZone > 0 ? Number.NEGATIVE_INFINITY : 0
      zoneMetrics[zoneName] = {
        l2Bulk: l2BulkReading,
        l3Sum: l3SumInZone,
        loss: internalLoss,
        lossPercentage: internalLossPercentage,
      }
    })

    const topLosingZones = Object.entries(zoneMetrics)
      .map(([name, data]) => ({
        name: name
          .replace("Zone_", "")
          .replace(/_/g, " ")
          .replace("(A)", " A")
          .replace("(B)", " B")
          .replace("(FM)", " FM"),
        lossPercentage: data.lossPercentage,
      }))
      .filter(
        (z) =>
          z.lossPercentage !== undefined &&
          !isNaN(z.lossPercentage) &&
          isFinite(z.lossPercentage) &&
          z.lossPercentage >= 0,
      )
      .sort((a, b) => b.lossPercentage - a.lossPercentage)
      .slice(0, 5)

    return {
      totalL1Supply,
      totalL2Volume,
      totalL3Volume,
      stage1Loss,
      stage1LossPercentage,
      stage2Loss,
      stage2LossPercentage,
      totalLoss,
      totalLossPercentage,
      consumptionByType,
      zoneMetrics,
      topLosingZones,
      debugInfo,
    }
  }, [processedData, selectedPeriod])

  // --- Helper Functions ---
  const formatNumber = (num) => {
    return isNaN(num) || num === null || num === undefined ? "0" : Math.round(num).toLocaleString()
  }

  const formatPercentage = (value, decimals = 1) => {
    if (isNaN(value) || value === null || value === undefined || !isFinite(value)) return "0.0%"
    const factor = Math.pow(10, decimals)
    const roundedValue = Math.round(value * factor) / factor
    return `${roundedValue.toFixed(decimals)}%`
  }

  const getLossStatusColor = (lossPercentage) => {
    if (isNaN(lossPercentage) || lossPercentage === null || lossPercentage === undefined || !isFinite(lossPercentage))
      return THEME.secondary
    if (lossPercentage > 20) return THEME.error
    if (lossPercentage > 10) return THEME.warning
    if (lossPercentage >= 0) return THEME.success
    return THEME.accent
  }

  const getLossStatusText = (lossPercentage) => {
    if (isNaN(lossPercentage) || lossPercentage === null || lossPercentage === undefined || !isFinite(lossPercentage))
      return "Unknown"
    if (lossPercentage > 20) return "High Loss"
    if (lossPercentage > 10) return "Medium Loss"
    if (lossPercentage >= 0) return "Good"
    return "Gain"
  }

  // --- Event Handlers ---
  const handleTabChange = (tab) => setActiveTab(tab)

  const handleSaveSettings = () => {
    setSettingsSaved(true)
    setTimeout(() => setSettingsSaved(false), 3000)
    console.log("Settings saved (simulated)")
  }

  const handleRefresh = () => {
    if (isScriptLoading) return
    console.log("Refreshing data...")
    setIsLoading(true)
    try {
      if (!window.Papa) throw new Error("Parsing library not loaded.")
      const parsedData = window.Papa.parse(consolidatedCsvData, {
        header: true,
        dynamicTyping: true,
        skipEmptyLines: true,
        transformHeader: (h) => h.trim(),
      })
      if (parsedData.errors && parsedData.errors.length > 0)
        console.error("CSV Parsing Errors on refresh:", parsedData.errors)
      setRawData(parsedData.data)
      const dataForProcessing = parsedData.data || []
      const processed = processRawData(dataForProcessing)
      setProcessedData(processed)
    } catch (error) {
      console.error("Error refreshing data:", error)
      setRawData([])
      setProcessedData([])
    } finally {
      setTimeout(() => setIsLoading(false), 300)
    }
  }

  // --- Data Preparation Functions for Tabs ---
  const getSelectedZoneMeters = () => {
    if (!processedData) return []
    return processedData.filter(
      (row) => row.zone === selectedZone && row.label === "L3" && String(row.acctNum) !== "4300322",
    )
  }

  const getConsumptionByZoneData = () => {
    if (!processedData || !selectedPeriod) return []
    const zoneConsumption = {}
    processedData.forEach((row) => {
      if (selectedType !== "All Types" && row.type !== selectedType) return
      if (
        (row.label === "L3" || row.label === "DC") &&
        row.zone &&
        row.zone !== "Unknown" &&
        String(row.acctNum) !== "4300322"
      ) {
        const value = row[selectedPeriod] || 0
        const zoneName = row.zone
        if (!zoneConsumption[zoneName]) zoneConsumption[zoneName] = 0
        zoneConsumption[zoneName] += value
      }
    })
    return Object.entries(zoneConsumption)
      .filter(([zone, value]) => value > 0)
      .map(([zone, value]) => ({
        name: zone
          .replace("Zone_", "")
          .replace(/_/g, " ")
          .replace("(A)", " A")
          .replace("(B)", " B")
          .replace("(FM)", " FM"),
        value,
      }))
      .sort((a, b) => b.value - a.value)
  }

  const calculateLossTrend = () => {
    if (!processedData || processedData.length === 0) return []
    const yearSuffix = selectedYear.substring(2)
    const monthsInYear = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
    const availableMonths = monthsInYear.filter((month) => processedData[0]?.[`${month}-${yearSuffix}`] !== undefined)
    const trend = availableMonths.map((month) => {
      const periodKey = `${month}-${yearSuffix}`
      const l1Meter = processedData.find((row) => row.label === "L1")
      const totalL1 = l1Meter ? l1Meter[periodKey] || 0 : 0
      const l2Meters = processedData.filter((row) => row.label === "L2")
      const dcMetersFromL1 = processedData.filter(
        (row) => row.label === "DC" && row.parentMeterLabel === l1Meter?.meterLabel,
      )
      const totalL2 =
        l2Meters.reduce((sum, m) => sum + (m[periodKey] || 0), 0) +
        dcMetersFromL1.reduce((sum, m) => sum + (m[periodKey] || 0), 0)
      const l3Meters = processedData.filter((row) => row.label === "L3" && String(row.acctNum) !== "4300322")
      const dcMeters = processedData.filter((row) => row.label === "DC")
      const totalL3 =
        l3Meters.reduce((sum, m) => sum + (m[periodKey] || 0), 0) +
        dcMeters.reduce((sum, m) => sum + (m[periodKey] || 0), 0)
      const stage1Loss = totalL1 - totalL2
      const stage2Loss = totalL2 - totalL3
      const totalLoss = totalL1 - totalL3
      const stage1LossPct = totalL1 > 0 ? (stage1Loss / totalL1) * 100 : 0
      const stage2LossPct = totalL2 > 0 ? (stage2Loss / totalL2) * 100 : 0
      const totalLossPct = totalL1 > 0 ? (totalLoss / totalL1) * 100 : 0
      return { period: month, stage1LossPct, stage2LossPct, totalLossPct }
    })
    return trend
  }

  const prepareConsumptionByTypeData = () => {
    if (!calculatedMetrics.consumptionByType) return []
    return Object.entries(calculatedMetrics.consumptionByType)
      .map(([name, value]) => ({ name, value }))
      .filter((item) => item.value > 0)
      .sort((a, b) => b.value - a.value)
  }

  const filteredZoneMeters = useMemo(() => {
    const meters = getSelectedZoneMeters()
    if (!searchTerm) return meters
    const lowerSearchTerm = searchTerm.toLowerCase()
    return meters.filter(
      (meter) =>
        meter.meterLabel?.toLowerCase().includes(lowerSearchTerm) ||
        String(meter.acctNum)?.toLowerCase().includes(lowerSearchTerm) ||
        meter.type?.toLowerCase().includes(lowerSearchTerm),
    )
  }, [processedData, selectedZone, searchTerm, selectedPeriod])

  // --- RENDER LOGIC ---
  // Combine loading states
  const showLoading = isScriptLoading || isLoading // Show loading if script OR data is loading

  if (showLoading) {
    // Loading Screen
    return (
      <div className="flex items-center justify-center h-screen" style={{ backgroundColor: THEME.light }}>
        <div className="flex flex-col items-center">
          <div
            className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 mb-4"
            style={{ borderColor: THEME.primary }}
          ></div>
          <p className="text-lg" style={{ color: THEME.darkText }}>
            {isScriptLoading ? "Loading libraries..." : "Loading data..."}
          </p>
        </div>
      </div>
    )
  }

  // If in full view mode, render the complete water system dashboard
  if (fullView) {
    return (
      <div className="min-h-screen font-sans" style={{ backgroundColor: THEME.light }}>
        {/* Header removed - using main application header instead */}

        {/* Tab Navigation */}
        <nav className="bg-white shadow sticky top-[72px] z-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div
              className="flex space-x-6 md:space-x-8 overflow-x-auto no-scrollbar"
              style={{ scrollbarWidth: "none" }}
            >
              {[
                { id: "dashboard", label: "Dashboard", icon: Activity },
                { id: "zone_details", label: "Zone Details", icon: MapPin },
                { id: "type_details", label: "Type Details", icon: Type },
                { id: "loss_details", label: "Loss Details", icon: Percent },
                { id: "settings", label: "Settings", icon: Settings },
              ].map((tab) => (
                <button
                  key={tab.id}
                  className={`flex items-center gap-2 py-3 md:py-4 px-1 whitespace-nowrap text-sm font-medium transition-colors duration-150 ${activeTab === tab.id ? "border-b-2" : "border-b-2 border-transparent hover:border-gray-300"}`}
                  style={{
                    borderColor: activeTab === tab.id ? THEME.accent : "transparent",
                    color: activeTab === tab.id ? THEME.primary : THEME.lightText,
                  }}
                  onClick={() => handleTabChange(tab.id)}
                >
                  <tab.icon className="h-4 w-4" /> {tab.label}
                </button>
              ))}
            </div>
          </div>
        </nav>

        {/* Main Content Area */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Dashboard Tab */}
          {activeTab === "dashboard" && (
            <div className="space-y-6">
              <h2 className="text-2xl font-semibold" style={{ color: THEME.darkText }}>
                Dashboard Overview - {selectedPeriod}
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-5">
                <KPI_Card
                  title="Total L1 Supply"
                  value={`${formatNumber(calculatedMetrics.totalL1Supply)} m³`}
                  description="Main Source Input"
                  icon={Layers}
                  theme={THEME}
                  bgColor={THEME.primary}
                />
                <KPI_Card
                  title="Total L3 Consumption"
                  value={`${formatNumber(calculatedMetrics.totalL3Volume)} m³`}
                  description="End User + DC"
                  icon={Droplet}
                  theme={THEME}
                  bgColor={THEME.secondary}
                />
                <KPI_Card
                  title="Total Loss (NRW)"
                  value={`${formatPercentage(calculatedMetrics.totalLossPercentage)}`}
                  description={`${formatNumber(calculatedMetrics.totalLoss)} m³ of L1`}
                  icon={Percent}
                  theme={THEME}
                  bgColor={THEME.accent}
                />
                <KPI_Card
                  title="Stage 1 Loss"
                  value={`${formatPercentage(calculatedMetrics.stage1LossPercentage)}`}
                  description={`${formatNumber(calculatedMetrics.stage1Loss)} m³ (Trunk)`}
                  icon={ArrowDownRight}
                  theme={THEME}
                  bgColor={THEME.accent}
                />
                <KPI_Card
                  title="Stage 2 Loss"
                  value={`${formatPercentage(calculatedMetrics.stage2LossPercentage, 1)}`}
                  description={`${formatNumber(calculatedMetrics.stage2Loss)} m³ (Distrib.)`}
                  icon={ArrowDownRight}
                  theme={THEME}
                  bgColor={THEME.accent}
                />
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-lg shadow-md p-6 transition-shadow hover:shadow-lg">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2" style={{ color: THEME.darkText }}>
                    <Type className="h-5 w-5" style={{ color: THEME.accent }} /> L3 Consumption by Type
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
                            `${formatNumber(typeof value === 'number' ? value : 0)} m³ (${calculatedMetrics.totalL3Volume > 0 ? formatPercentage((typeof value === 'number' ? value : 0) / calculatedMetrics.totalL3Volume * 100) : "0.0%"})`,
                            name,
                          ]}
                        />
                        <Legend iconSize={10} wrapperStyle={{ fontSize: "12px", paddingTop: "15px" }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                <div className="bg-white rounded-lg shadow-md p-6 transition-shadow hover:shadow-lg">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2" style={{ color: THEME.darkText }}>
                    <MapPin className="h-5 w-5" style={{ color: THEME.error }} /> Top 5 Losing Zones (Internal %)
                  </h3>
                  <div style={{ width: "100%", height: 300 }}>
                    <ResponsiveContainer>
                      <BarChart
                        data={calculatedMetrics.topLosingZones}
                        layout="vertical"
                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={`${THEME.secondary}30`} />
                        <XAxis
                          type="number"
                          tickFormatter={(value) => `${value.toFixed(1)}%`}
                          tick={{ fill: THEME.lightText, fontSize: 12 }}
                        />
                        <YAxis
                          dataKey="name"
                          type="category"
                          width={80}
                          tick={{ fill: THEME.lightText, fontSize: 12 }}
                        />
                        <Tooltip formatter={(value) => [`${formatPercentage(value)}`, "Internal Loss %"]} />
                        <Bar dataKey="lossPercentage" barSize={20} radius={[0, 4, 4, 0]}>
                          {calculatedMetrics.topLosingZones.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={THEME.accent} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Zone Details Tab */}
          {activeTab === "zone_details" && (
            <div className="space-y-6">
              <h2 className="text-2xl font-semibold flex items-center gap-2" style={{ color: THEME.darkText }}>
                <MapPin className="h-6 w-6" /> Zone Details
              </h2>
              <div className="flex items-center bg-white p-4 rounded-lg shadow-sm gap-4 flex-wrap">
                <span className="text-sm font-medium" style={{ color: THEME.lightText }}>
                  Select Zone:
                </span>
                <select
                  className="border rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary flex-grow"
                  style={{ borderColor: THEME.secondary }}
                  value={selectedZone}
                  onChange={(e) => setSelectedZone(e.target.value)}
                >
                  {Object.keys(calculatedMetrics.zoneMetrics || {})
                    .filter((zone) => zone !== "Unknown")
                    .sort()
                    .map((zone) => (
                      <option key={zone} value={zone}>
                        {zone.replace("Zone_", "").replace(/_/g, " ")}
                      </option>
                    ))}
                </select>
              </div>
              {calculatedMetrics.zoneMetrics && calculatedMetrics.zoneMetrics[selectedZone] ? (
                <div className="bg-white rounded-lg shadow-md p-6 transition-shadow hover:shadow-lg">
                  <h3 className="text-lg font-semibold mb-4" style={{ color: THEME.darkText }}>
                    {selectedZone.replace("Zone_", "").replace(/_/g, " ")} Overview
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
                    <div className="relative flex justify-center items-center col-span-1 md:col-span-1 h-48">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={[
                              {
                                name: "Consumed",
                                value: Math.max(0, calculatedMetrics.zoneMetrics[selectedZone].l3Sum),
                              },
                              { name: "Loss", value: Math.max(0, calculatedMetrics.zoneMetrics[selectedZone].loss) },
                            ]}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            dataKey="value"
                            startAngle={90}
                            endAngle={450}
                            paddingAngle={2}
                          >
                            <Cell fill={THEME.accent} />
                            <Cell fill={THEME.accent} />
                          </Pie>
                          <Tooltip formatter={(value, name) => [`${formatNumber(value)} m³`, name]} />
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                        <span
                          className="text-2xl font-bold"
                          style={{
                            color: THEME.primary,
                          }}
                        >
                          {formatPercentage(calculatedMetrics.zoneMetrics[selectedZone].lossPercentage)}
                        </span>
                        <span className="text-xs mt-1" style={{ color: THEME.lightText }}>
                          Internal Loss
                        </span>
                      </div>
                    </div>
                    <div className="col-span-1 md:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div
                        className="bg-gray-50 p-4 rounded-lg text-center sm:text-left"
                        style={{ backgroundColor: THEME.light }}
                      >
                        <p className="text-xs uppercase tracking-wider mb-1" style={{ color: THEME.lightText }}>
                          L2 Bulk In
                        </p>
                        <p className="text-xl font-semibold" style={{ color: THEME.darkText }}>
                          {formatNumber(calculatedMetrics.zoneMetrics[selectedZone].l2Bulk)} m³
                        </p>
                      </div>
                      <div
                        className="bg-gray-50 p-4 rounded-lg text-center sm:text-left"
                        style={{ backgroundColor: THEME.light }}
                      >
                        <p className="text-xs uppercase tracking-wider mb-1" style={{ color: THEME.lightText }}>
                          L3 Consumed
                        </p>
                        <p className="text-xl font-semibold" style={{ color: THEME.darkText }}>
                          {formatNumber(calculatedMetrics.zoneMetrics[selectedZone].l3Sum)} m³
                        </p>
                      </div>
                      <div
                        className="bg-gray-50 p-4 rounded-lg text-center sm:text-left"
                        style={{ backgroundColor: THEME.light }}
                      >
                        <p className="text-xs uppercase tracking-wider mb-1" style={{ color: THEME.lightText }}>
                          Internal Loss
                        </p>
                        <p
                          className="text-xl font-semibold"
                          style={{
                            color: THEME.primary,
                          }}
                        >
                          {formatNumber(calculatedMetrics.zoneMetrics[selectedZone].loss)} m³
                        </p>
                        <p
                          className="text-xs mt-1"
                          style={{
                            color: THEME.primary,
                          }}
                        >
                          ({formatPercentage(calculatedMetrics.zoneMetrics[selectedZone].lossPercentage)})
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-lg shadow-md p-6 text-center" style={{ color: THEME.lightText }}>
                  No data available for {selectedZone} in {selectedPeriod}.
                </div>
              )}
              <div className="bg-white rounded-lg shadow-md p-6 transition-shadow hover:shadow-lg">
                <div className="flex flex-wrap justify-between items-center mb-4 gap-4">
                  <h3 className="text-lg font-semibold" style={{ color: THEME.darkText }}>
                    Meters in {selectedZone.replace("Zone_", "").replace(/_/g, " ")}
                  </h3>
                  <div className="flex items-center">
                    <input
                      type="text"
                      placeholder="Search meters..."
                      className="border rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                      style={{ borderColor: THEME.secondary }}
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead style={{ backgroundColor: THEME.light }}>
                      <tr>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider"
                          style={{ color: THEME.lightText }}
                        >
                          Meter Label
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider"
                          style={{ color: THEME.lightText }}
                        >
                          Account #
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider"
                          style={{ color: THEME.lightText }}
                        >
                          Type
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider"
                          style={{ color: THEME.lightText }}
                        >
                          Reading (m³)
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredZoneMeters.length > 0 ? (
                        filteredZoneMeters.map((meter) => (
                          <tr key={meter.acctNum} className="hover:bg-gray-50 transition-colors">
                            <td
                              className="px-6 py-4 whitespace-nowrap text-sm font-medium"
                              style={{ color: THEME.darkText }}
                            >
                              {meter.meterLabel}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm" style={{ color: THEME.lightText }}>
                              {meter.acctNum}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              <span
                                className="px-2.5 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full"
                                style={{ backgroundColor: THEME.accent + "30", color: THEME.primary }}
                              >
                                {meter.type}
                              </span>
                            </td>
                            <td
                              className="px-6 py-4 whitespace-nowrap text-sm font-medium"
                              style={{ color: THEME.darkText }}
                            >
                              {formatNumber(meter[selectedPeriod] || 0)}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="4" className="text-center py-4 text-sm" style={{ color: THEME.lightText }}>
                            {searchTerm ? "No meters match your search." : "No L3 meters found for this zone."}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Type Details Tab */}
          {activeTab === "type_details" && (
            <div className="space-y-6">
              <h2 className="text-2xl font-semibold flex items-center gap-2" style={{ color: THEME.darkText }}>
                <Type className="h-6 w-6" /> Type Analysis
              </h2>
              <div className="flex items-center bg-white p-4 rounded-lg shadow-sm gap-4 flex-wrap">
                <span className="text-sm font-medium" style={{ color: THEME.lightText }}>
                  Select Usage Type:
                </span>
                <select
                  className="border rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary flex-grow"
                  style={{ borderColor: THEME.secondary }}
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                >
                  <option value="All Types">All Types</option>
                  {Object.keys(calculatedMetrics.consumptionByType || {})
                    .sort()
                    .map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                </select>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white rounded-lg shadow-md p-6 transition-shadow hover:shadow-lg">
                  <h4 className="text-sm uppercase tracking-wider mb-2" style={{ color: THEME.lightText }}>
                    Total Consumption
                  </h4>
                  <p className="text-3xl font-bold" style={{ color: THEME.primary }}>
                    {formatNumber(
                      selectedType === "All Types"
                        ? calculatedMetrics.totalL3Volume
                        : calculatedMetrics.consumptionByType[selectedType] || 0,
                    )}
                    m³
                  </p>
                  <p className="text-xs mt-1" style={{ color: THEME.lightText }}>
                    {selectedType === "All Types" || calculatedMetrics.totalL3Volume === 0
                      ? `(${selectedType})`
                      : `(${formatPercentage(((calculatedMetrics.consumptionByType[selectedType] || 0) / calculatedMetrics.totalL3Volume) * 100)} of Total L3)`}
                  </p>
                </div>
                <div className="bg-white rounded-lg shadow-md p-6 transition-shadow hover:shadow-lg">
                  <h4 className="text-sm uppercase tracking-wider mb-2" style={{ color: THEME.lightText }}>
                    Highest Zone
                  </h4>
                  {getConsumptionByZoneData().length > 0 ? (
                    <>
                      <p className="text-3xl font-bold" style={{ color: THEME.accent }}>
                        {getConsumptionByZoneData()[0].name}
                      </p>
                      <p className="text-xs mt-1" style={{ color: THEME.lightText }}>
                        {formatNumber(getConsumptionByZoneData()[0].value)} m³
                      </p>
                    </>
                  ) : (
                    <p className="text-3xl font-bold" style={{ color: THEME.lightText }}>
                      N/A
                    </p>
                  )}
                </div>
                <div className="bg-white rounded-lg shadow-md p-6 transition-shadow hover:shadow-lg">
                  <h4 className="text-sm uppercase tracking-wider mb-2" style={{ color: THEME.lightText }}>
                    Average per Zone
                  </h4>
                  {getConsumptionByZoneData().length > 0 ? (
                    <>
                      <p className="text-3xl font-bold" style={{ color: THEME.secondary }}>
                        {formatNumber(
                          getConsumptionByZoneData().reduce((sum, zone) => sum + zone.value, 0) /
                            getConsumptionByZoneData().length,
                        )}
                        m³
                      </p>
                      <p className="text-xs mt-1" style={{ color: THEME.lightText }}>
                        Avg. across {getConsumptionByZoneData().length} zones
                      </p>
                    </>
                  ) : (
                    <p className="text-3xl font-bold" style={{ color: THEME.lightText }}>
                      N/A
                    </p>
                  )}
                </div>
              </div>
              <div className="bg-white rounded-lg shadow-md p-6 transition-shadow hover:shadow-lg">
                <h3 className="text-lg font-semibold mb-4" style={{ color: THEME.darkText }}>
                  Consumption by Zone ({selectedType})
                </h3>
                <div style={{ width: "100%", height: 300 }}>
                  <ResponsiveContainer>
                    <BarChart data={getConsumptionByZoneData()} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke={`${THEME.secondary}30`} />
                      <XAxis dataKey="name" tick={{ fill: THEME.lightText, fontSize: 12 }} />
                      <YAxis tick={{ fill: THEME.lightText, fontSize: 12 }} />
                      <Tooltip formatter={(value) => [`${formatNumber(value)} m³`, "Consumption"]} />
                      <Bar dataKey="value" fill={THEME.accent} radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
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
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <KPI_Card
                  title="Stage 1 Loss"
                  value={`${formatPercentage(calculatedMetrics.stage1LossPercentage)}`}
                  description={`${formatNumber(calculatedMetrics.stage1Loss)} m³ (Trunk)`}
                  icon={ArrowDownRight}
                  theme={THEME}
                  bgColor={THEME.accent}
                />
                <KPI_Card
                  title="Stage 2 Loss"
                  value={`${formatPercentage(calculatedMetrics.stage2LossPercentage, 1)}`}
                  description={`${formatNumber(calculatedMetrics.stage2Loss)} m³ (Distrib.)`}
                  icon={ArrowDownRight}
                  theme={THEME}
                  bgColor={THEME.accent}
                />
                <KPI_Card
                  title="Total Loss (NRW)"
                  value={`${formatPercentage(calculatedMetrics.totalLossPercentage)}`}
                  description={`${formatNumber(calculatedMetrics.totalLoss)} m³ of L1`}
                  icon={Percent}
                  theme={THEME}
                  bgColor={THEME.accent}
                />
              </div>
              <div className="bg-white rounded-lg shadow-md p-6 transition-shadow hover:shadow-lg">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2" style={{ color: THEME.darkText }}>
                  <Activity className="h-5 w-5" style={{ color: THEME.secondary }} /> Water Loss Trends ({selectedYear})
                </h3>
                <div style={{ width: "100%", height: 300 }}>
                  {processedData.length > 0 ? (
                    <ResponsiveContainer>
                      <LineChart data={calculateLossTrend()} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
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
                          stroke={THEME.accent}
                          strokeWidth={2}
                          dot={{ r: 3 }}
                          activeDot={{ r: 5 }}
                        />
                        <Line
                          type="monotone"
                          dataKey="stage2LossPct"
                          name="Stage 2 %"
                          stroke={THEME.accent}
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
                  ) : (
                    <div className="flex items-center justify-center h-full" style={{ color: THEME.lightText }}>
                      No trend data available.
                    </div>
                  )}
                </div>
              </div>
              <div className="bg-white rounded-lg shadow-md p-6 transition-shadow hover:shadow-lg">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2" style={{ color: THEME.darkText }}>
                  <MapPin className="h-5 w-5" style={{ color: THEME.secondary }} /> Internal Zone Loss Comparison
                </h3>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
                        {Object.entries(calculatedMetrics.zoneMetrics || {})
                          .filter(([zone, data]) => zone !== "Unknown" && data.l2Bulk > 0)
                          .sort(([, dataA], [, dataB]) => dataB.lossPercentage - dataA.lossPercentage)
                          .map(([zone, data]) => (
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
                              <td className="px-4 py-3 whitespace-nowrap text-sm" style={{ color: THEME.lightText }}>
                                {formatNumber(data.loss)}
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm">
                                <span
                                  className="px-2.5 py-0.5 rounded-full text-xs font-medium"
                                  style={{
                                    backgroundColor: THEME.accent + "30",
                                    color: THEME.primary,
                                  }}
                                >
                                  {formatPercentage(data.lossPercentage)}
                                </span>
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                  <div>
                    <h4 className="text-sm uppercase tracking-wider mb-2" style={{ color: THEME.lightText }}>
                      Loss Status Legend
                    </h4>
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full" style={{ backgroundColor: THEME.success }}></span>
                      <span className="text-xs" style={{ color: THEME.lightText }}>
                        Good
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full" style={{ backgroundColor: THEME.warning }}></span>
                      <span className="text-xs" style={{ color: THEME.lightText }}>
                        Medium Loss
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full" style={{ backgroundColor: THEME.error }}></span>
                      <span className="text-xs" style={{ color: THEME.lightText }}>
                        High Loss
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Settings Tab */}
          {activeTab === "settings" && (
            <div className="space-y-6">
              <h2 className="text-2xl font-semibold flex items-center gap-2" style={{ color: THEME.darkText }}>
                <Settings className="h-6 w-6" /> Settings
              </h2>
              <div className="bg-white rounded-lg shadow-md p-6 transition-shadow hover:shadow-lg">
                <h3 className="text-lg font-semibold mb-4" style={{ color: THEME.darkText }}>
                  Data Configuration
                </h3>
                <p className="text-sm" style={{ color: THEME.lightText }}>
                  Configure data sources, refresh intervals, and other system settings.
                </p>
                <div className="mt-4">
                  <button
                    className="px-4 py-2 rounded text-white font-bold focus:outline-none focus:shadow-outline"
                    style={{ backgroundColor: THEME.accent }}
                    onClick={handleSaveSettings}
                  >
                    Save Settings
                  </button>
                  {settingsSaved && <span className="ml-3 text-green-500">Settings saved!</span>}
                </div>
              </div>
              <div className="bg-white rounded-lg shadow-md p-6 transition-shadow hover:shadow-lg">
                <h3 className="text-lg font-semibold mb-4" style={{ color: THEME.darkText }}>
                  Debug Information
                </h3>
                <p className="text-sm" style={{ color: THEME.lightText }}>
                  Detailed metrics and counts for debugging purposes.
                </p>
                <div className="mt-4">
                  <p className="text-sm" style={{ color: THEME.lightText }}>
                    L1 Meter Count: {calculatedMetrics.debugInfo.l1Count}
                  </p>
                  <p className="text-sm" style={{ color: THEME.lightText }}>
                    L2 Meter Count: {calculatedMetrics.debugInfo.l2Count}
                  </p>
                  <p className="text-sm" style={{ color: THEME.lightText }}>
                    DC Meters from L1: {calculatedMetrics.debugInfo.dcFromL1Count}
                  </p>
                  <p className="text-sm" style={{ color: THEME.lightText }}>
                    L3 Meters for Total: {calculatedMetrics.debugInfo.l3ForTotalCount}
                  </p>
                  <p className="text-sm" style={{ color: THEME.lightText }}>
                    DC Meters for Total: {calculatedMetrics.debugInfo.dcForTotalCount}
                  </p>
                  <p className="text-sm" style={{ color: THEME.lightText }}>
                    Excluded L3 Value: {calculatedMetrics.debugInfo.excludedL3Value}
                  </p>
                </div>
              </div>
            </div>
          )}
        </main>

        {/* Footer Section */}
        <footer className="bg-white shadow mt-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 text-center">
            <p className="text-sm" style={{ color: THEME.lightText }}>
              &copy; {new Date().getFullYear()} Muscat Bay Water System. All rights reserved.
            </p>
          </div>
        </footer>
      </div>
    )
  }

  // If in summary mode, render just the dashboard overview
  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h2 className="text-3xl font-bold tracking-tight text-gray-800 dark:text-gray-200">Water System Management</h2>
        <div className="flex items-center space-x-2">
          <Badge
            variant="outline"
            className="text-blue-600 dark:text-blue-400 border-blue-300 dark:border-blue-700 bg-blue-50 dark:bg-blue-900/20"
          >
            <Droplet className="h-3 w-3 mr-1" />
            Connected to Database
          </Badge>
          <Button size="sm" onClick={() => console.log("View Full System")}>
            View Full System
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-5">
        <KPI_Card
          title="Total L1 Supply"
          value={`${formatNumber(calculatedMetrics.totalL1Supply)} m³`}
          description="Main Source Input"
          icon={Layers}
          theme={THEME}
          bgColor={THEME.primary}
        />
        <KPI_Card
          title="Total L3 Consumption"
          value={`${formatNumber(calculatedMetrics.totalL3Volume)} m³`}
          description="End User + DC"
          icon={Droplet}
          theme={THEME}
          bgColor={THEME.secondary}
        />
        <KPI_Card
          title="Total Loss (NRW)"
          value={`${formatPercentage(calculatedMetrics.totalLossPercentage)}`}
          description={`${formatNumber(calculatedMetrics.totalLoss)} m³ of L1`}
          icon={Percent}
          theme={THEME}
          bgColor={THEME.accent}
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6 transition-shadow hover:shadow-lg">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2" style={{ color: THEME.darkText }}>
            <Type className="h-5 w-5" style={{ color: THEME.accent }} /> L3 Consumption by Type
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
                    `${formatNumber(typeof value === 'number' ? value : 0)} m³ (${calculatedMetrics.totalL3Volume > 0 ? formatPercentage((typeof value === 'number' ? value : 0) / calculatedMetrics.totalL3Volume * 100) : "0.0%"})`,
                    name,
                  ]}
                />
                <Legend iconSize={10} wrapperStyle={{ fontSize: "12px", paddingTop: "15px" }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6 transition-shadow hover:shadow-lg">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2" style={{ color: THEME.darkText }}>
            <MapPin className="h-5 w-5" style={{ color: THEME.error }} /> Top 5 Losing Zones (Internal %)
          </h3>
          <div style={{ width: "100%", height: 300 }}>
            <ResponsiveContainer>
              <BarChart
                data={calculatedMetrics.topLosingZones}
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
                  {calculatedMetrics.topLosingZones.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={THEME.accent} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  )
}

export default WaterSystemSection
