"use client"
import { AlertTriangle } from "lucide-react"

interface ErrorAlertProps {
  title?: string
  message: string
  onRetry?: () => void
}

export function ErrorAlert({ title = "Error", message, onRetry }: ErrorAlertProps) {
  return (
    <div className="p-4 bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700 rounded-md text-red-800 dark:text-red-300 flex items-start space-x-3">
      <AlertTriangle className="h-5 w-5 mt-0.5 flex-shrink-0" />
      <div className="flex-1">
        <p className="font-medium">{title}</p>
        <p className="text-sm mt-1">{message}</p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="mt-2 text-sm font-medium text-red-700 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300"
          >
            Try Again
          </button>
        )}
      </div>
    </div>
  )
}
