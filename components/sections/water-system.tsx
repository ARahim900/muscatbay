"use client"
import { Droplet, AlertTriangle, Gauge, Filter, Waves, BarChart3 } from "lucide-react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { LineChart, BarChart, PieChart } from "@/components/ui/chart"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

// Example Water Data
const waterSystemData = [
  { month: "Jan", consumption: 4000, pressure: 3.5 },
  { month: "Feb", consumption: 3000, pressure: 3.6 },
  { month: "Mar", consumption: 5000, pressure: 3.4 },
  { month: "Apr", consumption: 4500, pressure: 3.7 },
  { month: "May", consumption: 6000, pressure: 3.5 },
  { month: "Jun", consumption: 5500, pressure: 3.8 },
]

const waterQualityData = [
  { name: "Potable", value: 85 },
  { name: "Non-Potable", value: 15 },
]

const waterZoneData = [
  { id: 1, zone: "Zone A", status: "Normal", pressure: 3.6, flow: 120, lastUpdated: "10 min ago" },
  { id: 2, zone: "Zone B", status: "Warning", pressure: 2.8, flow: 95, lastUpdated: "5 min ago" },
  { id: 3, zone: "Zone C", status: "Normal", pressure: 3.7, flow: 110, lastUpdated: "12 min ago" },
  { id: 4, zone: "Zone D", status: "Normal", pressure: 3.5, flow: 105, lastUpdated: "8 min ago" },
]

