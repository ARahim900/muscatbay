"use client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useWaterData } from "@/context/water-data-context"

export default function WaterHierarchyVisualization() {
  const { data, loading } = useWaterData()

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Water Hierarchy</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Water Hierarchy</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center justify-center h-64">
          <div className="text-center p-4 bg-blue-100 rounded-lg mb-2 w-3/4">
            <p className="font-semibold">Main Supply</p>
            <p className="text-sm">{data.hierarchy?.mainSupply} m³</p>
          </div>
          <div className="h-8 w-0.5 bg-gray-300"></div>
          <div className="grid grid-cols-2 gap-4 w-full">
            <div className="text-center p-4 bg-green-100 rounded-lg">
              <p className="font-semibold">Zone A</p>
              <p className="text-sm">{data.hierarchy?.zoneA} m³</p>
            </div>
            <div className="text-center p-4 bg-green-100 rounded-lg">
              <p className="font-semibold">Zone B</p>
              <p className="text-sm">{data.hierarchy?.zoneB} m³</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
