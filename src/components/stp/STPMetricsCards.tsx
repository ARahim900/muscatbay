
import React, { useMemo } from 'react';
import { stpMonthlyData, calculateMonthlyMetrics, formatMonth } from '@/utils/stpDataUtils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Droplets, Recycle, Truck, BarChart2, TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface STPMetricsCardsProps {
  selectedMonth: string;
}

export const STPMetricsCards: React.FC<STPMetricsCardsProps> = ({ selectedMonth }) => {
  const monthData = useMemo(() => 
    stpMonthlyData.find(m => m.month === selectedMonth), 
    [selectedMonth]
  );
  
  const metrics = useMemo(() => 
    calculateMonthlyMetrics(selectedMonth),
    [selectedMonth]
  );

  // Calculate month-over-month change
  const monthIndex = useMemo(() => {
    return stpMonthlyData.findIndex(m => m.month === selectedMonth);
  }, [selectedMonth]);

  const previousMonthData = useMemo(() => {
    if (monthIndex > 0) {
      return stpMonthlyData[monthIndex - 1];
    }
    return null;
  }, [monthIndex]);

  const getChangePercentage = (current: number, previous: number | undefined) => {
    if (!previous) return 0;
    return ((current - previous) / previous) * 100;
  };

  const changes = useMemo(() => {
    if (!monthData || !previousMonthData) return null;
    
    return {
      totalWaterProcessed: getChangePercentage(
        monthData.totalWaterProcessed,
        previousMonthData.totalWaterProcessed
      ),
      tseToIrrigation: getChangePercentage(
        monthData.tseToIrrigation,
        previousMonthData.tseToIrrigation
      ),
      tankerTrips: getChangePercentage(
        monthData.tankerTrips,
        previousMonthData.tankerTrips
      ),
      directSewage: getChangePercentage(
        monthData.directSewageMB,
        previousMonthData.directSewageMB
      )
    };
  }, [monthData, previousMonthData]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card className="overflow-hidden transition-all hover:shadow-md border-t-4 border-t-muscat-primary">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-white">
          <CardTitle className="text-sm font-medium">
            Total Water Processed
          </CardTitle>
          <div className="p-2 rounded-full bg-muscat-primary/10">
            <BarChart2 className="h-4 w-4 text-muscat-primary" />
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="text-2xl font-bold">{monthData?.totalWaterProcessed.toLocaleString()} m³</div>
          <div className="flex items-center pt-1">
            <p className="text-xs text-muted-foreground mr-2">
              Processing Efficiency: {(metrics.processingEfficiency * 100).toFixed(1)}%
            </p>
            {changes && (
              <div className={cn(
                "text-xs flex items-center rounded px-1",
                changes.totalWaterProcessed > 0 ? "text-green-600 bg-green-50" : "text-red-600 bg-red-50"
              )}>
                {changes.totalWaterProcessed > 0 ? 
                  <TrendingUp className="h-3 w-3 mr-1" /> : 
                  <TrendingDown className="h-3 w-3 mr-1" />
                }
                {Math.abs(changes.totalWaterProcessed).toFixed(1)}%
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="overflow-hidden transition-all hover:shadow-md border-t-4 border-t-green-500">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-white">
          <CardTitle className="text-sm font-medium">
            Water to Irrigation
          </CardTitle>
          <div className="p-2 rounded-full bg-green-500/10">
            <Droplets className="h-4 w-4 text-green-500" />
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="text-2xl font-bold">{monthData?.tseToIrrigation.toLocaleString()} m³</div>
          <div className="flex items-center pt-1">
            <p className="text-xs text-muted-foreground mr-2">
              Utilization Rate: {(metrics.irrigationUtilization * 100).toFixed(1)}%
            </p>
            {changes && (
              <div className={cn(
                "text-xs flex items-center rounded px-1",
                changes.tseToIrrigation > 0 ? "text-green-600 bg-green-50" : "text-red-600 bg-red-50"
              )}>
                {changes.tseToIrrigation > 0 ? 
                  <TrendingUp className="h-3 w-3 mr-1" /> : 
                  <TrendingDown className="h-3 w-3 mr-1" />
                }
                {Math.abs(changes.tseToIrrigation).toFixed(1)}%
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="overflow-hidden transition-all hover:shadow-md border-t-4 border-t-blue-500">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-white">
          <CardTitle className="text-sm font-medium">
            Tanker Deliveries
          </CardTitle>
          <div className="p-2 rounded-full bg-blue-500/10">
            <Truck className="h-4 w-4 text-blue-500" />
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="text-2xl font-bold">{monthData?.tankerTrips} trips</div>
          <div className="flex items-center pt-1">
            <p className="text-xs text-muted-foreground mr-2">
              Volume: {monthData?.expectedVolumeTankers.toLocaleString()} m³ ({metrics.tankerPercentage.toFixed(1)}% of total)
            </p>
            {changes && (
              <div className={cn(
                "text-xs flex items-center rounded px-1",
                changes.tankerTrips < 0 ? "text-green-600 bg-green-50" : "text-red-600 bg-red-50"
              )}>
                {changes.tankerTrips < 0 ? 
                  <TrendingDown className="h-3 w-3 mr-1" /> : 
                  <TrendingUp className="h-3 w-3 mr-1" />
                }
                {Math.abs(changes.tankerTrips).toFixed(1)}%
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="overflow-hidden transition-all hover:shadow-md border-t-4 border-t-purple-500">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-white">
          <CardTitle className="text-sm font-medium">
            Direct Sewage Input
          </CardTitle>
          <div className="p-2 rounded-full bg-purple-500/10">
            <Recycle className="h-4 w-4 text-purple-500" />
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="text-2xl font-bold">{monthData?.directSewageMB.toLocaleString()} m³</div>
          <div className="flex items-center pt-1">
            <p className="text-xs text-muted-foreground mr-2">
              {metrics.directSewagePercentage.toFixed(1)}% of total input
            </p>
            {changes && (
              <div className={cn(
                "text-xs flex items-center rounded px-1",
                changes.directSewage > 0 ? "text-green-600 bg-green-50" : "text-red-600 bg-red-50"
              )}>
                {changes.directSewage > 0 ? 
                  <TrendingUp className="h-3 w-3 mr-1" /> : 
                  <TrendingDown className="h-3 w-3 mr-1" />
                }
                {Math.abs(changes.directSewage).toFixed(1)}%
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
