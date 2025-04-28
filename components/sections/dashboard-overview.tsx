"use client"

import { useState, useEffect } from "react"
import { Droplet, Zap, Settings, Users, Activity, AlertTriangle, TrendingUp, TrendingDown } from "lucide-react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { LineChart, BarChart, PieChart } from "@/components/ui/chart"

// Mock data for dashboard
const kpiData = {
  water: {
    usage: 5500,
    change: 5,
    trend: "up",
    unit: "m³",
  },
  electricity: {
    usage: 16000,
    change: 3,
    trend: "up",
    unit: "kWh",
  },
  maintenance: {
    active: 12,
    overdue: 3,
  },
  alerts: {
    critical: 1,
    warning: 2,
    info: 4,
  },
}

const activityFeed = [
  {
    id: 1,
    icon: Droplet,
    color: "text-blue-500",
    message: "Water pressure alert in Zone A resolved.",
    timestamp: "2 hours ago",
  },
  {
    id: 2,
    icon: Settings,
    color: "text-green-500",
    message: "Scheduled HVAC maintenance completed for Block C.",
    timestamp: "4 hours ago",
  },
  {
    id: 3,
    icon: Users,
    color: "text-purple-500",
    message: "New contractor 'Alpha Services' added.",
    timestamp: "Yesterday",
  },
  {
    id: 4,
    icon: Zap,
    color: "text-yellow-500",
    message: "Electricity consumption spike detected at Pumping Station 1.",
    timestamp: "Yesterday",
  },
  {
    id: 5,
    icon: Activity,
    color: "text-teal-500",
    message: "PS-02 reported minor flow discrepancy.",
    timestamp: "2 days ago",
  },
]

// Chart data
const consumptionData = [
  {
    name: "Jan",
    water: 4000,
    electricity: 12000,
  },
  {
    name: "Feb",
    water: 3000,
    electricity: 11000,
  },
  {
    name: "Mar",
    water: 5000,
    electricity: 14000,
  },
  {
    name: "Apr",
    water: 4500,
    electricity: 13500,
  },
  {
    name: "May",
    water: 6000,
    electricity: 15500,
  },
  {
    name: "Jun",
    water: 5500,
    electricity: 16000,
  },
]

const alertsBySystemData = [
  { name: "Water", value: 3 },
  { name: "Electricity", value: 2 },
  { name: "HVAC", value: 4 },
  { name: "STP", value: 1 },
]

