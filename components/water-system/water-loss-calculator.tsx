"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function WaterLossCalculator() {
  const [supply, setSupply] = useState("")
  const [consumption, setConsumption] = useState("")
  const [result, setResult] = useState<{ loss: number; percentage: number } | null>(null)

  const calculateLoss = () => {
    const supplyValue = Number.parseFloat(supply)
    const consumptionValue = Number.parseFloat(consumption)

    if (isNaN(supplyValue) || isNaN(consumptionValue)) {
      return
    }

    const loss = supplyValue - consumptionValue
    const percentage = (loss / supplyValue) * 100

    setResult({
      loss,
      percentage,
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Water Loss Calculator</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="supply">Supply (m³)</Label>
              <Input
                id="supply"
                type="number"
                placeholder="Enter supply volume"
                value={supply}
                onChange={(e) => setSupply(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="consumption">Consumption (m³)</Label>
              <Input
                id="consumption"
                type="number"
                placeholder="Enter consumption volume"
                value={consumption}
                onChange={(e) => setConsumption(e.target.value)}
              />
            </div>
          </div>

          <Button onClick={calculateLoss} className="w-full">
            Calculate Loss
          </Button>

          {result && (
            <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Water Loss</p>
                  <p className="text-lg font-semibold text-blue-600 dark:text-blue-400">{result.loss.toFixed(2)} m³</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Loss Percentage</p>
                  <p className="text-lg font-semibold text-blue-600 dark:text-blue-400">
                    {result.percentage.toFixed(2)}%
                  </p>
                </div>
              </div>
              <div className="mt-4">
                <p className="text-sm text-gray-500 dark:text-gray-400">Estimated Value</p>
                <p className="text-lg font-semibold text-blue-600 dark:text-blue-400">
                  {(result.loss * 1.32).toFixed(2)} OMR
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Based on 1.32 OMR/m³</p>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
