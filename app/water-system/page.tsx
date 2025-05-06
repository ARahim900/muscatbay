"use client"

import { useState } from "react"
import { useWaterData } from "@/context/water-data-context"
import { WaterLossCalculator } from "@/components/water-system/water-loss-calculator"
import { ZoneAnalysis } from "@/components/water-system/zone-analysis"
import { TypeAnalysis } from "@/components/water-system/type-analysis"
import { LossAnalysis } from "@/components/water-system/loss-analysis"
import { WaterHierarchyVisualization } from "@/components/water-system/water-hierarchy-visualization"
import { ErrorBoundary } from "@/components/water-system/error-boundary"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { ErrorAlert } from "@/components/ui/error-alert"
import { TabButton } from "@/components/ui/tab-button"
import { Dropdown } from "@/components/ui/dropdown"
import { Button } from "@/components/ui/button"
import { Calendar, RefreshCw, ArrowLeft } from "lucide-react"

export default function WaterSystemPage() {
  const [activeTab, setActiveTab] = useState("overview")
  const [isRefreshing, setIsRefreshing] = useState(false)

  const {
    isLoading,
    error,
    selectedYear,
    selectedMonth,
    setSelectedYear,
    setSelectedMonth,
    getCurrentData,
    getMonthOptions,
    getYearOptions,
    refreshData,
  } = useWaterData()

  // Handle refresh button click
  const handleRefresh = async () => {
    setIsRefreshing(true)
    try {
      await refreshData()
    } finally {
      setTimeout(() => setIsRefreshing(false), 800)
    }
  }

  return (
    <ErrorBoundary
      onReset={handleRefresh}
      fallback={
        <div className="p-6">
          <ErrorAlert
            title="Something went wrong"
            message="An error occurred while loading the water system dashboard. Please try again."
            onRetry={handleRefresh}
          />
        </div>
      }
    >
      <div className="p-6 space-y-6 animate-fade-in">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="flex items-center gap-1"
              onClick={() => window.history.back()}
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
            <h2 className="text-3xl font-bold tracking-tight text-gray-800 dark:text-gray-200">
              Water System Management
            </h2>
          </div>
          <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-2">
              <Dropdown value={selectedYear} options={getYearOptions()} onChange={setSelectedYear} />
              <Dropdown value={selectedMonth.toLowerCase()} options={getMonthOptions()} onChange={setSelectedMonth} />
              <Button size="sm" variant="outline" onClick={handleRefresh} disabled={isRefreshing}>
                <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
                Refresh
              </Button>
            </div>
            <Button size="sm" variant="outline">
              <Calendar className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex justify-center items-center p-12">
            <LoadingSpinner size="lg" />
          </div>
        )}

        {/* Error State */}
        {error && !isLoading && (
          <div className="p-6">
            <ErrorAlert
              title="Data Loading Error"
              message={`Failed to load water system data: ${error.message}`}
              onRetry={handleRefresh}
            />
          </div>
        )}

        {/* Content when data is loaded */}
        {!isLoading && !error && (
          <>
            {/* Tab Navigation */}
            <div className="border-b border-gray-200 dark:border-gray-800">
              <div className="flex overflow-x-auto">
                <TabButton active={activeTab === "overview"} onClick={() => setActiveTab("overview")}>
                  Overview
                </TabButton>
                <TabButton active={activeTab === "zones"} onClick={() => setActiveTab("zones")}>
                  Zone Analysis
                </TabButton>
                <TabButton active={activeTab === "types"} onClick={() => setActiveTab("types")}>
                  Type Analysis
                </TabButton>
                <TabButton active={activeTab === "losses"} onClick={() => setActiveTab("losses")}>
                  Loss Analysis
                </TabButton>
                <TabButton active={activeTab === "hierarchy"} onClick={() => setActiveTab("hierarchy")}>
                  System Hierarchy
                </TabButton>
              </div>
            </div>

            {/* Tab Content */}
            {activeTab === "overview" && (
              <div className="space-y-6">
                <WaterLossCalculator />
                {/* Other overview components would go here */}
              </div>
            )}

            {activeTab === "zones" && <ZoneAnalysis setActiveTab={setActiveTab} />}
            {activeTab === "types" && <TypeAnalysis setActiveTab={setActiveTab} />}
            {activeTab === "losses" && <LossAnalysis setActiveTab={setActiveTab} />}
            {activeTab === "hierarchy" && <WaterHierarchyVisualization setActiveTab={setActiveTab} />}
          </>
        )}
      </div>
    </ErrorBoundary>
  )
}
