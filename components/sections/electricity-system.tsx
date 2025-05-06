"use client"

import { useRouter } from "next/navigation"
import { Zap, AlertTriangle, BatteryCharging, BarChart3, Lightbulb, ArrowRight } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { PieChart, AreaChart } from "@/components/ui/chart"
import { useElectricityData } from "@/context/electricity-data-context"

export function ElectricitySystem() {
  const router = useRouter()
  const { getCurrentData, isLoading } = useElectricityData()
  const currentData = getCurrentData()

  // Navigate to the detailed electricity system page
  const navigateToElectricitySystem = () => {
    router.push("/electricity-system")
  }

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h2 className="text-3xl font-bold tracking-tight text-gray-800 dark:text-gray-200">
          Electricity System Management
        </h2>
        <div className="flex items-center space-x-2">
          <Badge
            variant="outline"
            className="text-yellow-600 dark:text-yellow-400 border-yellow-300 dark:border-yellow-700 bg-yellow-50 dark:bg-yellow-900/20"
          >
            <AlertTriangle className="h-3 w-3 mr-1" />
            Connected to Database
          </Badge>
          <Button size="sm" onClick={navigateToElectricitySystem}>
            View Full System
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Key Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-900/30 dark:to-amber-950/40 shadow-lg rounded-lg border border-amber-200 dark:border-amber-800/50 transition-all duration-300 hover:shadow-xl group">
          <CardHeader className="pb-2">
            <CardDescription className="text-gray-600 dark:text-gray-400 flex items-center">
              <Zap className="h-4 w-4 mr-1 text-amber-500" />
              Total Consumption
            </CardDescription>
            <CardTitle className="text-2xl font-bold text-amber-600 dark:text-amber-400 flex items-center justify-between">
              {currentData.mainSupply.toLocaleString()} kWh
              <span className="text-xs font-normal text-amber-500 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/50 px-2 py-1 rounded-full">
                Monthly
              </span>
            </CardTitle>
          </CardHeader>
        </Card>
        <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/30 dark:to-green-950/40 shadow-lg rounded-lg border border-green-200 dark:border-green-800/50 transition-all duration-300 hover:shadow-xl group">
          <CardHeader className="pb-2">
            <CardDescription className="text-gray-600 dark:text-gray-400 flex items-center">
              <BatteryCharging className="h-4 w-4 mr-1 text-green-500" />
              Solar Generation
            </CardDescription>
            <CardTitle className="text-2xl font-bold text-green-600 dark:text-green-400 flex items-center justify-between">
              {currentData.solarGeneration.toLocaleString()} kWh
              <span className="text-xs font-normal text-green-500 dark:text-green-400 bg-green-100 dark:bg-green-900/50 px-2 py-1 rounded-full">
                {((currentData.solarGeneration / currentData.mainSupply) * 100).toFixed(1)}% of Total
              </span>
            </CardTitle>
          </CardHeader>
        </Card>
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-950/40 shadow-lg rounded-lg border border-blue-200 dark:border-blue-800/50 transition-all duration-300 hover:shadow-xl group">
          <CardHeader className="pb-2">
            <CardDescription className="text-gray-600 dark:text-gray-400 flex items-center">
              <Lightbulb className="h-4 w-4 mr-1 text-blue-500" />
              Peak Load
            </CardDescription>
            <CardTitle className="text-2xl font-bold text-blue-600 dark:text-blue-400 flex items-center justify-between">
              {currentData.peakLoad.toLocaleString()} kW
              <span className="text-xs font-normal text-blue-500 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/50 px-2 py-1 rounded-full">
                Maximum Demand
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
              <BarChart3 className="h-5 w-5 mr-2 text-amber-500" />
              Monthly Electricity Consumption (kWh)
            </CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            <AreaChart
              data={
                // Create trend data for the current year
                [
                  { month: "Jan", consumption: 165000, solar: 33000, grid: 132000 },
                  { month: "Feb", consumption: 158000, solar: 31600, grid: 126400 },
                  { month: "Mar", consumption: 172000, solar: 34400, grid: 137600 },
                ]
              }
              index="month"
              categories={["consumption", "solar", "grid"]}
              colors={["amber", "green", "blue"]}
              valueFormatter={(value) => `${value.toLocaleString()} kWh`}
              yAxisWidth={80}
            />
          </CardContent>
          <CardFooter className="border-t border-gray-200 dark:border-gray-700 pt-4">
            <Button variant="outline" size="sm" className="w-full" onClick={navigateToElectricitySystem}>
              View Detailed Analysis
            </Button>
          </CardFooter>
        </Card>

        {/* Chart Card: Energy Source Mix */}
        <Card className="bg-white dark:bg-gray-800 shadow-lg rounded-lg border border-gray-200 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-700 dark:text-gray-300 flex items-center">
              <BatteryCharging className="h-5 w-5 mr-2 text-green-500" />
              Energy Source Mix
            </CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            <PieChart
              data={[
                { name: "Grid", value: currentData.gridConsumption },
                { name: "Solar", value: currentData.solarGeneration },
              ]}
              category="value"
              index="name"
              colors={["blue", "green"]}
              valueFormatter={(value) => `${value.toLocaleString()} kWh`}
              className="h-full"
            />
          </CardContent>
          <CardFooter className="border-t border-gray-200 dark:border-gray-700 pt-4">
            <Button variant="outline" size="sm" className="w-full" onClick={navigateToElectricitySystem}>
              View Energy Sources
            </Button>
          </CardFooter>
        </Card>
      </div>

      {/* System Status Overview */}
      <Card className="bg-white dark:bg-gray-800 shadow-lg rounded-lg border border-gray-200 dark:border-gray-700">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-700 dark:text-gray-300 flex items-center">
            <AlertTriangle className="h-5 w-5 mr-2 text-yellow-500" />
            System Status
          </CardTitle>
          <CardDescription className="text-gray-500 dark:text-gray-400">
            Current status of electrical systems
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="p-4 bg-yellow-100 dark:bg-yellow-900/30 border border-yellow-300 dark:border-yellow-700 rounded-md text-yellow-800 dark:text-yellow-300 flex items-start space-x-3">
            <AlertTriangle className="h-5 w-5 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium">Warning: High load detected at Substation Gamma</p>
              <p className="text-sm mt-1">Current load: 380 kW (95% of capacity)</p>
              <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-2">Detected: 25 minutes ago</p>
            </div>
          </div>
        </CardContent>
        <CardFooter className="border-t border-gray-200 dark:border-gray-700 pt-4 flex justify-between">
          <Button variant="outline" size="sm" onClick={navigateToElectricitySystem}>
            View Alert History
          </Button>
          <Button size="sm" onClick={navigateToElectricitySystem}>
            Manage System
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
