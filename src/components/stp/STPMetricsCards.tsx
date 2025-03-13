
import React, { useMemo } from 'react';
import { stpMonthlyData, calculateMonthlyMetrics } from '@/utils/stpDataUtils';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowDown, ArrowUp, Droplets, Factory, Gauge, TrendingUp } from 'lucide-react';

interface STPMetricsCardsProps {
  selectedMonth: string;
}

export const STPMetricsCards: React.FC<STPMetricsCardsProps> = ({ selectedMonth }) => {
  const monthData = useMemo(() => {
    return stpMonthlyData.find(m => m.month === selectedMonth);
  }, [selectedMonth]);

  const metrics = useMemo(() => {
    if (!monthData) return null;
    return calculateMonthlyMetrics(selectedMonth);
  }, [selectedMonth, monthData]);

  // Ensure monthData is available
  if (!monthData || !metrics) {
    console.log("No data found for month:", selectedMonth);
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Loading data...</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">-</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  console.log("Metrics card data:", monthData);
  console.log("Calculated metrics:", metrics);

  // Find previous month for comparison
  const monthIndex = stpMonthlyData.findIndex(m => m.month === selectedMonth);
  const prevMonthData = monthIndex > 0 ? stpMonthlyData[monthIndex - 1] : null;
  
  // Calculate trend percentages if previous month data exists
  const processingTrend = prevMonthData 
    ? ((Number(monthData.totalWaterProcessed) - Number(prevMonthData.totalWaterProcessed)) / Number(prevMonthData.totalWaterProcessed) * 100).toFixed(1)
    : "0";
  
  const influentTrend = prevMonthData 
    ? ((Number(monthData.totalInfluent) - Number(prevMonthData.totalInfluent)) / Number(prevMonthData.totalInfluent) * 100).toFixed(1)
    : "0";

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Influent</CardTitle>
          <Droplets className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{Number(monthData.totalInfluent).toLocaleString()} m³</div>
          <p className="text-xs text-muted-foreground mt-1 flex items-center">
            {parseFloat(influentTrend) > 0 ? (
              <ArrowUp className="mr-1 h-4 w-4 text-green-500" />
            ) : parseFloat(influentTrend) < 0 ? (
              <ArrowDown className="mr-1 h-4 w-4 text-red-500" />
            ) : null}
            <span>{parseFloat(influentTrend) !== 0 ? `${Math.abs(parseFloat(influentTrend))}% from previous month` : "No change from previous month"}</span>
          </p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Water Processed</CardTitle>
          <Factory className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{Number(monthData.totalWaterProcessed).toLocaleString()} m³</div>
          <p className="text-xs text-muted-foreground mt-1 flex items-center">
            {parseFloat(processingTrend) > 0 ? (
              <ArrowUp className="mr-1 h-4 w-4 text-green-500" />
            ) : parseFloat(processingTrend) < 0 ? (
              <ArrowDown className="mr-1 h-4 w-4 text-red-500" />
            ) : null}
            <span>{parseFloat(processingTrend) !== 0 ? `${Math.abs(parseFloat(processingTrend))}% from previous month` : "No change from previous month"}</span>
          </p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Processing Efficiency</CardTitle>
          <Gauge className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{(metrics.processingEfficiency * 100).toFixed(1)}%</div>
          <p className="text-xs text-muted-foreground mt-1">
            Water processed ÷ total influent
          </p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Irrigation Usage</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{(metrics.irrigationUtilization * 100).toFixed(1)}%</div>
          <div className="text-xs text-muted-foreground mt-1">
            {Number(monthData.tseToIrrigation).toLocaleString()} m³ used for irrigation
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
