"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { WaterDataProvider } from "@/context/water-data-context"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { MainHeader } from "@/components/main-header"

// Import the tab content components
import WaterOverview from "@/components/water-system/water-overview"
import WaterZoneAnalysis from "@/components/water-system/water-zone-analysis"
import WaterTypeAnalysis from "@/components/water-system/water-type-analysis"
import WaterLossAnalysis from "@/components/water-system/water-loss-analysis"

export default function WaterSystemPage() {
  const router = useRouter()
  const [selectedYear, setSelectedYear] = useState("2025")
  const [selectedMonth, setSelectedMonth] = useState("Mar")
  const [isRefreshing, setIsRefreshing] = useState(false)

  const handleRefresh = async () => {
    setIsRefreshing(true)
    // In a real app, you would refresh data here
    setTimeout(() => setIsRefreshing(false), 1000)
  }

  const handleExport = () => {
    console.log("Exporting data...")
    // Export functionality would go here
  }

  return (
    <WaterDataProvider>
      <div className="flex flex-col min-h-screen">
        <MainHeader
          title="Muscat Bay Operations - Water System"
          onRefresh={handleRefresh}
          onExport={handleExport}
          showControls={true}
        />

        <div className="container mx-auto p-4 flex-1 relative z-10">
          {/* Main content with tabs */}
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="mb-6">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="zone-analysis">Zone Analysis</TabsTrigger>
              <TabsTrigger value="by-type">By Type</TabsTrigger>
              <TabsTrigger value="loss-analysis">Loss Analysis</TabsTrigger>
            </TabsList>

            <TabsContent value="overview">
              <WaterOverview year={selectedYear} month={selectedMonth} />
            </TabsContent>

            <TabsContent value="zone-analysis">
              <WaterZoneAnalysis year={selectedYear} month={selectedMonth} />
            </TabsContent>

            <TabsContent value="by-type">
              <WaterTypeAnalysis year={selectedYear} month={selectedMonth} />
            </TabsContent>

            <TabsContent value="loss-analysis">
              <WaterLossAnalysis year={selectedYear} month={selectedMonth} />
            </TabsContent>
          </Tabs>
        </div>

        <footer className="bg-white shadow mt-8 py-4 text-center text-sm text-gray-500">
          © 2025 Muscat Bay Water System. All rights reserved.
        </footer>
      </div>
    </WaterDataProvider>
  )
}
