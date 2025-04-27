"use client"

import { Component, type ErrorInfo, type ReactNode } from "react"
import { AlertTriangle, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  }

  public static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error, errorInfo: null }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log the error to an error reporting service
    console.error("Uncaught error:", error, errorInfo)
    this.setState({ errorInfo })
  }

  private handleReset = (): void => {
    this.setState({ hasError: false, error: null, errorInfo: null })
  }

  public render(): ReactNode {
    if (this.state.hasError) {
      // If a custom fallback is provided, use it
      if (this.props.fallback) {
        return this.props.fallback
      }

      // Otherwise, use the default error UI
      return (
        <div className="p-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="h-6 w-6 text-red-500 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <h3 className="font-medium text-red-800 dark:text-red-300 text-lg">Something went wrong</h3>
              <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                {this.state.error?.message || "An unexpected error occurred"}
              </p>
              {process.env.NODE_ENV === "development" && this.state.error && (
                <pre className="mt-2 p-2 bg-red-100 dark:bg-red-900/40 rounded text-xs overflow-auto max-h-40">
                  {this.state.error.stack}
                </pre>
              )}
              <Button
                size="sm"
                variant="outline"
                className="mt-3 text-red-600 border-red-300 hover:bg-red-50"
                onClick={this.handleReset}
              >
                <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
                Try Again
              </Button>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
