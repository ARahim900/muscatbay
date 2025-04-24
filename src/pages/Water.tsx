
import React, { useState, useEffect } from 'react';
import Layout from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useIsMobile } from '@/hooks/use-mobile';
import StatCard from '@/components/dashboard/StatCard';
import { Droplets, Gauge, TrendingDown, TrendingUp } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { useWaterData } from '@/hooks/useWaterData';
import { WaterSystemMetrics, ZoneData, TypeData } from '@/types/water';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#FF6B6B'];
const WATER_RATE = 2.5; // OMR per cubic meter

const WaterPage = () => {
  const { data, loading, error } = useWaterData();
  const isMobile = useIsMobile();
  const [metrics, setMetrics] = useState<WaterSystemMetrics>({
    totalConsumption: 0,
    totalLoss: 0,
    efficiency: 0,
    averageDailyUsage: 0,
    waterRate: WATER_RATE,
    monthlyCost: 0
  });
  
  const [zoneData, setZoneData] = useState<ZoneData[]>([]);
  const [typeData, setTypeData] = useState<TypeData[]>([]);

  useEffect(() => {
    if (data) {
      // Calculate metrics from data
      const totalConsumption = data.total?.consumption || 0;
      const totalLoss = data.total?.loss || 0;
      const totalWater = totalConsumption + totalLoss;
      const efficiency = totalWater > 0 ? (totalConsumption / totalWater) * 100 : 0;
      const monthlyCost = totalConsumption * WATER_RATE;
      
      setMetrics({
        totalConsumption,
        totalLoss,
        efficiency,
        averageDailyUsage: Math.round(totalConsumption / 30), // Assuming a 30-day month
        waterRate: WATER_RATE,
        monthlyCost
      });
      
      // Prepare zone data for charts
      if (data.zones && Array.isArray(data.zones)) {
        const zones = data.zones.map(zone => ({
          name: zone.name,
          consumption: zone.consumption,
          loss: zone.loss,
          percentage: totalConsumption > 0 ? (zone.consumption / totalConsumption) * 100 : 0
        }));
        setZoneData(zones);
      }
      
      // Placeholder for type data
      const types = [
        { name: 'Potable', value: Math.round(totalConsumption * 0.65), percentage: 65 },
        { name: 'Irrigation', value: Math.round(totalConsumption * 0.25), percentage: 25 },
        { name: 'Amenities', value: Math.round(totalConsumption * 0.10), percentage: 10 }
      ];
      setTypeData(types);
    }
  }, [data]);

  if (loading) {
    return (
      <Layout>
        <div className="p-4">Loading water system data...</div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="p-4 text-red-500">Error loading water system data: {error}</div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto p-4">
        <h1 className="text-3xl font-bold mb-6">Water System Dashboard</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatCard
            title="Total Water Consumption"
            value={`${metrics.totalConsumption.toLocaleString()} m³`}
            description={`${metrics.monthlyCost.toLocaleString()} OMR`}
            icon={Droplets}
            color="primary"
          />
          
          <StatCard
            title="System Efficiency"
            value={`${metrics.efficiency.toFixed(1)}%`}
            description="Water utilization rate"
            icon={Gauge}
            color="teal"
          />
          
          <StatCard
            title="Average Daily Usage"
            value={`${metrics.averageDailyUsage.toLocaleString()} m³`}
            description={`${(metrics.averageDailyUsage * WATER_RATE).toLocaleString()} OMR/day`}
            icon={TrendingUp}
            color="lavender"
          />
          
          <StatCard
            title="Total Water Loss"
            value={`${metrics.totalLoss.toLocaleString()} m³`}
            description={`${(100 - metrics.efficiency).toFixed(1)}% of supply`}
            icon={TrendingDown}
            color="amber"
          />
        </div>
        
        <Tabs defaultValue="overview" className="w-full">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="zones">Zones</TabsTrigger>
            <TabsTrigger value="types">Types</TabsTrigger>
            <TabsTrigger value="trends">Trends</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Consumption by Zone</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={zoneData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          outerRadius={isMobile ? 80 : 120}
                          fill="#8884d8"
                          dataKey="consumption"
                          nameKey="name"
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        >
                          {zoneData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => [`${value.toLocaleString()} m³`, 'Consumption']} />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Water Loss by Zone</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={zoneData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          outerRadius={isMobile ? 80 : 120}
                          fill="#8884d8"
                          dataKey="loss"
                          nameKey="name"
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        >
                          {zoneData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => [`${value.toLocaleString()} m³`, 'Loss']} />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="zones">
            <div className="grid grid-cols-1 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Zone Details</CardTitle>
                </CardHeader>
                <CardContent>
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2">Zone</th>
                        <th className="text-right py-2">Consumption (m³)</th>
                        <th className="text-right py-2">Loss (m³)</th>
                        <th className="text-right py-2">Efficiency</th>
                        <th className="text-right py-2">Cost (OMR)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {zoneData.map((zone, index) => {
                        const totalWater = zone.consumption + zone.loss;
                        const efficiency = totalWater > 0 ? ((zone.consumption / totalWater) * 100).toFixed(1) : '0.0';
                        
                        return (
                          <tr key={index} className="border-b">
                            <td className="py-2">{zone.name}</td>
                            <td className="text-right py-2">{zone.consumption.toLocaleString()}</td>
                            <td className="text-right py-2">{zone.loss.toLocaleString()}</td>
                            <td className="text-right py-2">{efficiency}%</td>
                            <td className="text-right py-2">{(zone.consumption * WATER_RATE).toLocaleString()}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="types">
            <div className="grid grid-cols-1 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Water Usage by Type</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={typeData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          outerRadius={isMobile ? 80 : 120}
                          fill="#8884d8"
                          dataKey="value"
                          nameKey="name"
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        >
                          {typeData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => [`${value.toLocaleString()} m³`, 'Usage']} />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="trends">
            <Card>
              <CardHeader>
                <CardTitle>Monthly Trends Coming Soon</CardTitle>
              </CardHeader>
              <CardContent>
                <p>Historical trend data will be available in the next update.</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default WaterPage;
