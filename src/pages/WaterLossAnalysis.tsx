
import React, { useState } from 'react';
import { useWaterSystem } from '@/hooks/useWaterSystem';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from 'recharts';
import Layout from '@/components/layout/Layout';
import { Droplets, AlertTriangle, TrendingDown, Activity } from 'lucide-react';

const WaterLossAnalysis = () => {
  const { waterData, loading, error } = useWaterSystem();
  
  // Colors for charts
  const colors = {
    consumption: '#4285F4',
    loss: '#EA4335',
    zoneColors: ['#34A853', '#FBBC05', '#4285F4', '#EA4335', '#9C27B0', '#FF9800']
  };
  
  if (loading) {
    return (
      <Layout>
        <div className="p-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </Layout>
    );
  }
  
  if (error || !waterData) {
    return (
      <Layout>
        <div className="p-8">
          <div className="text-red-500">Error: {error || 'No data available'}</div>
        </div>
      </Layout>
    );
  }
  
  // Calculate system-wide loss percentage
  const totalLoss = waterData.losses.systemLoss;
  const totalConsumption = Object.values(waterData.types).reduce((sum, value) => sum + (value || 0), 0);
  const systemLossPercentage = (totalLoss / (totalLoss + totalConsumption)) * 100;
  
  // Format financial impact
  const financialImpact = waterData.losses.financialImpact;
  
  // Prepare data for zone loss chart
  const zoneLossData = Object.entries(waterData.losses.zoneLosses).map(([zone, loss], index) => ({
    name: zone,
    loss,
    fill: colors.zoneColors[index % colors.zoneColors.length]
  }));

  // Monthly trend data for line chart
  const monthlyTrendData = Object.entries(waterData.monthlyTrends).map(([month, data]) => ({
    month,
    consumption: data.consumption,
    loss: data.loss,
    lossPercentage: Number(data.loss) / (Number(data.consumption) + Number(data.loss)) * 100
  }));

  // Loss by zone for pie chart
  const zoneLossPieData = Object.entries(waterData.losses.zoneLosses)
    .filter(([, loss]) => loss > 0)
    .map(([zone, loss]) => ({
      name: zone,
      value: loss
    }));
  
  return (
    <Layout>
      <div className="bg-gray-50 min-h-screen">
        <div className="bg-white shadow">
          <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6">
            <div className="flex items-center">
              <AlertTriangle className="h-6 w-6 mr-2 text-amber-600" />
              <h1 className="text-2xl font-semibold text-gray-800">Water Loss Analysis</h1>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-medium text-gray-700">Total System Loss</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-baseline">
                  <span className="text-3xl font-bold text-red-500">
                    {Math.round(totalLoss).toLocaleString()} m³
                  </span>
                </div>
                <div className="mt-2">
                  <span className="text-sm text-gray-500">
                    {systemLossPercentage.toFixed(1)}% of total water volume
                  </span>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-medium text-gray-700">Financial Impact</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-baseline">
                  <span className="text-3xl font-bold text-red-500">
                    {Math.round(financialImpact).toLocaleString()} OMR
                  </span>
                </div>
                <div className="mt-2">
                  <span className="text-sm text-gray-500">
                    @ 3.5 OMR per cubic meter
                  </span>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-medium text-gray-700">Highest Loss Zone</CardTitle>
              </CardHeader>
              <CardContent>
                {zoneLossData.length > 0 ? (
                  <>
                    <div className="flex items-baseline">
                      <span className="text-3xl font-bold text-amber-500">
                        {zoneLossData[0]?.name}
                      </span>
                    </div>
                    <div className="mt-2">
                      <span className="text-sm text-gray-500">
                        {Math.round(zoneLossData[0]?.loss || 0).toLocaleString()} m³ lost
                      </span>
                    </div>
                  </>
                ) : (
                  <span className="text-gray-500">No data available</span>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Loss Distribution Chart */}
          <Card className="mb-6">
            <CardHeader className="pb-2">
              <CardTitle>Loss Distribution by Zone</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-96">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full">
                  <div>
                    <BarChart
                      width={500}
                      height={300}
                      data={zoneLossData}
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip formatter={(value: number) => Math.round(value).toLocaleString() + ' m³'} />
                      <Legend />
                      <Bar 
                        dataKey="loss" 
                        fill={colors.loss} 
                        name="Water Loss" 
                      />
                    </BarChart>
                  </div>
                  <div>
                    <PieChart width={400} height={300}>
                      <Pie
                        data={zoneLossPieData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      >
                        {zoneLossPieData.map((entry, index) => (
                          <Cell 
                            key={`cell-${index}`} 
                            fill={colors.zoneColors[index % colors.zoneColors.length]} 
                          />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(value: number) => Math.round(value).toLocaleString() + ' m³'} 
                      />
                    </PieChart>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Loss Trend Chart */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Monthly Loss Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-96">
                <LineChart
                  width={900}
                  height={300}
                  data={monthlyTrendData}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="month" 
                    tickFormatter={(value) => value.replace('_', ' ').toUpperCase()}
                  />
                  <YAxis yAxisId="left" orientation="left" />
                  <YAxis yAxisId="right" orientation="right" unit="%" />
                  <Tooltip 
                    formatter={(value: number, name: string) => {
                      if (name === "lossPercentage") {
                        return [value.toFixed(1) + '%', 'Loss %'];
                      }
                      return [Math.round(value).toLocaleString() + ' m³', name === 'consumption' ? 'Consumption' : 'Loss'];
                    }}
                    labelFormatter={(label: string) => label.replace('_', ' ').toUpperCase()}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="consumption"
                    stroke={colors.consumption}
                    yAxisId="left"
                    name="Consumption"
                    dot={{ r: 2 }}
                    activeDot={{ r: 6 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="loss"
                    stroke={colors.loss}
                    yAxisId="left"
                    name="Loss"
                    dot={{ r: 2 }}
                    activeDot={{ r: 6 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="lossPercentage"
                    stroke="#FF9800"
                    yAxisId="right"
                    name="Loss %"
                    dot={{ r: 2 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default WaterLossAnalysis;
