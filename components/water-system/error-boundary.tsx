"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { AlertTriangle, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"

interface ErrorBoundaryProps {
  children: React.ReactNode
  fallback?: React.ReactNode
  onReset?: () => void
}

export function ErrorBoundary({ children, fallback, onReset }: ErrorBoundaryProps) {
  const [hasError, setHasError] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    // Add error event listener
    const errorHandler = (event: ErrorEvent) => {
      console.error("Error caught by boundary:", event.error)
      setError(event.error)
      setHasError(true)
    }

    window.addEventListener("error", errorHandler)

    return () => {
      window.removeEventListener("error", errorHandler)
    }
  }, [])

  const handleReset = () => {
    setHasError(false)
    setError(null)
    if (onReset) onReset()
  }

  if (hasError) {
    if (fallback) return <>{fallback}</>

    return (
      <div className="p-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
        <div className="flex items-start space-x-3">
          <AlertTriangle className="h-6 w-6 text-red-500 mt-0.5 flex-shrink-0" />
          <div>
            <h3 className="text-lg font-medium text-red-800 dark:text-red-300">Something went wrong</h3>
            <p className="mt-1 text-sm text-red-700 dark:text-red-400">
              {error?.message || "An unexpected error occurred"}
            </p>
            <Button
              onClick={handleReset}
              className="mt-4 bg-red-600 hover:bg-red-700 text-white flex items-center space-x-2"
            >
              <RefreshCw className="h-4 w-4" />
              <span>Try Again</span>
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
