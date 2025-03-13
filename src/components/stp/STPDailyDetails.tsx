
import React, { useMemo, useState, useEffect } from 'react';
import { getDailyDataForMonth, formatDate } from '@/utils/stpDataUtils';
import { STPDailyData } from '@/types/stp';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, LineChart, Line, ComposedChart } from 'recharts';
import { BarChart2, LineChart as LineChartIcon, ArrowUp, ArrowDown, Minus, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface STPDailyDetailsProps {
  selectedMonth: string;
}

export const STPDailyDetails: React.FC<STPDailyDetailsProps> = ({ selectedMonth }) => {
  const [activeTab, setActiveTab] = useState('bars');
  
  // Get daily data for the selected month
  const dailyData = useMemo(() => {
    console.log("STPDailyDetails - selectedMonth:", selectedMonth);
    const rawData = getDailyDataForMonth(selectedMonth);
    
    // Ensure all data is properly converted to numbers
    return rawData.map(day => ({
      ...day,
      date: formatDate(day.date),
      tankerTrips: Number(day.tankerTrips),
      expectedVolumeTankers: Number(day.expectedVolumeTankers),
      directSewageMB: Number(day.directSewageMB),
      totalInfluent: Number(day.totalInfluent),
      totalWaterProcessed: Number(day.totalWaterProcessed),
      tseToIrrigation: Number(day.tseToIrrigation),
      processingEfficiency: (Number(day.totalWaterProcessed) / Number(day.totalInfluent) * 100).toFixed(1)
    }));
  }, [selectedMonth]);

  useEffect(() => {
    console.log("Daily data for charts:", dailyData);
  }, [dailyData]);

  // Calculate summary metrics
  const summaryMetrics = useMemo(() => {
    if (!dailyData.length) {
      console.log("No daily data available for metrics calculation");
      return null;
    }
    
    const totalProcessed = dailyData.reduce((sum, day) => sum + Number(day.totalWaterProcessed), 0);
    const totalInfluent = dailyData.reduce((sum, day) => sum + Number(day.totalInfluent), 0);
    const totalIrrigation = dailyData.reduce((sum, day) => sum + Number(day.tseToIrrigation), 0);
    const totalTankerVolume = dailyData.reduce((sum, day) => sum + Number(day.expectedVolumeTankers), 0);
    
    // Compare with previous day for trends
    const lastDay = dailyData[dailyData.length - 1];
    const prevDay = dailyData.length > 1 ? dailyData[dailyData.length - 2] : null;
    
    const processingTrend = prevDay ? 
      ((Number(lastDay.totalWaterProcessed) - Number(prevDay.totalWaterProcessed)) / Number(prevDay.totalWaterProcessed) * 100).toFixed(1) : 
      "0";
    
    const irrigationTrend = prevDay ? 
      ((Number(lastDay.tseToIrrigation) - Number(prevDay.tseToIrrigation)) / Number(prevDay.tseToIrrigation) * 100).toFixed(1) : 
      "0";
    
    return {
      avgProcessed: totalProcessed / dailyData.length,
      avgInfluent: totalInfluent / dailyData.length,
      avgIrrigation: totalIrrigation / dailyData.length,
      avgTankerVolume: totalTankerVolume / dailyData.length,
      processingEfficiency: (totalProcessed / totalInfluent * 100).toFixed(1),
      irrigationUtilization: (totalIrrigation / totalProcessed * 100).toFixed(1),
      processingTrend: parseFloat(processingTrend),
      irrigationTrend: parseFloat(irrigationTrend)
    };
  }, [dailyData]);

  const renderTrendIndicator = (trend: number) => {
    if (trend > 0) return <ArrowUp className="h-4 w-4 text-green-500" />;
    if (trend < 0) return <ArrowDown className="h-4 w-4 text-red-500" />;
    return <Minus className="h-4 w-4 text-gray-500" />;
  };

  // Handle the case when there's no data
  if (!dailyData.length) {
    return (
      <div className="space-y-6">
        <Alert variant="warning">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>No Data Available</AlertTitle>
          <AlertDescription>
            There is no daily data available for the selected month ({selectedMonth}).
            Please select a different month that has data.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {summaryMetrics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Avg. Processing Volume</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{Math.round(summaryMetrics.avgProcessed)} m³</div>
              <div className="flex items-center text-xs text-muted-foreground mt-1">
                {renderTrendIndicator(summaryMetrics.processingTrend)}
                <span className="ml-1">{Math.abs(summaryMetrics.processingTrend)}% from previous day</span>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Avg. Influent Volume</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{Math.round(summaryMetrics.avgInfluent)} m³</div>
              <p className="text-xs text-muted-foreground mt-1">
                Daily average for this month
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Processing Efficiency</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summaryMetrics.processingEfficiency}%</div>
              <p className="text-xs text-muted-foreground mt-1">
                Total processed ÷ total influent
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Irrigation Utilization</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summaryMetrics.irrigationUtilization}%</div>
              <div className="flex items-center text-xs text-muted-foreground mt-1">
                {renderTrendIndicator(summaryMetrics.irrigationTrend)}
                <span className="ml-1">{Math.abs(summaryMetrics.irrigationTrend)}% from previous day</span>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="bars" className="flex items-center">
            <BarChart2 className="mr-2 h-4 w-4" />
            Bar Chart
          </TabsTrigger>
          <TabsTrigger value="line" className="flex items-center">
            <LineChartIcon className="mr-2 h-4 w-4" />
            Line Chart
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="bars">
          <Card>
            <CardHeader>
              <CardTitle>Daily Processing Volumes</CardTitle>
              <CardDescription>
                Daily breakdown of water processing metrics for {selectedMonth}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[500px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={dailyData}
                    margin={{ top: 20, right: 30, left: 20, bottom: 70 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="date" 
                      angle={-45} 
                      textAnchor="end" 
                      height={70} 
                      interval={0} 
                    />
                    <YAxis domain={[0, 'auto']} />
                    <Tooltip formatter={(value) => [`${value} m³`, '']} />
                    <Legend />
                    <Bar dataKey="expectedVolumeTankers" name="Tanker Volume" fill="#8884d8" />
                    <Bar dataKey="directSewageMB" name="Direct Sewage" fill="#82ca9d" />
                    <Bar dataKey="totalWaterProcessed" name="Total Processed" fill="#ffc658" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="line">
          <Card>
            <CardHeader>
              <CardTitle>Daily Processing Trends</CardTitle>
              <CardDescription>
                Trend analysis of processing metrics for {selectedMonth}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[500px]">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart
                    data={dailyData}
                    margin={{ top: 20, right: 30, left: 20, bottom: 70 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="date" 
                      angle={-45} 
                      textAnchor="end" 
                      height={70} 
                      interval={0} 
                    />
                    <YAxis yAxisId="left" domain={[0, 'auto']} />
                    <YAxis yAxisId="right" orientation="right" domain={[0, 120]} />
                    <Tooltip formatter={(value, name) => {
                      if (name === "processingEfficiency") return [`${value}%`, name];
                      return [`${value} m³`, name];
                    }} />
                    <Legend />
                    <Line 
                      yAxisId="left"
                      type="monotone" 
                      dataKey="totalInfluent" 
                      name="Total Influent" 
                      stroke="#8884d8" 
                      dot={false}
                    />
                    <Line 
                      yAxisId="left"
                      type="monotone" 
                      dataKey="totalWaterProcessed" 
                      name="Water Processed" 
                      stroke="#82ca9d" 
                      dot={false}
                    />
                    <Line 
                      yAxisId="left"
                      type="monotone" 
                      dataKey="tseToIrrigation" 
                      name="Irrigation" 
                      stroke="#ffc658" 
                      dot={false}
                    />
                    <Line 
                      yAxisId="right"
                      type="monotone" 
                      dataKey="processingEfficiency" 
                      name="Efficiency %" 
                      stroke="#ff7300" 
                      dot={false}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
