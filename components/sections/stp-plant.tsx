"use client"

import { useState, useEffect } from "react"
import { Recycle, RefreshCw, AlertTriangle, BarChart3, Droplets } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"

export function STPPlant() {
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("overview")

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
            Sewage Treatment Plant (STP)
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center mt-1">
            <Recycle className="h-4 w-4 mr-1.5 text-green-500" />
            Monitor and control STP operations and water recycling
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
        <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/30 dark:to-green-950/40 shadow-lg rounded-lg border border-green-200 dark:border-green-800/50 transition-all duration-300 hover:shadow-xl">
          <CardHeader className="pb-2">
            <CardDescription className="text-gray-600 dark:text-gray-400">Plant Status</CardDescription>
            <CardTitle className="text-2xl font-bold text-green-600 dark:text-green-400">Operational</CardTitle>
          </CardHeader>
        </Card>
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-950/40 shadow-lg rounded-lg border border-blue-200 dark:border-blue-800/50 transition-all duration-300 hover:shadow-xl">
          <CardHeader className="pb-2">
            <CardDescription className="text-gray-600 dark:text-gray-400">Daily Processing</CardDescription>
            <CardTitle className="text-2xl font-bold text-blue-600 dark:text-blue-400">1,250 m³</CardTitle>
          </CardHeader>
        </Card>
        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/30 dark:to-purple-950/40 shadow-lg rounded-lg border border-purple-200 dark:border-purple-800/50 transition-all duration-300 hover:shadow-xl">
          <CardHeader className="pb-2">
            <CardDescription className="text-gray-600 dark:text-gray-400">Recycled Water</CardDescription>
            <CardTitle className="text-2xl font-bold text-purple-600 dark:text-purple-400">980 m³</CardTitle>
          </CardHeader>
        </Card>
        <Card className="bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-900/30 dark:to-amber-950/40 shadow-lg rounded-lg border border-amber-200 dark:border-amber-800/50 transition-all duration-300 hover:shadow-xl">
          <CardHeader className="pb-2">
            <CardDescription className="text-gray-600 dark:text-gray-400">Efficiency</CardDescription>
            <CardTitle className="text-2xl font-bold text-amber-600 dark:text-amber-400">78.4%</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Tabs for different views */}
      <Tabs defaultValue="overview" className="w-full" onValueChange={setActiveTab}>
        <div className="flex justify-between items-center mb-4">
          <TabsList className="grid w-full max-w-md grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="quality">Water Quality</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
          </TabsList>
          <Badge
            variant="outline"
            className="text-green-600 dark:text-green-400 border-green-300 dark:border-green-700 bg-green-50 dark:bg-green-900/20"
          >
            <Droplets className="h-3 w-3 mr-1" />
            Database Connected
          </Badge>
        </div>

        {/* Overview Tab */}
        <TabsContent value="overview" className="mt-0">
          <Card className="bg-white dark:bg-gray-800 shadow-lg rounded-lg border border-gray-200 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-gray-700 dark:text-gray-300">
                STP System Overview
              </CardTitle>
              <CardDescription className="text-gray-500 dark:text-gray-400">
                Current status and performance metrics
              </CardDescription>
            </CardHeader>
            <CardContent className="h-[calc(100vh-400px)] min-h-[500px]">
              {loading ? (
                <div className="w-full h-full flex flex-col items-center justify-center p-6 space-y-4">
                  <Skeleton className="h-[300px] w-full rounded-lg" />
                  <div className="space-y-2 w-full">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                </div>
              ) : (
                <div className="text-center p-6">
                  <Recycle className="h-16 w-16 text-green-500 mx-auto mb-4 opacity-50" />
                  <h3 className="text-xl font-medium text-gray-700 dark:text-gray-300 mb-2">
                    STP Database Integration
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto">
                    The STP monitoring system is ready to be connected to your database. Upload your STP data to enable
                    real-time monitoring and analytics.
                  </p>
                  <Button className="mt-4">Connect STP Database</Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Other tabs */}
        {["quality", "analytics", "maintenance"].map((tab) => (
          <TabsContent key={tab} value={tab} className="mt-0">
            <Card className="bg-white dark:bg-gray-800 shadow-lg rounded-lg border border-gray-200 dark:border-gray-700">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-gray-700 dark:text-gray-300">
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </CardTitle>
                <CardDescription className="text-gray-500 dark:text-gray-400">
                  {tab === "quality"
                    ? "Water quality parameters and testing results"
                    : tab === "analytics"
                      ? "Performance analytics and historical data"
                      : "Maintenance schedule and history"}
                </CardDescription>
              </CardHeader>
              <CardContent className="h-[calc(100vh-400px)] min-h-[500px] flex items-center justify-center">
                <div className="text-center p-6">
                  {tab === "quality" ? (
                    <Droplets className="h-16 w-16 text-blue-500 mx-auto mb-4 opacity-50" />
                  ) : tab === "analytics" ? (
                    <BarChart3 className="h-16 w-16 text-purple-500 mx-auto mb-4 opacity-50" />
                  ) : (
                    <AlertTriangle className="h-16 w-16 text-amber-500 mx-auto mb-4 opacity-50" />
                  )}
                  <h3 className="text-xl font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {tab.charAt(0).toUpperCase() + tab.slice(1)} Module
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto">
                    This module is ready to be connected to your STP database. Upload your data to enable full
                    functionality.
                  </p>
                  <Button className="mt-4" variant="outline">
                    Connect Data
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}
