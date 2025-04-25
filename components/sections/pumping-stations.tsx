"use client"

import { useState, useEffect } from "react"
import { Activity, RefreshCw } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
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

      {/* Tabs for different views */}
      <Tabs defaultValue="live" className="w-full" onValueChange={setActiveTab}>
        <TabsList className="grid w-full max-w-md grid-cols-3">
          <TabsTrigger value="live">Live Monitoring</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
        </TabsList>

        {/* Live Monitoring Tab */}
        <TabsContent value="live" className="mt-4">
          {/* Iframe Container Card */}
          <Card className="flex-grow bg-white dark:bg-gray-800 shadow-lg rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
            <CardContent className="p-0 h-[calc(100vh-250px)] min-h-[600px]">
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
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="mt-4">
          <Card className="bg-white dark:bg-gray-800 shadow-lg rounded-lg border border-gray-200 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-gray-700 dark:text-gray-300">
                Performance Analytics
              </CardTitle>
              <CardDescription className="text-gray-500 dark:text-gray-400">
                Historical data and performance metrics for all pumping stations
              </CardDescription>
            </CardHeader>
            <CardContent className="h-[calc(100vh-250px)] min-h-[600px] flex items-center justify-center">
              <div className="text-center p-6">
                <Activity className="h-16 w-16 text-teal-500 mx-auto mb-4 opacity-50" />
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
        <TabsContent value="maintenance" className="mt-4">
          <Card className="bg-white dark:bg-gray-800 shadow-lg rounded-lg border border-gray-200 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-gray-700 dark:text-gray-300">
                Maintenance Schedule
              </CardTitle>
              <CardDescription className="text-gray-500 dark:text-gray-400">
                Upcoming and past maintenance activities for all stations
              </CardDescription>
            </CardHeader>
            <CardContent className="h-[calc(100vh-250px)] min-h-[600px] flex items-center justify-center">
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
