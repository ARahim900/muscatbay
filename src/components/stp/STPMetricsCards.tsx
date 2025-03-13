
import React, { useMemo } from 'react';
import { stpMonthlyData, calculateMonthlyMetrics, formatMonth } from '@/utils/stpDataUtils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Droplets, Recycle, TruckIcon, BarChart2 } from 'lucide-react';

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

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Total Water Processed
          </CardTitle>
          <BarChart2 className="h-4 w-4 text-muscat-primary" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{monthData?.totalWaterProcessed.toLocaleString()} m³</div>
          <p className="text-xs text-muted-foreground">
            Processing Efficiency: {(metrics.processingEfficiency * 100).toFixed(1)}%
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Water to Irrigation
          </CardTitle>
          <Droplets className="h-4 w-4 text-green-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{monthData?.tseToIrrigation.toLocaleString()} m³</div>
          <p className="text-xs text-muted-foreground">
            Utilization Rate: {(metrics.irrigationUtilization * 100).toFixed(1)}%
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Tanker Deliveries
          </CardTitle>
          <TruckIcon className="h-4 w-4 text-blue-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{monthData?.tankerTrips} trips</div>
          <p className="text-xs text-muted-foreground">
            Volume: {monthData?.expectedVolumeTankers.toLocaleString()} m³ ({metrics.tankerPercentage.toFixed(1)}% of total)
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Direct Sewage Input
          </CardTitle>
          <Recycle className="h-4 w-4 text-purple-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{monthData?.directSewageMB.toLocaleString()} m³</div>
          <p className="text-xs text-muted-foreground">
            {metrics.directSewagePercentage.toFixed(1)}% of total input
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