export function WaterSystem() {
  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h2 className="text-3xl font-bold tracking-tight text-gray-800 dark:text-gray-200">Water System Management</h2>
        <div className="flex items-center space-x-2">
          <Badge
            variant="outline"
            className="text-yellow-600 dark:text-yellow-400 border-yellow-300 dark:border-yellow-700 bg-yellow-50 dark:bg-yellow-900/20"
          >
            <AlertTriangle className="h-3 w-3 mr-1" />1 Active Alert
          </Badge>
          <Button size="sm" variant="outline">
            System Controls
          </Button>
        </div>
      </div>

      {/* Key Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-950/40 shadow-lg rounded-lg border border-blue-200 dark:border-blue-800/50 transition-all duration-300 hover:shadow-xl group">
          <CardHeader className="pb-2">
            <CardDescription className="text-gray-600 dark:text-gray-400 flex items-center">
              <Droplet className="h-4 w-4 mr-1 text-blue-500" />
              Avg. Daily Consumption
            </CardDescription>
            <CardTitle className="text-2xl font-bold text-blue-600 dark:text-blue-400 flex items-center justify-between">
              180 m³
              <span className="text-xs font-normal text-blue-500 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/50 px-2 py-1 rounded-full">
                +5% from last month
              </span>
            </CardTitle>
          </CardHeader>
        </Card>
        <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/30 dark:to-green-950/40 shadow-lg rounded-lg border border-green-200 dark:border-green-800/50 transition-all duration-300 hover:shadow-xl group">
          <CardHeader className="pb-2">
            <CardDescription className="text-gray-600 dark:text-gray-400 flex items-center">
              <Gauge className="h-4 w-4 mr-1 text-green-500" />
              Current Avg. Pressure
            </CardDescription>
            <CardTitle className="text-2xl font-bold text-green-600 dark:text-green-400 flex items-center justify-between">
              3.6 Bar
              <span className="text-xs font-normal text-green-500 dark:text-green-400 bg-green-100 dark:bg-green-900/50 px-2 py-1 rounded-full">
                Optimal Range
              </span>
            </CardTitle>
          </CardHeader>
        </Card>
        <Card className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/30 dark:to-red-950/40 shadow-lg rounded-lg border border-red-200 dark:border-red-800/50 transition-all duration-300 hover:shadow-xl group">
          <CardHeader className="pb-2">
            <CardDescription className="text-gray-600 dark:text-gray-400 flex items-center">
              <AlertTriangle className="h-4 w-4 mr-1 text-red-500" />
              Active Alerts
            </CardDescription>
            <CardTitle className="text-2xl font-bold text-red-600 dark:text-red-400 flex items-center justify-between">
              1
              <span className="text-xs font-normal text-red-500 dark:text-red-400 bg-red-100 dark:bg-red-900/50 px-2 py-1 rounded-full">
                Zone B - Low Pressure
              </span>
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart Card: Monthly Consumption */}
        <Card className="bg-white dark:bg-gray-800 shadow-lg rounded-lg border border-gray-200 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-700 dark:text-gray-300 flex items-center">
              <BarChart3 className="h-5 w-5 mr-2 text-blue-500" />
              Monthly Water Consumption (m³)
            </CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            <BarChart
              data={waterSystemData}
              index="month"
              categories={["consumption"]}
              colors={["blue"]}
              valueFormatter={(value) => `${value.toLocaleString()} m³`}
              yAxisWidth={60}
            />
          </CardContent>
        </Card>

        {/* Chart Card: Monthly Pressure */}
        <Card className="bg-white dark:bg-gray-800 shadow-lg rounded-lg border border-gray-200 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-700 dark:text-gray-300 flex items-center">
              <Gauge className="h-5 w-5 mr-2 text-green-500" />
              Monthly Average Water Pressure (Bar)
            </CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            <LineChart
              data={waterSystemData}
              index="month"
              categories={["pressure"]}
              colors={["green"]}
              valueFormatter={(value) => `${value.toFixed(1)} Bar`}
              yAxisWidth={60}
            />
          </CardContent>
        </Card>

        {/* Chart Card: Water Quality */}
        <Card className="bg-white dark:bg-gray-800 shadow-lg rounded-lg border border-gray-200 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-700 dark:text-gray-300 flex items-center">
              <Filter className="h-5 w-5 mr-2 text-purple-500" />
              Water Quality Distribution
            </CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            <PieChart
              data={waterQualityData}
              category="value"
              index="name"
              colors={["cyan", "orange"]}
              valueFormatter={(value) => `${value}%`}
              className="h-full"
            />
          </CardContent>
        </Card>

        {/* Zone Status Table */}
        <Card className="bg-white dark:bg-gray-800 shadow-lg rounded-lg border border-gray-200 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-700 dark:text-gray-300 flex items-center">
              <Waves className="h-5 w-5 mr-2 text-blue-500" />
              Zone Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Zone</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Pressure</TableHead>
                  <TableHead>Flow Rate</TableHead>
                  <TableHead className="text-right">Last Updated</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {waterZoneData.map((zone) => (
                  <TableRow key={zone.id}>
                    <TableCell className="font-medium">{zone.zone}</TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={
                          zone.status === "Normal"
                            ? "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 border-green-200 dark:border-green-800/50"
                            : "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800/50"
                        }
                      >
                        {zone.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{zone.pressure} Bar</TableCell>
                    <TableCell>{zone.flow} m³/h</TableCell>
                    <TableCell className="text-right text-gray-500 dark:text-gray-400 text-sm">
                      {zone.lastUpdated}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* System Alerts Section */}
      <Card className="bg-white dark:bg-gray-800 shadow-lg rounded-lg border border-gray-200 dark:border-gray-700">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-700 dark:text-gray-300 flex items-center">
            <AlertTriangle className="h-5 w-5 mr-2 text-yellow-500" />
            System Alerts
          </CardTitle>
          <CardDescription className="text-gray-500 dark:text-gray-400">
            Current active alerts in the water system
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="p-4 bg-yellow-100 dark:bg-yellow-900/30 border border-yellow-300 dark:border-yellow-700 rounded-md text-yellow-800 dark:text-yellow-300 flex items-start space-x-3">
            <AlertTriangle className="h-5 w-5 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium">Warning: Low pressure detected in Zone B - Pump Station 2</p>
              <p className="text-sm mt-1">Pressure reading: 2.8 Bar (below threshold of 3.0 Bar)</p>
              <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-2">Detected: 35 minutes ago</p>
            </div>
          </div>
        </CardContent>
        <CardFooter className="border-t border-gray-200 dark:border-gray-700 pt-4 flex justify-between">
          <Button variant="outline" size="sm">
            View Alert History
          </Button>
          <Button size="sm">Acknowledge Alert</Button>
        </CardFooter>
      </Card>
    </div>
  )
}
