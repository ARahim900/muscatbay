
import React, { useState, useEffect } from 'react';
import { stpMonthlyData, calculateMonthlyMetrics } from '@/utils/stpDataUtils';
import { Card, CardContent } from '@/components/ui/card';
import { DropletIcon, TruckIcon, Waves } from 'lucide-react';

const STPMetricsCards: React.FC = () => {
  const [metrics, setMetrics] = useState({
    totalTankerTrips: 0,
    totalInfluent: 0,
    avgProcessingEfficiency: 0,
    totalWaterProcessed: 0
  });
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const loadMetrics = async () => {
      try {
        const monthlyData = await stpMonthlyData();
        const daily = await import('@/utils/stpDataUtils').then(module => module.stpDailyData());
        
        if (monthlyData.length > 0) {
          // Get the most recent month
          const recentMonth = monthlyData[monthlyData.length - 1];
          
          // Get the monthly metrics
          const monthMetrics = calculateMonthlyMetrics(
            daily, 
            recentMonth.month.substring(0, 7) // Extract YYYY-MM part
          );
          
          setMetrics(monthMetrics);
        }
      } catch (error) {
        console.error('Error loading STP metrics:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadMetrics();
  }, []);
  
  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3 mb-6">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-16 bg-gray-200 rounded-md dark:bg-gray-700"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }
  
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3 mb-6">
      <Card>
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Tanker Trips</p>
              <h3 className="text-3xl font-bold mt-2">{metrics.totalTankerTrips}</h3>
              <p className="text-xs text-muted-foreground mt-1">This month</p>
            </div>
            <div className="p-2 bg-blue-100 rounded-full">
              <TruckIcon className="h-5 w-5 text-blue-600" />
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Influent</p>
              <h3 className="text-3xl font-bold mt-2">{metrics.totalInfluent.toLocaleString()} m³</h3>
              <p className="text-xs text-muted-foreground mt-1">This month</p>
            </div>
            <div className="p-2 bg-green-100 rounded-full">
              <DropletIcon className="h-5 w-5 text-green-600" />
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Processing Efficiency</p>
              <h3 className="text-3xl font-bold mt-2">{metrics.avgProcessingEfficiency.toFixed(1)}%</h3>
              <p className="text-xs text-muted-foreground mt-1">Current average</p>
            </div>
            <div className="p-2 bg-purple-100 rounded-full">
              <Waves className="h-5 w-5 text-purple-600" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default STPMetricsCards;
