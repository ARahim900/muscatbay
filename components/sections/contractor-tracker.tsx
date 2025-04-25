"use client"

import { useState, useEffect } from "react"
import { ClipboardList, RefreshCw, Users, Calendar, FileText, Search } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"

export function ContractorTracker() {
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("active")
  const [searchTerm, setSearchTerm] = useState("")

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
          <h2 className="text-3xl font-bold tracking-tight text-gray-800 dark:text-gray-200">Contractor Tracker</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center mt-1">
            <ClipboardList className="h-4 w-4 mr-1.5 text-blue-500" />
            Manage and track contractors, projects, and work orders
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button size="sm" variant="outline" className="flex items-center gap-1">
            <RefreshCw className="h-3.5 w-3.5" />
            Refresh
          </Button>
          <Button size="sm">Add Contractor</Button>
        </div>
      </div>

      {/* Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-950/40 shadow-lg rounded-lg border border-blue-200 dark:border-blue-800/50 transition-all duration-300 hover:shadow-xl">
          <CardHeader className="pb-2">
            <CardDescription className="text-gray-600 dark:text-gray-400">Active Contractors</CardDescription>
            <CardTitle className="text-2xl font-bold text-blue-600 dark:text-blue-400">12</CardTitle>
          </CardHeader>
        </Card>
        <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/30 dark:to-green-950/40 shadow-lg rounded-lg border border-green-200 dark:border-green-800/50 transition-all duration-300 hover:shadow-xl">
          <CardHeader className="pb-2">
            <CardDescription className="text-gray-600 dark:text-gray-400">Active Projects</CardDescription>
            <CardTitle className="text-2xl font-bold text-green-600 dark:text-green-400">8</CardTitle>
          </CardHeader>
        </Card>
        <Card className="bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-900/30 dark:to-amber-950/40 shadow-lg rounded-lg border border-amber-200 dark:border-amber-800/50 transition-all duration-300 hover:shadow-xl">
          <CardHeader className="pb-2">
            <CardDescription className="text-gray-600 dark:text-gray-400">Pending Approvals</CardDescription>
            <CardTitle className="text-2xl font-bold text-amber-600 dark:text-amber-400">3</CardTitle>
          </CardHeader>
        </Card>
        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/30 dark:to-purple-950/40 shadow-lg rounded-lg border border-purple-200 dark:border-purple-800/50 transition-all duration-300 hover:shadow-xl">
          <CardHeader className="pb-2">
            <CardDescription className="text-gray-600 dark:text-gray-400">Completed This Month</CardDescription>
            <CardTitle className="text-2xl font-bold text-purple-600 dark:text-purple-400">15</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Search and Filter */}
      <Card className="bg-white dark:bg-gray-800 shadow-sm rounded-lg border border-gray-200 dark:border-gray-700">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-grow">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500 dark:text-gray-400" />
              <Input
                type="search"
                placeholder="Search contractors..."
                className="pl-9"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="whitespace-nowrap">
                <Calendar className="h-4 w-4 mr-1.5" />
                Filter by Date
              </Button>
              <Button variant="outline" size="sm" className="whitespace-nowrap">
                <FileText className="h-4 w-4 mr-1.5" />
                Export
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs for different views */}
      <Tabs defaultValue="active" className="w-full" onValueChange={setActiveTab}>
        <div className="flex justify-between items-center mb-4">
          <TabsList className="grid w-full max-w-md grid-cols-3">
            <TabsTrigger value="active">Active Contractors</TabsTrigger>
            <TabsTrigger value="projects">Projects</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
          </TabsList>
          <Badge
            variant="outline"
            className="text-blue-600 dark:text-blue-400 border-blue-300 dark:border-blue-700 bg-blue-50 dark:bg-blue-900/20"
          >
            <Users className="h-3 w-3 mr-1" />
            Database Ready
          </Badge>
        </div>

        {/* Active Contractors Tab */}
        <TabsContent value="active" className="mt-0">
          <Card className="bg-white dark:bg-gray-800 shadow-lg rounded-lg border border-gray-200 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-gray-700 dark:text-gray-300">
                Active Contractors
              </CardTitle>
              <CardDescription className="text-gray-500 dark:text-gray-400">
                Currently active contractors and their assignments
              </CardDescription>
            </CardHeader>
            <CardContent className="h-[calc(100vh-500px)] min-h-[400px]">
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
                  <ClipboardList className="h-16 w-16 text-blue-500 mx-auto mb-4 opacity-50" />
                  <h3 className="text-xl font-medium text-gray-700 dark:text-gray-300 mb-2">Contractor Database</h3>
                  <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto">
                    The contractor tracking system is ready to be connected to your database. Upload your contractor
                    data to enable full functionality.
                  </p>
                  <Button className="mt-4">Connect Contractor Database</Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Other tabs */}
        {["projects", "history"].map((tab) => (
          <TabsContent key={tab} value={tab} className="mt-0">
            <Card className="bg-white dark:bg-gray-800 shadow-lg rounded-lg border border-gray-200 dark:border-gray-700">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-gray-700 dark:text-gray-300">
                  {tab === "projects" ? "Projects" : "Contractor History"}
                </CardTitle>
                <CardDescription className="text-gray-500 dark:text-gray-400">
                  {tab === "projects"
                    ? "Active and upcoming projects"
                    : "Historical contractor activities and completed projects"}
                </CardDescription>
              </CardHeader>
              <CardContent className="h-[calc(100vh-500px)] min-h-[400px] flex items-center justify-center">
                <div className="text-center p-6">
                  {tab === "projects" ? (
                    <FileText className="h-16 w-16 text-green-500 mx-auto mb-4 opacity-50" />
                  ) : (
                    <Calendar className="h-16 w-16 text-purple-500 mx-auto mb-4 opacity-50" />
                  )}
                  <h3 className="text-xl font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {tab === "projects" ? "Projects Module" : "History Module"}
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto">
                    This module is ready to be connected to your contractor database. Upload your data to enable full
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
