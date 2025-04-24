
import React from 'react';
import { useWaterSystem } from '@/hooks/useWaterSystem';
import Layout from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
  Cell
} from 'recharts';

const WaterZoneAnalysis = () => {
  const { waterData, loading, error } = useWaterSystem();

  if (loading) {
    return (
      <Layout>
        <div className="p-8">Loading...</div>
      </Layout>
    );
  }

  if (error || !waterData) {
    return (
      <Layout>
        <div className="p-8">Error: {error || 'No data available'}</div>
      </Layout>
    );
  }

  // Prepare data for charts
  const zoneData = Object.entries(waterData.zones).map(([zone, data]) => ({
    name: zone,
    consumption: data.consumption,
    loss: data.loss,
    total: data.consumption + data.loss
  }));

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

  return (
    <Layout>
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-4">Water Consumption by Zone</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Consumption Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80 w-full">
                <BarChart
                  width={500}
                  height={300}
                  data={zoneData}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="consumption" name="Consumption" fill="#8884d8" />
                  <Bar dataKey="loss" name="Loss" fill="#82ca9d" />
                </BarChart>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Total Water Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80 w-full">
                <PieChart width={400} height={300}>
                  <Pie
                    data={zoneData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="total"
                  >
                    {zoneData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => value.toLocaleString()} />
                </PieChart>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default WaterZoneAnalysis;
