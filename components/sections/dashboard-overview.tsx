
"use client"

import { useState, useEffect } from "react"
import { Droplet, Zap, Settings, Users, Activity, AlertTriangle, TrendingUp, TrendingDown } from "lucide-react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { LineChart, BarChart, PieChart, AreaChart } from "@/components/ui/chart"

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
  hvac: {
    efficiency: 92,
    change: 1,
    trend: "down",
    unit: "%",
  },
  stp: {
    production: 1200,
    change: 2,
    trend: "up",
    unit: "m³",
  },
  contractors: {
    active: 14,
    change: 2,
  },
  pest: {
    sites: 12,
    nextDate: "05/15",
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
    message: "High water loss detected in Zone 05",
    details: "Loss rate exceeded 65% threshold",
    timestamp: "2 hours ago",
    severity: "critical"
  },
  {
    id: 2,
    icon: Settings,
    color: "text-green-500",
    message: "AC maintenance completed",
    details: "Block C units serviced and filters replaced",
    timestamp: "4 hours ago",
    severity: "completed"
  },
  {
    id: 3,
    icon: Users,
    color: "text-purple-500",
    message: "New contractor 'Alpha Services' added.",
    timestamp: "Yesterday",
    severity: "info"
  },
  {
    id: 4,
    icon: Zap,
    color: "text-yellow-500",
    message: "Electricity consumption spike detected at Pumping Station 1.",
    timestamp: "Yesterday",
    severity: "warning"
  },
  {
    id: 5,
    icon: Activity,
    color: "text-teal-500",
    message: "PS-02 reported minor flow discrepancy.",
    timestamp: "2 days ago",
    severity: "warning"
  },
]

const upcomingTasks = [
  {
    id: 1,
    icon: Droplet,
    message: "Zone 05 leak detection",
    assignee: "Mohammed A.",
    dueDate: "Apr 30, 2025",
    priority: "high"
  },
  {
    id: 2,
    icon: Settings,
    message: "STP water quality testing",
    assignee: "Sarah K.",
    dueDate: "Apr 30, 2025",
    priority: "medium"
  }
]

// Chart data
const waterConsumptionData = [
  { name: "Jan", value: 4000 },
  { name: "Feb", value: 3600 },
  { name: "Mar", value: 4800 },
  { name: "Apr", value: 5000 },
  { name: "May", value: 4200 },
  { name: "Jun", value: 5500 },
]

const electricityConsumptionData = [
  { name: "Jan", value: 14000, peak: 15500 },
  { name: "Feb", value: 13800, peak: 15000 },
  { name: "Mar", value: 15000, peak: 17000 },
  { name: "Apr", value: 14500, peak: 16800 },
  { name: "May", value: 15500, peak: 18000 },
  { name: "Jun", value: 16000, peak: 21000 },
]

