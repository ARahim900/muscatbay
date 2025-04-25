"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Clock, AlertTriangle, Settings } from "lucide-react"

interface PlaceholderSectionProps {
  title: string
}

export function PlaceholderSection({ title }: PlaceholderSectionProps) {
  return (
    <div className="p-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h2 className="text-3xl font-bold tracking-tight text-gray-800 dark:text-gray-200">{title}</h2>
        <Badge
          variant="outline"
          className="text-purple-600 dark:text-purple-400 border-purple-300 dark:border-purple-700 bg-purple-50 dark:bg-purple-900/20"
        >
          <Clock className="h-3 w-3 mr-1" />
          Coming Soon
        </Badge>
      </div>

      <Card className="bg-white dark:bg-gray-800 shadow-lg rounded-lg border border-gray-200 dark:border-gray-700 mt-6">
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-gray-800 dark:text-gray-200">{title} Module</CardTitle>
          <CardDescription className="text-gray-500 dark:text-gray-400">
            This module is currently under development
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6 flex flex-col items-center justify-center text-center space-y-6">
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-purple-100 to-blue-100 dark:from-purple-900/30 dark:to-blue-900/30 flex items-center justify-center">
            <Settings className="h-12 w-12 text-purple-500 dark:text-purple-400 animate-pulse" />
          </div>

          <div className="max-w-md">
            <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">Module Under Development</h3>
            <p className="text-gray-600 dark:text-gray-400">
              The <span className="font-semibold">{title}</span> module is currently being developed and will be
              available in the next release. Our team is working hard to bring you the best experience.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 mt-4">
            <Button variant="outline" className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Report Issue
            </Button>
            <Button className="flex items-center gap-2">Request Early Access</Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
        <Card className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900/50 dark:to-gray-800/50 shadow-md rounded-lg border border-gray-200 dark:border-gray-700/50">
          <CardHeader>
            <CardTitle className="text-lg font-medium text-gray-700 dark:text-gray-300">Feature 1</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-500 dark:text-gray-400">
              Description of the first feature that will be available in this module.
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900/50 dark:to-gray-800/50 shadow-md rounded-lg border border-gray-200 dark:border-gray-700/50">
          <CardHeader>
            <CardTitle className="text-lg font-medium text-gray-700 dark:text-gray-300">Feature 2</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-500 dark:text-gray-400">
              Description of the second feature that will be available in this module.
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900/50 dark:to-gray-800/50 shadow-md rounded-lg border border-gray-200 dark:border-gray-700/50">
          <CardHeader>
            <CardTitle className="text-lg font-medium text-gray-700 dark:text-gray-300">Feature 3</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-500 dark:text-gray-400">
              Description of the third feature that will be available in this module.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
