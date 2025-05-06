"use client"

import { useState, useEffect } from "react"
import { Activity, RefreshCw, Droplet, ArrowUpDown, AlertTriangle } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"

export function PumpingStations() {
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("live")

  // Simulate loading
  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false)
    }, 1500)
    return () => clearTimeout(timer)
  }, [])

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-gray-800 dark:text-gray-200">
            Pumping Stations / Lifting Stations
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center mt-1">
            <Activity className="h-4 w-4 mr-1.5 text-teal-500" />
            Monitor and control water pumping & lifting stations across the property
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button size="sm" variant="outline" className="flex items-center gap-1">
            <RefreshCw className="h-3.5 w-3.5" />
            Refresh
          </Button>
          <Button size="sm">System Controls</Button>
        </div>
      </div>

      {/* Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-teal-50 to-teal-100 dark:from-teal-900/30 dark:to-teal-950/40 shadow-lg rounded-lg border border-teal-200 dark:border-teal-800/50 transition-all duration-300 hover:shadow-xl">
          <CardHeader className="pb-2">
            <CardDescription className="text-gray-600 dark:text-gray-400">Total Stations</CardDescription>
            <CardTitle className="text-2xl font-bold text-teal-600 dark:text-teal-400">8</CardTitle>
          </CardHeader>
        </Card>
        <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/30 dark:to-green-950/40 shadow-lg rounded-lg border border-green-200 dark:border-green-800/50 transition-all duration-300 hover:shadow-xl">
          <CardHeader className="pb-2">
            <CardDescription className="text-gray-600 dark:text-gray-400">Active Stations</CardDescription>
            <CardTitle className="text-2xl font-bold text-green-600 dark:text-green-400">7</CardTitle>
          </CardHeader>
        </Card>
        <Card className="bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-900/30 dark:to-amber-950/40 shadow-lg rounded-lg border border-amber-200 dark:border-amber-800/50 transition-all duration-300 hover:shadow-xl">
          <CardHeader className="pb-2">
            <CardDescription className="text-gray-600 dark:text-gray-400">Current Flow Rate</CardDescription>
            <CardTitle className="text-2xl font-bold text-amber-600 dark:text-amber-400">425 m³/h</CardTitle>
          </CardHeader>
        </Card>
        <Card className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/30 dark:to-red-950/40 shadow-lg rounded-lg border border-red-200 dark:border-red-800/50 transition-all duration-300 hover:shadow-xl">
          <CardHeader className="pb-2">
            <CardDescription className="text-gray-600 dark:text-gray-400">Alerts</CardDescription>
            <CardTitle className="text-2xl font-bold text-red-600 dark:text-red-400">1</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Tabs for different views */}
      <Tabs defaultValue="live" className="w-full" onValueChange={setActiveTab}>
        <div className="flex justify-between items-center mb-4">
          <TabsList className="grid w-full max-w-md grid-cols-3">
            <TabsTrigger value="live">Live Monitoring</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
          </TabsList>
          <Badge
            variant="outline"
            className="text-teal-600 dark:text-teal-400 border-teal-300 dark:border-teal-700 bg-teal-50 dark:bg-teal-900/20"
          >
            <ArrowUpDown className="h-3 w-3 mr-1" />
            Live Data
          </Badge>
        </div>

        {/* Live Monitoring Tab */}
        <TabsContent value="live" className="mt-0">
          {/* Iframe Container Card */}
          <Card className="flex-grow bg-white dark:bg-gray-800 shadow-lg rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
            <CardContent className="p-0 h-[calc(100vh-400px)] min-h-[500px]">
              {loading ? (
                <div className="w-full h-full flex flex-col items-center justify-center p-6 space-y-4">
                  <Skeleton className="h-[300px] w-full rounded-lg" />
                  <div className="space-y-2 w-full">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                </div>
              ) : (
                <iframe
                  src="https://muscat-bay-pumping-stations.lovable.app/"
                  className="w-full h-full border-none block"
                  title="Pumping Stations Monitoring"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-downloads allow-modals"
                />
              )}
            </CardContent>
          </Card>

          {/* Alert Card */}
          <Card className="mt-6 bg-white dark:bg-gray-800 shadow-lg rounded-lg border border-gray-200 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-gray-700 dark:text-gray-300 flex items-center">
                <AlertTriangle className="h-5 w-5 mr-2 text-yellow-500" />
                Active Alerts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="p-4 bg-yellow-100 dark:bg-yellow-900/30 border border-yellow-300 dark:border-yellow-700 rounded-md text-yellow-800 dark:text-yellow-300 flex items-start space-x-3">
                <AlertTriangle className="h-5 w-5 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium">Warning: PS-02 reported minor flow discrepancy</p>
                  <p className="text-sm mt-1">Flow rate fluctuation detected: ±15% variance</p>
                  <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-2">Detected: 45 minutes ago</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="mt-0">
          <Card className="bg-white dark:bg-gray-800 shadow-lg rounded-lg border border-gray-200 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-gray-700 dark:text-gray-300">
                Performance Analytics
              </CardTitle>
              <CardDescription className="text-gray-500 dark:text-gray-400">
                Historical data and performance metrics for all pumping stations
              </CardDescription>
            </CardHeader>
            <CardContent className="h-[calc(100vh-400px)] min-h-[500px] flex items-center justify-center">
              <div className="text-center p-6">
                <Droplet className="h-16 w-16 text-teal-500 mx-auto mb-4 opacity-50" />
                <h3 className="text-xl font-medium text-gray-700 dark:text-gray-300 mb-2">Analytics Module</h3>
                <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto">
                  The analytics module is currently being developed and will be available soon. It will provide detailed
                  performance metrics and historical data analysis.
                </p>
                <Button className="mt-4" variant="outline">
                  Request Early Access
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Maintenance Tab */}
        <TabsContent value="maintenance" className="mt-0">
          <Card className="bg-white dark:bg-gray-800 shadow-lg rounded-lg border border-gray-200 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-gray-700 dark:text-gray-300">
                Maintenance Schedule
              </CardTitle>
              <CardDescription className="text-gray-500 dark:text-gray-400">
                Upcoming and past maintenance activities for all stations
              </CardDescription>
            </CardHeader>
            <CardContent className="h-[calc(100vh-400px)] min-h-[500px] flex items-center justify-center">
              <div className="text-center p-6">
                <Activity className="h-16 w-16 text-teal-500 mx-auto mb-4 opacity-50" />
                <h3 className="text-xl font-medium text-gray-700 dark:text-gray-300 mb-2">Maintenance Module</h3>
                <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto">
                  The maintenance module is currently being developed and will be available soon. It will provide
                  scheduling, tracking, and reporting for all maintenance activities.
                </p>
                <Button className="mt-4" variant="outline">
                  Request Early Access
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
