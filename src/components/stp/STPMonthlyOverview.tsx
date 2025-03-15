
import React from 'react';
import { stpMonthlyData } from '@/utils/stpDataUtils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, Area, AreaChart } from 'recharts';

interface STPMonthlyOverviewProps {
  selectedMonth?: string;
}

export const STPMonthlyOverview: React.FC<STPMonthlyOverviewProps> = ({ selectedMonth }) => {
  // Transform data for charts - ensure we're using actual numeric values
  const chartData = stpMonthlyData.map(month => ({
    name: month.month.substring(5), // Just show MM format for cleaner display
    tankerVolume: Number(month.expectedVolumeTankers),
    directSewage: Number(month.directSewageMB),
    totalInfluent: Number(month.totalInfluent),
    processed: Number(month.totalWaterProcessed),
    irrigation: Number(month.tseToIrrigation),
  }));

  // Calculate efficiency metrics for each month - ensure proper numerical calculations
  const efficiencyData = stpMonthlyData.map(month => {
    const processingEfficiency = ((Number(month.totalWaterProcessed) / Number(month.totalInfluent)) * 100).toFixed(1);
    const irrigationUtilization = ((Number(month.tseToIrrigation) / Number(month.totalWaterProcessed)) * 100).toFixed(1);
    
    return {
      name: month.month.substring(5),
      processingEfficiency: parseFloat(processingEfficiency),
      irrigationUtilization: parseFloat(irrigationUtilization),
    };
  });

  console.log("Monthly Overview Chart Data:", chartData);
  console.log("Monthly Efficiency Data:", efficiencyData);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Monthly Volume Trends</CardTitle>
            <CardDescription>
              Total water volumes processed by month (cubic meters)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis domain={[0, 'auto']} />
                  <Tooltip formatter={(value) => [`${value} m³`, '']} />
                  <Legend />
                  <Bar dataKey="totalInfluent" name="Total Influent" fill="#8884d8" />
                  <Bar dataKey="processed" name="Water Processed" fill="#82ca9d" />
                  <Bar dataKey="irrigation" name="Used for Irrigation" fill="#ffc658" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Water Source Distribution</CardTitle>
            <CardDescription>
              Comparison between tanker deliveries and direct sewage
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis domain={[0, 'auto']} />
                  <Tooltip formatter={(value) => [`${value} m³`, '']} />
                  <Legend />
                  <Area type="monotone" dataKey="tankerVolume" name="Tanker Volume" stackId="1" fill="#8884d8" stroke="#8884d8" />
                  <Area type="monotone" dataKey="directSewage" name="Direct Sewage" stackId="1" fill="#82ca9d" stroke="#82ca9d" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Plant Efficiency Metrics</CardTitle>
          <CardDescription>
            Monthly processing efficiency and irrigation utilization percentages
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={efficiencyData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis domain={[0, 100]} />
                <Tooltip formatter={(value) => [`${value}%`, '']} />
                <Legend />
                <Line type="monotone" dataKey="processingEfficiency" name="Processing Efficiency" stroke="#8884d8" activeDot={{ r: 8 }} />
                <Line type="monotone" dataKey="irrigationUtilization" name="Irrigation Utilization" stroke="#82ca9d" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