export function DashboardOverview() {
  const [progress, setProgress] = useState(13)

  useEffect(() => {
    const timer = setTimeout(() => setProgress(66), 500)
    return () => clearTimeout(timer)
  }, [])

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h2 className="text-3xl font-bold tracking-tight text-gray-800 dark:text-gray-200">Dashboard Overview</h2>
        <div className="flex items-center space-x-2">
          <Badge
            variant="outline"
            className="text-yellow-600 dark:text-yellow-400 border-yellow-300 dark:border-yellow-700 bg-yellow-50 dark:bg-yellow-900/20"
          >
            <AlertTriangle className="h-3 w-3 mr-1" />3 Active Alerts
          </Badge>
          <Button size="sm" variant="outline">
            View All
          </Button>
        </div>
      </div>

      {/* KPI Cards Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Water Consumption KPI Card */}
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-950/40 shadow-lg rounded-lg border border-blue-200 dark:border-blue-800/50 transition-all duration-300 hover:shadow-xl group">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-blue-700 dark:text-blue-300">Water Usage (MTD)</CardTitle>
            <div className="h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-800/50 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Droplet className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {kpiData.water.usage.toLocaleString()} {kpiData.water.unit}
            </div>
            <div className="flex items-center mt-1">
              {kpiData.water.trend === "up" ? (
                <TrendingUp className="h-3 w-3 text-red-500 mr-1" />
              ) : (
                <TrendingDown className="h-3 w-3 text-green-500 mr-1" />
              )}
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {kpiData.water.trend === "up" ? "+" : "-"}
                {kpiData.water.change}% from last month
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Electricity Usage KPI Card */}
        <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900/30 dark:to-yellow-950/40 shadow-lg rounded-lg border border-yellow-200 dark:border-yellow-800/50 transition-all duration-300 hover:shadow-xl group">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-yellow-700 dark:text-yellow-300">
              Electricity Usage (MTD)
            </CardTitle>
            <div className="h-8 w-8 rounded-full bg-yellow-100 dark:bg-yellow-800/50 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Zap className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {kpiData.electricity.usage.toLocaleString()} {kpiData.electricity.unit}
            </div>
            <div className="flex items-center mt-1">
              {kpiData.electricity.trend === "up" ? (
                <TrendingUp className="h-3 w-3 text-red-500 mr-1" />
              ) : (
                <TrendingDown className="h-3 w-3 text-green-500 mr-1" />
              )}
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {kpiData.electricity.trend === "up" ? "+" : "-"}
                {kpiData.electricity.change}% from last month
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Maintenance Tasks KPI Card */}
        <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/30 dark:to-green-950/40 shadow-lg rounded-lg border border-green-200 dark:border-green-800/50 transition-all duration-300 hover:shadow-xl group">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-green-700 dark:text-green-300">
              Active Maintenance Tasks
            </CardTitle>
            <div className="h-8 w-8 rounded-full bg-green-100 dark:bg-green-800/50 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Settings className="h-4 w-4 text-green-600 dark:text-green-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{kpiData.maintenance.active}</div>
            <div className="flex items-center mt-1">
              <p className="text-xs text-red-500 dark:text-red-400">{kpiData.maintenance.overdue} overdue</p>
            </div>
            <Progress value={progress} className="h-1 mt-2" />
          </CardContent>
        </Card>

        {/* Alerts KPI Card */}
        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/30 dark:to-purple-950/40 shadow-lg rounded-lg border border-purple-200 dark:border-purple-800/50 transition-all duration-300 hover:shadow-xl group">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-purple-700 dark:text-purple-300">System Alerts</CardTitle>
            <div className="h-8 w-8 rounded-full bg-purple-100 dark:bg-purple-800/50 flex items-center justify-center group-hover:scale-110 transition-transform">
              <AlertTriangle className="h-4 w-4 text-purple-600 dark:text-purple-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {kpiData.alerts.critical + kpiData.alerts.warning + kpiData.alerts.info}
            </div>
            <div className="flex items-center space-x-2 mt-1">
              <Badge variant="destructive" className="text-[10px] h-4">
                {kpiData.alerts.critical} Critical
              </Badge>
              <Badge
                variant="outline"
                className="text-[10px] h-4 bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800/50"
              >
                {kpiData.alerts.warning} Warning
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts and Activity Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Charts */}
        <Card className="lg:col-span-2 bg-white dark:bg-gray-800 shadow-lg rounded-lg border border-gray-200 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="text-xl font-semibold text-gray-800 dark:text-gray-200">
              Resource Consumption
            </CardTitle>
            <CardDescription className="text-gray-500 dark:text-gray-400">
              Monthly water and electricity usage trends
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="chart" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="chart">Line Chart</TabsTrigger>
                <TabsTrigger value="bar">Bar Chart</TabsTrigger>
                <TabsTrigger value="pie">Distribution</TabsTrigger>
              </TabsList>
              <TabsContent value="chart" className="h-[300px] mt-4">
                <LineChart
                  data={consumptionData}
                  index="name"
                  categories={["water", "electricity"]}
                  colors={["blue", "amber"]}
                  valueFormatter={(value) => `${value.toLocaleString()}`}
                  yAxisWidth={60}
                />
              </TabsContent>
              <TabsContent value="bar" className="h-[300px] mt-4">
                <BarChart
                  data={consumptionData}
                  index="name"
                  categories={["water", "electricity"]}
                  colors={["blue", "amber"]}
                  valueFormatter={(value) => `${value.toLocaleString()}`}
                  yAxisWidth={60}
                />
              </TabsContent>
              <TabsContent value="pie" className="h-[300px] mt-4">
                <PieChart
                  data={[
                    { name: "Type 1", value: 42 },
                    { name: "Type 2", value: 28 },
                    { name: "Type 3", value: 18 },
                  ]}
                  valueKey="value"
                  categoryKey="name"
                  index="name"
                  categories={["value"]}
                  colors={["blue", "green", "amber"]}
                  valueFormatter={(value: number) => `${value}%`}
                  className="h-full"
                />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Recent Activity Feed Section */}
        <Card className="bg-white dark:bg-gray-800 shadow-lg rounded-lg border border-gray-200 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="text-xl font-semibold text-gray-800 dark:text-gray-200">Recent Activity</CardTitle>
            <CardDescription className="text-gray-500 dark:text-gray-400">
              Latest updates and system events
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {activityFeed.map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-start space-x-3 animate-fade-in-up"
                  style={{ animationDelay: `${activity.id * 100}ms` }}
                >
                  <div
                    className={`mt-0.5 h-8 w-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center ${activity.color.replace("text-", "bg-").replace("500", "100")} dark:${activity.color.replace("text-", "bg-").replace("500", "900")}/30`}
                  >
                    <activity.icon className={`h-4 w-4 ${activity.color}`} />
                  </div>
                  <div className="flex-1 space-y-1">
                    <p className="text-sm text-gray-700 dark:text-gray-300">{activity.message}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{activity.timestamp}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
          <CardFooter className="border-t border-gray-200 dark:border-gray-700 pt-4">
            <Button variant="outline" size="sm" className="w-full">
              View All Activity
            </Button>
          </CardFooter>
        </Card>
      </div>

      {/* System Status Overview */}
      <Card className="bg-white dark:bg-gray-800 shadow-lg rounded-lg border border-gray-200 dark:border-gray-700">
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-gray-800 dark:text-gray-200">
            System Status Overview
          </CardTitle>
          <CardDescription className="text-gray-500 dark:text-gray-400">
            Current status of all major systems
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-lg border border-green-200 dark:border-green-800/50 bg-green-50 dark:bg-green-900/20">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Droplet className="h-5 w-5 text-green-600 dark:text-green-400 mr-2" />
                  <span className="font-medium text-green-800 dark:text-green-300">Water System</span>
                </div>
                <Badge
                  variant="outline"
                  className="bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-300 border-green-200 dark:border-green-800/50"
                >
                  Operational
                </Badge>
              </div>
              <Progress
                value={92}
                className="h-1 mt-3 bg-green-200 dark:bg-green-800/50"
                indicatorColor="bg-green-600 dark:bg-green-400"
              />
            </div>

            <div className="p-4 rounded-lg border border-yellow-200 dark:border-yellow-800/50 bg-yellow-50 dark:bg-yellow-900/20">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Zap className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mr-2" />
                  <span className="font-medium text-yellow-800 dark:text-yellow-300">Electricity</span>
                </div>
                <Badge
                  variant="outline"
                  className="bg-yellow-100 dark:bg-yellow-900/50 text-yellow-800 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800/50"
                >
                  Warning
                </Badge>
              </div>
              <Progress
                value={78}
                className="h-1 mt-3 bg-yellow-200 dark:bg-yellow-800/50"
                indicatorColor="bg-yellow-600 dark:bg-yellow-400"
              />
            </div>

            <div className="p-4 rounded-lg border border-blue-200 dark:border-blue-800/50 bg-blue-50 dark:bg-blue-900/20">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Activity className="h-5 w-5 text-blue-600 dark:text-blue-400 mr-2" />
                  <span className="font-medium text-blue-800 dark:text-blue-300">PS/LS</span>
                </div>
                <Badge
                  variant="outline"
                  className="bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-300 border-blue-200 dark:border-blue-800/50"
                >
                  Operational
                </Badge>
              </div>
              <Progress
                value={95}
                className="h-1 mt-3 bg-blue-200 dark:bg-blue-800/50"
                indicatorColor="bg-blue-600 dark:bg-blue-400"
              />
            </div>

            <div className="p-4 rounded-lg border border-purple-200 dark:border-purple-800/50 bg-purple-50 dark:bg-purple-900/20">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Settings className="h-5 w-5 text-purple-600 dark:text-purple-400 mr-2" />
                  <span className="font-medium text-purple-800 dark:text-purple-300">HVAC/BMS</span>
                </div>
                <Badge
                  variant="outline"
                  className="bg-purple-100 dark:bg-purple-900/50 text-purple-800 dark:text-purple-300 border-purple-200 dark:border-purple-800/50"
                >
                  Operational
                </Badge>
              </div>
              <Progress
                value={88}
                className="h-1 mt-3 bg-purple-200 dark:bg-purple-800/50"
                indicatorColor="bg-purple-600 dark:bg-purple-400"
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
