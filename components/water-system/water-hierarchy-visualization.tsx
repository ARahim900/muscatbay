
import React from "react"
import { Activity, ArrowDown, ArrowDownRight, Droplet } from "lucide-react"

interface WaterHierarchyVisualizationProps {
  data: any
  summaryData?: {
    l1Total: number;
    l2Total: number;
    l3Total: number;
    l1ToL2Loss: number;
    l2ToL3Loss: number;
    totalLoss: number;
  }
}

export const WaterHierarchyVisualization: React.FC<WaterHierarchyVisualizationProps> = ({ data, summaryData }) => {
  // Format numbers for display
  const formatNumber = (num: number): string => {
    return num.toLocaleString()
  }
  
  // Calculate percentages
  const l1ToL2LossPercent = summaryData ? 
    ((summaryData.l1ToL2Loss / summaryData.l1Total) * 100).toFixed(1) : "0.0"
  const l2ToL3LossPercent = summaryData ? 
    ((summaryData.l2ToL3Loss / summaryData.l2Total) * 100).toFixed(1) : "0.0"
  const totalLossPercent = summaryData ? 
    ((summaryData.totalLoss / summaryData.l1Total) * 100).toFixed(1) : "0.0"

  return (
    <div className="p-6 bg-white dark:bg-gray-800 rounded-xl shadow-sm">
      <div className="flex flex-col items-center">
        {/* L1 Level - Main Supply */}
        <div className="w-full max-w-md bg-blue-100 dark:bg-blue-900/30 p-4 rounded-lg border-l-4 border-blue-500 mb-4">
          <h3 className="text-lg font-semibold text-blue-800 dark:text-blue-300 mb-1">L1: Main Supply</h3>
          <p className="text-2xl font-bold text-blue-700 dark:text-blue-200">
            {summaryData ? formatNumber(summaryData.l1Total) : "0"} m³
          </p>
        </div>
        
        {/* Arrow with loss info */}
        <div className="flex flex-col items-center my-2">
          <ArrowDown className="h-8 w-8 text-gray-400 dark:text-gray-500" />
          <div className="bg-amber-50 dark:bg-amber-900/20 px-3 py-1 rounded-md text-sm">
            <span className="font-semibold text-amber-700 dark:text-amber-300">
              Loss: {summaryData ? formatNumber(summaryData.l1ToL2Loss) : "0"} m³ ({l1ToL2LossPercent}%)
            </span>
          </div>
        </div>
        
        {/* L2 Level - Zone Distribution */}
        <div className="w-full max-w-md bg-green-100 dark:bg-green-900/30 p-4 rounded-lg border-l-4 border-green-500 mb-4">
          <h3 className="text-lg font-semibold text-green-800 dark:text-green-300 mb-1">L2: Zone Distribution</h3>
          <p className="text-2xl font-bold text-green-700 dark:text-green-200">
            {summaryData ? formatNumber(summaryData.l2Total) : "0"} m³
          </p>
        </div>
        
        {/* Arrow with loss info */}
        <div className="flex flex-col items-center my-2">
          <ArrowDown className="h-8 w-8 text-gray-400 dark:text-gray-500" />
          <div className="bg-amber-50 dark:bg-amber-900/20 px-3 py-1 rounded-md text-sm">
            <span className="font-semibold text-amber-700 dark:text-amber-300">
              Loss: {summaryData ? formatNumber(summaryData.l2ToL3Loss) : "0"} m³ ({l2ToL3LossPercent}%)
            </span>
          </div>
        </div>
        
        {/* L3 Level - End Consumption */}
        <div className="w-full max-w-md bg-purple-100 dark:bg-purple-900/30 p-4 rounded-lg border-l-4 border-purple-500">
          <h3 className="text-lg font-semibold text-purple-800 dark:text-purple-300 mb-1">L3: End Consumption</h3>
          <p className="text-2xl font-bold text-purple-700 dark:text-purple-200">
            {summaryData ? formatNumber(summaryData.l3Total) : "0"} m³
          </p>
        </div>
        
        {/* Total Loss Summary */}
        <div className="mt-8 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800 w-full max-w-md">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-semibold text-red-800 dark:text-red-300">Total System Loss</h4>
              <p className="text-2xl font-bold text-red-700 dark:text-red-200">
                {summaryData ? formatNumber(summaryData.totalLoss) : "0"} m³
              </p>
            </div>
            <div className="text-right">
              <span className="text-xl font-bold text-red-700 dark:text-red-300">{totalLossPercent}%</span>
              <p className="text-xs text-red-600 dark:text-red-400">of total supply</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
