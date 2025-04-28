
"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useWaterData } from "@/context/water-data-context"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { AlertTriangle, RefreshCw, MapPin, BarChart2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { BarChart } from "recharts"
import { CartesianGrid, XAxis, YAxis, Tooltip, Legend, Bar, ResponsiveContainer } from "recharts"

interface WaterZoneAnalysisProps {
  year: string
  month: string
}

export default function WaterZoneAnalysis({ year, month }: WaterZoneAnalysisProps) {
  const { data, loading, error, refreshData } = useWaterData()
  const [selectedZone, setSelectedZone] = useState<string>("All Zones")
  
  // Placeholder zone data for demonstration
  const zones = [
    { id: "all", name: "All Zones" },
    { id: "zone_01", name: "Zone 01" },
    { id: "zone_03a", name: "Zone 03A" },
    { id: "zone_03b", name: "Zone 03B" },
    { id: "zone_05", name: "Zone 05" },
  ]
  
  // Sample zone consumption data for the chart
  const zoneConsumptionData = [
    { name: "Zone 01", consumption: 3250 },
    { name: "Zone 03A", consumption: 4120 },
    { name: "Zone 03B", consumption: 2980 },
    { name: "Zone 05", consumption: 5340 },
    { name: "Other Zones", consumption: 1870 },
  ]

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-64 space-y-4">
        <LoadingSpinner size="lg" />
        <p className="text-gray-500 dark:text-gray-400">Loading zone analysis data...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
        <div className="flex items-start space-x-3">
          <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5" />
          <div>
            <h3 className="font-medium text-red-800 dark:text-red-300">Error Loading Data</h3>
            <p className="text-sm text-red-600 dark:text-red-400 mt-1">{error.message}</p>
            <Button
              size="sm"
              variant="outline"
              className="mt-3 text-red-600 border-red-300 hover:bg-red-50"
              onClick={refreshData}
            >
              <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
              Retry
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Zone Analysis</h2>
      <p className="text-muted-foreground">
        Showing: {month} {year} | Water Consumption by Zone
      </p>

      {/* Zone Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Zone Selection
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {zones.map(zone => (
              <Button
                key={zone.id}
                variant={selectedZone === zone.name ? "default" : "outline"}
                onClick={() => setSelectedZone(zone.name)}
                className="mb-2"
              >
                {zone.name}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Zone Consumption Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart2 className="h-5 w-5" />
            Water Consumption by Zone
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={zoneConsumptionData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip formatter={(value) => [`${value.toLocaleString()} m³`, 'Consumption']} />
                <Legend />
                <Bar dataKey="consumption" fill="#3b82f6" name="Consumption (m³)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Zone Details */}
      <Card>
        <CardHeader>
          <CardTitle>Zone Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
              <h3 className="text-sm font-medium text-blue-600 dark:text-blue-300">Total Consumption</h3>
              <p className="text-2xl font-bold">17,560 m³</p>
              <p className="text-sm text-gray-500">Across all zones</p>
            </div>
            <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
              <h3 className="text-sm font-medium text-green-600 dark:text-green-300">Highest Consuming Zone</h3>
              <p className="text-2xl font-bold">Zone 05</p>
              <p className="text-sm text-gray-500">5,340 m³ (30.4%)</p>
            </div>
            <div className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-lg">
              <h3 className="text-sm font-medium text-amber-600 dark:text-amber-300">Average Consumption</h3>
              <p className="text-2xl font-bold">3,512 m³</p>
              <p className="text-sm text-gray-500">Per zone</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
