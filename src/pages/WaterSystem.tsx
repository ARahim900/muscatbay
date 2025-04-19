
import React from 'react';
import { useWaterSystem } from '@/hooks/useWaterSystem';
import Layout from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { Droplets } from 'lucide-react';
import WaterFilters from '@/components/water/WaterFilters';

const WaterSystem = () => {
  const {
    waterData,
    loading,
    error,
    filters,
    availableZones,
    availableTypes,
    updateFilters
  } = useWaterSystem();

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

  if (error) {
    return (
      <Layout>
        <div className="p-8">
          <div className="text-red-500">Error: {error}</div>
        </div>
      </Layout>
    );
  }

  if (!waterData) {
    return (
      <Layout>
        <div className="p-8">No data available</div>
      </Layout>
    );
  }

  const COLORS = {
    L1: '#4285F4',
    L2: '#34A853',
    L3: '#FBBC05',
    loss: '#EA4335'
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat().format(Math.round(num));
  };

  return (
    <Layout>
      <div className="bg-gray-50 min-h-screen">
        <div className="bg-white shadow">
          <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6">
            <div className="flex items-center">
              <Droplets className="h-6 w-6 mr-2 text-blue-600" />
              <h1 className="text-2xl font-semibold text-gray-800">Water System Overview</h1>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6">
          <WaterFilters 
            filters={filters}
            availableZones={availableZones}
            availableTypes={availableTypes}
            onFilterChange={updateFilters}
            onReset={() => updateFilters({
              month: 'feb_25',
              zone: 'all',
              type: 'all'
            })}
          />

          {/* Level Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            {Object.entries(waterData.levels).map(([level, value]) => (
              <Card key={level}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg font-medium text-gray-700">
                    Level {level.substring(1)} Consumption
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-baseline">
                    <span className="text-3xl font-bold" style={{ color: COLORS[level as keyof typeof COLORS] }}>
                      {formatNumber(value)}
                    </span>
                    <span className="ml-2 text-gray-500">m³</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Monthly Trends Chart */}
          <Card className="mb-6">
            <CardHeader className="pb-2">
              <CardTitle>Monthly Consumption & Loss Trends</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-96">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={Object.entries(waterData.monthlyTrends).map(([month, data]) => ({
                      month,
                      consumption: data.consumption,
                      loss: data.loss
                    }))}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="month" 
                      tickFormatter={(value) => value.replace('_', ' ').toUpperCase()}
                    />
                    <YAxis />
                    <Tooltip 
                      formatter={(value: number) => formatNumber(value)}
                      labelFormatter={(label: string) => label.replace('_', ' ').toUpperCase()}
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="consumption"
                      stroke={COLORS.L1}
                      activeDot={{ r: 8 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="loss"
                      stroke={COLORS.loss}
                      activeDot={{ r: 8 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default WaterSystem;