export function DashboardOverview() {
  const [progress, setProgress] = useState(13)

  useEffect(() => {
    const timer = setTimeout(() => setProgress(66), 500)
    return () => clearTimeout(timer)
  }, [])

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical":
        return "bg-red-100 text-red-800 border-red-200";
      case "warning":
        return "bg-amber-100 text-amber-800 border-amber-200";
      case "info":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "completed":
        return "bg-green-100 text-green-800 border-green-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-100 text-red-800 border-red-200";
      case "medium":
        return "bg-amber-100 text-amber-800 border-amber-200";
      case "low":
        return "bg-blue-100 text-blue-800 border-blue-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  }

  return (
    <div className="p-6 space-y-6 animate-fade-in bg-gray-50">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight text-gray-800">Dashboard Overview</h1>
        <p className="text-lg text-gray-600">Muscat Bay Assets and Operation</p>
      </div>

      {/* KPI Cards Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {/* Water Consumption KPI Card */}
        <Card className="bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-gray-500">Water Consumption</p>
                <div className="flex items-baseline mt-1">
                  <h3 className="text-3xl font-bold text-gray-900">{kpiData.water.usage.toLocaleString()}</h3>
                  <span className="text-xl ml-1 text-gray-600">m³</span>
                </div>
                <div className="flex items-center mt-2">
                  {kpiData.water.trend === "up" ? (
                    <span className="inline-flex items-center text-red-600">
                      <TrendingUp className="h-4 w-4 mr-1" />+{kpiData.water.change}%
                    </span>
                  ) : (
                    <span className="inline-flex items-center text-green-600">
                      <TrendingDown className="h-4 w-4 mr-1" />-{kpiData.water.change}%
                    </span>
                  )}
                </div>
              </div>
              <div className="h-12 w-12 rounded-full bg-blue-50 flex items-center justify-center">
                <Droplet className="h-6 w-6 text-blue-500" />
              </div>
            </div>
            <div className="mt-4">
              <svg className="w-full h-8" viewBox="0 0 100 20">
                <path
                  d="M0 10 Q25 5, 50 15, 75 5, 100 10"
                  fill="none"
                  stroke="#3b82f6"
                  strokeWidth="2"
                />
              </svg>
            </div>
          </CardContent>
        </Card>

        {/* Electricity Usage KPI Card */}
        <Card className="bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-gray-500">Electricity Usage</p>
                <div className="flex items-baseline mt-1">
                  <h3 className="text-3xl font-bold text-gray-900">{kpiData.electricity.usage.toLocaleString()}</h3>
                  <span className="text-xl ml-1 text-gray-600">kWh</span>
                </div>
                <div className="flex items-center mt-2">
                  {kpiData.electricity.trend === "up" ? (
                    <span className="inline-flex items-center text-red-600">
                      <TrendingUp className="h-4 w-4 mr-1" />+{kpiData.electricity.change}%
                    </span>
                  ) : (
                    <span className="inline-flex items-center text-green-600">
                      <TrendingDown className="h-4 w-4 mr-1" />-{kpiData.electricity.change}%
                    </span>
                  )}
                </div>
              </div>
              <div className="h-12 w-12 rounded-full bg-amber-50 flex items-center justify-center">
                <Zap className="h-6 w-6 text-amber-500" />
              </div>
            </div>
            <div className="mt-4">
              <svg className="w-full h-8" viewBox="0 0 100 20">
                <path
                  d="M0 15 Q25 18, 50 10, 75 12, 100 5"
                  fill="none"
                  stroke="#f59e0b"
                  strokeWidth="2"
                />
              </svg>
            </div>
          </CardContent>
        </Card>

        {/* HVAC Efficiency KPI Card */}
        <Card className="bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-gray-500">HVAC Efficiency</p>
                <div className="flex items-baseline mt-1">
                  <h3 className="text-3xl font-bold text-gray-900">{kpiData.hvac.efficiency}</h3>
                  <span className="text-xl ml-1 text-gray-600">%</span>
                </div>
                <div className="flex items-center mt-2">
                  {kpiData.hvac.trend === "down" ? (
                    <span className="inline-flex items-center text-green-600">
                      <TrendingDown className="h-4 w-4 mr-1" />-{kpiData.hvac.change}%
                    </span>
                  ) : (
                    <span className="inline-flex items-center text-red-600">
                      <TrendingUp className="h-4 w-4 mr-1" />+{kpiData.hvac.change}%
                    </span>
                  )}
                </div>
              </div>
              <div className="h-12 w-12 rounded-full bg-green-50 flex items-center justify-center">
                <Settings className="h-6 w-6 text-green-500" />
              </div>
            </div>
            <div className="mt-4">
              <svg className="w-full h-8" viewBox="0 0 100 20">
                <path
                  d="M0 10 Q25 12, 50 8, 75 10, 100 10"
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="2"
                />
              </svg>
            </div>
          </CardContent>
        </Card>

        {/* STP Production KPI Card */}
        <Card className="bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-gray-500">STP Production</p>
                <div className="flex items-baseline mt-1">
                  <h3 className="text-3xl font-bold text-gray-900">{kpiData.stp.production.toLocaleString()}</h3>
                  <span className="text-xl ml-1 text-gray-600">m³</span>
                </div>
                <div className="flex items-center mt-2">
                  {kpiData.stp.trend === "up" ? (
                    <span className="inline-flex items-center text-red-600">
                      <TrendingUp className="h-4 w-4 mr-1" />+{kpiData.stp.change}%
                    </span>
                  ) : (
                    <span className="inline-flex items-center text-green-600">
                      <TrendingDown className="h-4 w-4 mr-1" />-{kpiData.stp.change}%
                    </span>
                  )}
                </div>
              </div>
              <div className="h-12 w-12 rounded-full bg-purple-50 flex items-center justify-center">
                <Settings className="h-6 w-6 text-purple-500" />
              </div>
            </div>
            <div className="mt-4">
              <svg className="w-full h-8" viewBox="0 0 100 20">
                <path
                  d="M0 12 Q25 15, 50 10, 75 18, 100 8"
                  fill="none"
                  stroke="#8b5cf6"
                  strokeWidth="2"
                />
              </svg>
            </div>
          </CardContent>
        </Card>

        {/* Active Contractors KPI Card */}
        <Card className="bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-gray-500">Active Contractors</p>
                <div className="flex items-baseline mt-1">
                  <h3 className="text-3xl font-bold text-gray-900">{kpiData.contractors.active}</h3>
                </div>
                <div className="flex items-center mt-2">
                  <span className="inline-flex items-center text-gray-600">
                    +{kpiData.contractors.change} since last month
                  </span>
                </div>
              </div>
              <div className="h-12 w-12 rounded-full bg-blue-50 flex items-center justify-center">
                <Users className="h-6 w-6 text-blue-500" />
              </div>
            </div>
            <div className="mt-4">
              <svg className="w-full h-8" viewBox="0 0 100 20">
                <path
                  d="M0 15 Q25 12, 50 15, 75 10, 100 12"
                  fill="none"
                  stroke="#3b82f6"
                  strokeWidth="2"
                />
              </svg>
            </div>
          </CardContent>
        </Card>

        {/* Pest Treatment KPI Card */}
        <Card className="bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-gray-500">Pest Treatment</p>
                <div className="flex items-baseline mt-1">
                  <h3 className="text-3xl font-bold text-gray-900">{kpiData.pest.sites}</h3>
                  <span className="text-xl ml-1 text-gray-600">sites</span>
                </div>
                <div className="flex items-center mt-2">
                  <span className="inline-flex items-center text-gray-600">
                    Next: {kpiData.pest.nextDate}
                  </span>
                </div>
              </div>
              <div className="h-12 w-12 rounded-full bg-red-50 flex items-center justify-center">
                <AlertTriangle className="h-6 w-6 text-red-500" />
              </div>
            </div>
            <div className="mt-4">
              <svg className="w-full h-8" viewBox="0 0 100 20">
                <path
                  d="M0 10 Q25 8, 50 12, 75 8, 100 10"
                  fill="none"
                  stroke="#ef4444"
                  strokeWidth="2"
                />
              </svg>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Water Consumption Chart */}
        <Card className="bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between border-b pb-2">
            <CardTitle className="text-xl font-bold">Water Consumption</CardTitle>
            <Button variant="outline" size="sm" className="whitespace-nowrap">
              View Details
            </Button>
          </CardHeader>
          <CardContent className="pt-6 pb-2">
            <div className="h-[300px]">
              <AreaChart
                data={waterConsumptionData}
                index="name"
                categories={["value"]}
                colors={["blue"]}
                valueFormatter={(value: number) => `${value.toLocaleString()} m³`}
                showLegend={false}
                showGridLines={false}
                startEndOnly={true}
                className="w-full h-full"
              />
            </div>
            <div className="flex justify-center mt-2">
              <div className="flex items-center text-sm text-gray-500">
                <div className="w-3 h-3 rounded-full bg-blue-500 mr-2"></div>
                <span>Consumption (m³)</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Electricity Usage Chart */}
        <Card className="bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between border-b pb-2">
            <CardTitle className="text-xl font-bold">Electricity Usage</CardTitle>
            <Button variant="outline" size="sm" className="whitespace-nowrap">
              View Details
            </Button>
          </CardHeader>
          <CardContent className="pt-6 pb-2">
            <div className="h-[300px]">
              <AreaChart
                data={electricityConsumptionData}
                index="name"
                categories={["value", "peak"]}
                colors={["gray", "amber"]}
                valueFormatter={(value: number) => `${value.toLocaleString()} kWh`}
                showLegend={false}
                showGridLines={false}
                startEndOnly={true}
                className="w-full h-full"
              />
            </div>
            <div className="flex justify-center gap-4 mt-2">
              <div className="flex items-center text-sm text-gray-500">
                <div className="w-3 h-3 rounded-full bg-gray-500 mr-2"></div>
                <span>Usage (kWh)</span>
              </div>
              <div className="flex items-center text-sm text-gray-500">
                <div className="w-3 h-3 rounded-full bg-amber-500 mr-2"></div>
                <span>Peak Demand (kWh)</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Activity and Tasks Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity Feed */}
        <Card className="bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between border-b pb-2">
            <div>
              <CardTitle className="text-xl font-bold">Recent Activity</CardTitle>
              <CardDescription>Last 7 days</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="space-y-4">
              {activityFeed.map((activity) => (
                <div key={activity.id} className="flex items-start space-x-4 p-3 rounded-lg hover:bg-gray-50">
                  <div className={`flex-shrink-0 rounded-full p-2 ${activity.severity === "critical" ? "bg-red-100" : 
                                                          activity.severity === "warning" ? "bg-amber-100" : 
                                                          activity.severity === "completed" ? "bg-green-100" : "bg-blue-100"}`}>
                    <activity.icon className={`h-5 w-5 ${activity.severity === "critical" ? "text-red-500" : 
                                                activity.severity === "warning" ? "text-amber-500" : 
                                                activity.severity === "completed" ? "text-green-500" : "text-blue-500"}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">{activity.message}</p>
                    {activity.details && (
                      <p className="text-sm text-gray-500">{activity.details}</p>
                    )}
                    <p className="text-xs text-gray-500 mt-1">{activity.timestamp}</p>
                  </div>
                  {activity.severity && (
                    <Badge className={`${getSeverityColor(activity.severity)}`}>
                      {activity.severity}
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Upcoming Tasks */}
        <Card className="bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between border-b pb-2">
            <CardTitle className="text-xl font-bold">Upcoming Tasks</CardTitle>
            <Button variant="secondary" size="sm" className="whitespace-nowrap">
              Add Task
            </Button>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="space-y-4">
              {upcomingTasks.map((task) => (
                <div key={task.id} className="flex items-start space-x-4 p-3 rounded-lg hover:bg-gray-50">
                  <div className={`flex-shrink-0 rounded-full p-2 ${task.priority === "high" ? "bg-red-100" : 
                                                         task.priority === "medium" ? "bg-amber-100" : "bg-blue-100"}`}>
                    <task.icon className={`h-5 w-5 ${task.priority === "high" ? "text-red-500" : 
                                            task.priority === "medium" ? "text-amber-500" : "text-blue-500"}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">{task.message}</p>
                    <div className="flex items-center mt-1">
                      <span className="text-xs text-gray-500">{task.dueDate}</span>
                      <span className="mx-2 text-gray-300">•</span>
                      <span className="text-xs text-gray-500">{task.assignee}</span>
                    </div>
                  </div>
                  <Badge className={`${getPriorityColor(task.priority)}`}>
                    {task.priority}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
